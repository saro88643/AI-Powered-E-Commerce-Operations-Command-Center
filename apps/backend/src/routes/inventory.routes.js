const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const { ShopSphereInventoryConnector } = require('../connectors/InventoryConnector');
const { authenticate, authorize } = require('../middleware/auth');

const connector = new ShopSphereInventoryConnector();

// GET /api/inventory
router.get('/', authenticate, async (req, res) => {
  const { status, warehouseId, category, search, page = 1, limit = 25 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let whereClauses = [];
    let params = [];

    if (status) {
      params.push(status);
      whereClauses.push(`i.status = $${params.length}`);
    }
    if (warehouseId) {
      params.push(warehouseId);
      whereClauses.push(`(i.warehouse_id = $${params.length} OR i.warehouse_code = $${params.length})`);
    }
    if (category) {
      params.push(category);
      whereClauses.push(`i.category = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`(i.product_id ILIKE $${params.length} OR i.sku ILIKE $${params.length} OR i.product_name ILIKE $${params.length})`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) as count FROM inventory i ${whereSQL}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(parseInt(limit));
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const dataRes = await query(`
      SELECT 
        i.*, 
        w.name as warehouse_name, w.city as warehouse_city
      FROM inventory i
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      ${whereSQL}
      ORDER BY 
        CASE 
          WHEN i.status = 'Mismatch' THEN 1
          WHEN i.status = 'Critical' THEN 2
          WHEN i.status = 'Low Stock' THEN 3
          ELSE 4
        END,
        i.available_quantity ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, params);

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: dataRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory: ' + err.message });
  }
});

// GET /api/inventory/transfers
router.get('/transfers', authenticate, async (req, res) => {
  try {
    const resTrans = await query(`
      SELECT 
        t.*,
        w1.name as from_warehouse_name, w1.code as from_warehouse_code,
        w2.name as to_warehouse_name, w2.code as to_warehouse_code
      FROM transfers t
      LEFT JOIN warehouses w1 ON t.from_warehouse_id = w1.id
      LEFT JOIN warehouses w2 ON t.to_warehouse_id = w2.id
      ORDER BY t.created_at DESC
    `);
    res.json(resTrans.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transfers: ' + err.message });
  }
});

// POST /api/inventory/transfers
router.post('/transfers', authenticate, authorize(['Admin', 'Operations Manager', 'Warehouse Manager']), async (req, res) => {
  const { productId, fromWarehouseId, toWarehouseId, quantity, reason } = req.body;

  if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
    return res.status(400).json({ error: 'Missing required transfer fields: productId, fromWarehouseId, toWarehouseId, quantity' });
  }

  try {
    // 1. Check source inventory
    const fromInv = await query(`
      SELECT * FROM inventory 
      WHERE product_id = $1 AND (warehouse_id = $2 OR warehouse_code = $2)
    `, [productId, fromWarehouseId]);

    if (fromInv.rows.length === 0 || fromInv.rows[0].available_quantity < quantity) {
      return res.status(400).json({
        error: `Insufficient stock at source warehouse ${fromWarehouseId}. Available: ${fromInv.rows[0]?.available_quantity || 0}`
      });
    }

    // 2. Fetch destination inventory
    const toInv = await query(`
      SELECT * FROM inventory 
      WHERE product_id = $1 AND (warehouse_id = $2 OR warehouse_code = $2)
    `, [productId, toWarehouseId]);

    // 3. Execute transfer transaction
    const fromRecord = fromInv.rows[0];
    const toRecord = toInv.rows[0];

    await query('UPDATE inventory SET available_quantity = available_quantity - $1 WHERE id = $2', [quantity, fromRecord.id]);
    
    if (toRecord) {
      await query(`
        UPDATE inventory 
        SET available_quantity = available_quantity + $1,
            status = CASE WHEN available_quantity + $1 > reorder_threshold THEN 'Healthy' ELSE status END
        WHERE id = $2
      `, [quantity, toRecord.id]);
    }

    // 4. Record transfer in database
    const transferNum = `TRF-${Date.now().toString().slice(-6)}`;
    const transId = `trf-${Date.now()}`;
    await query(`
      INSERT INTO transfers (id, transfer_number, product_id, product_name, from_warehouse_id, to_warehouse_id, quantity, status, reason, requested_by, executed_at, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      transId,
      transferNum,
      productId,
      fromRecord.product_name,
      fromRecord.warehouse_id,
      toRecord ? toRecord.warehouse_id : toWarehouseId,
      quantity,
      reason || 'Inventory rebalance transfer',
      req.user.email
    ]);

    // 5. Create Audit Log
    const auditId = `aud-${Date.now().toString().slice(-6)}`;
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      auditId,
      req.user.email,
      'CREATE_INVENTORY_TRANSFER',
      'TRANSFER',
      transferNum,
      reason || 'Resolve low inventory / recover delayed orders',
      JSON.stringify({
        productId,
        quantity,
        fromWarehouse: fromWarehouseId,
        toWarehouse: toWarehouseId,
        resultingSourceStock: fromRecord.available_quantity - quantity,
        resultingDestStock: (toRecord?.available_quantity || 0) + quantity
      })
    ]);

    // 6. Also call simulated external Inventory API to sync
    try {
      await connector.createTransfer({
        productId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        reason
      });
    } catch (apiErr) {
      console.warn('External inventory API sync warning:', apiErr.message);
    }

    res.status(201).json({
      message: `Transfer ${transferNum} created and executed successfully`,
      transferNumber: transferNum,
      productId,
      quantity,
      auditId,
      verifiedSourceStock: fromRecord.available_quantity - quantity,
      verifiedDestStock: (toRecord?.available_quantity || 0) + quantity
    });
  } catch (err) {
    res.status(500).json({ error: 'Transfer failed: ' + err.message });
  }
});

// POST /api/inventory/restock
router.post('/restock', authenticate, authorize(['Admin', 'Operations Manager', 'Warehouse Manager']), async (req, res) => {
  const { productId, warehouseId, supplierId, quantity } = req.body;
  if (!productId || !warehouseId || !quantity) {
    return res.status(400).json({ error: 'Missing productId, warehouseId, or quantity' });
  }

  try {
    const reqNum = `RST-${Date.now().toString().slice(-6)}`;
    await query(`
      INSERT INTO restock_requests (id, request_number, product_id, warehouse_id, supplier_id, quantity, status, requested_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'ordered', $7, CURRENT_TIMESTAMP)
    `, [`rst-${Date.now()}`, reqNum, productId, warehouseId, supplierId || 'SUP-001', quantity, req.user.email]);

    // Audit log
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'CREATE_RESTOCK_REQUEST', 'RESTOCK', $3, 'Replenishment for low threshold', $4, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [`aud-${Date.now().toString().slice(-6)}`, req.user.email, reqNum, JSON.stringify({ productId, warehouseId, quantity })]);

    res.status(201).json({
      message: `Restock order ${reqNum} created for ${quantity} units`,
      requestNumber: reqNum
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create restock request: ' + err.message });
  }
});

// GET /api/inventory/events
router.get('/events', authenticate, async (req, res) => {
  try {
    const evRes = await query(`
      SELECT ie.*, w.name as warehouse_name, w.code as warehouse_code
      FROM inventory_events ie
      LEFT JOIN warehouses w ON ie.warehouse_id = w.id
      ORDER BY ie.created_at DESC
      LIMIT 100
    `);
    res.json(evRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory events: ' + err.message });
  }
});

module.exports = router;
