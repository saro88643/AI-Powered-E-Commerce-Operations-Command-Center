const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const { authenticate } = require('../middleware/auth');

// GET /api/warehouses
router.get('/', authenticate, async (req, res) => {
  try {
    const whRes = await query('SELECT * FROM warehouses ORDER BY code ASC');
    const warehouses = whRes.rows;

    // Enhance warehouses with dynamic order & inventory counts
    const enhanced = await Promise.all(warehouses.map(async (wh) => {
      // Inventory summary
      const invStats = await query(`
        SELECT 
          COUNT(*) as total_skus,
          COALESCE(SUM(available_quantity), 0) as total_available,
          COALESCE(SUM(CASE WHEN status = 'Mismatch' THEN 1 ELSE 0 END), 0) as mismatch_count
        FROM inventory 
        WHERE warehouse_id = $1
      `, [wh.id]);

      // Orders processed and delayed
      const ordStats = await query(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(CASE WHEN status = 'delayed' THEN 1 ELSE 0 END), 0) as delayed_orders
        FROM orders
        WHERE warehouse_id = $1
      `, [wh.id]);

      return {
        ...wh,
        inventoryCount: parseInt(invStats.rows[0]?.total_available || 0, 10),
        totalSkus: parseInt(invStats.rows[0]?.total_skus || 0, 10),
        mismatchCount: parseInt(invStats.rows[0]?.mismatch_count || 0, 10),
        ordersProcessed: parseInt(ordStats.rows[0]?.total_orders || 0, 10),
        delayedOrders: parseInt(ordStats.rows[0]?.delayed_orders || 0, 10)
      };
    }));

    res.json(enhanced);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch warehouses: ' + err.message });
  }
});

// GET /api/warehouses/:id
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const whRes = await query('SELECT * FROM warehouses WHERE id = $1 OR code = $1', [id]);
    if (whRes.rows.length === 0) {
      return res.status(404).json({ error: `Warehouse ${id} not found` });
    }

    const warehouse = whRes.rows[0];

    // Live inventory items
    const invRes = await query(`
      SELECT * FROM inventory 
      WHERE warehouse_id = $1 
      ORDER BY 
        CASE WHEN status = 'Mismatch' THEN 1 WHEN status = 'Critical' THEN 2 ELSE 3 END,
        available_quantity ASC
      LIMIT 100
    `, [warehouse.id]);

    // Recent orders
    const ordRes = await query(`
      SELECT id, order_number, customer_id, shipping_city, status, total_amount, expected_delivery, order_date
      FROM orders 
      WHERE warehouse_id = $1 
      ORDER BY order_date DESC 
      LIMIT 25
    `, [warehouse.id]);

    // Related Incidents
    const incRes = await query(`
      SELECT * FROM incidents 
      WHERE description ILIKE $1 OR title ILIKE $1
    `, [`%${warehouse.code}%`]);

    res.json({
      ...warehouse,
      inventory: invRes.rows,
      recentOrders: ordRes.rows,
      incidents: incRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch warehouse details: ' + err.message });
  }
});

module.exports = router;
