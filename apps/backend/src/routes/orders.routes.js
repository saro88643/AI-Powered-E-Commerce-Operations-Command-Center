const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const { getCollection } = require('../db/mongo');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/orders
router.get('/', authenticate, async (req, res) => {
  const { status, city, warehouseId, channel, search, page = 1, limit = 25 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let whereClauses = [];
    let params = [];

    if (status) {
      params.push(status);
      whereClauses.push(`o.status = $${params.length}`);
    }
    if (city) {
      params.push(city);
      whereClauses.push(`LOWER(o.shipping_city) = LOWER($${params.length})`);
    }
    if (warehouseId) {
      params.push(warehouseId);
      whereClauses.push(`(o.warehouse_id = $${params.length} OR w.code = $${params.length})`);
    }
    if (channel) {
      params.push(channel);
      whereClauses.push(`o.channel = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`(o.order_number ILIKE $${params.length} OR o.customer_id ILIKE $${params.length} OR o.shipping_address ILIKE $${params.length})`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count query
    const countRes = await query(`
      SELECT COUNT(*) as count 
      FROM orders o 
      LEFT JOIN warehouses w ON o.warehouse_id = w.id
      ${whereSQL}
    `, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // Data query
    params.push(parseInt(limit));
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const dataRes = await query(`
      SELECT 
        o.id, o.order_number, o.customer_id, o.channel, o.warehouse_id, 
        w.code as warehouse_code, w.name as warehouse_name,
        o.order_date, o.status, o.total_amount, o.shipping_city, 
        o.expected_delivery, o.actual_delivery, o.created_at
      FROM orders o
      LEFT JOIN warehouses w ON o.warehouse_id = w.id
      ${whereSQL}
      ORDER BY o.order_date DESC
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
    res.status(500).json({ error: 'Failed to fetch orders: ' + err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const ordRes = await query(`
      SELECT 
        o.*, 
        w.code as warehouse_code, w.name as warehouse_name, w.city as warehouse_city
      FROM orders o
      LEFT JOIN warehouses w ON o.warehouse_id = w.id
      WHERE o.id = $1 OR o.order_number = $1
    `, [id]);

    if (ordRes.rows.length === 0) {
      return res.status(404).json({ error: `Order ${id} not found` });
    }

    const order = ordRes.rows[0];

    // Fetch order items
    const itemsRes = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    order.items = itemsRes.rows;

    // Fetch payment
    const payRes = await query('SELECT * FROM payments WHERE order_id = $1', [order.id]);
    order.payment = payRes.rows[0] || null;

    // Fetch returns
    const retRes = await query('SELECT * FROM returns WHERE order_id = $1', [order.id]);
    order.returns = retRes.rows;

    // Fetch customer details from MongoDB
    const custColl = getCollection('customers');
    order.customer = await custColl.findOne({ customer_id: order.customer_id });

    // Fetch support tickets from MongoDB
    const tickColl = getCollection('support_tickets');
    order.supportTickets = await tickColl.find({
      $or: [{ order_id: order.order_number }, { order_id: order.id }]
    }).toArray();

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order details: ' + err.message });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', authenticate, authorize(['Admin', 'Operations Manager', 'Warehouse Manager', 'Support Agent']), async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'New status is required' });
  }

  try {
    const prevRes = await query('SELECT * FROM orders WHERE id = $1 OR order_number = $1', [id]);
    if (prevRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const prevOrder = prevRes.rows[0];

    await query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, prevOrder.id]);

    // Record in Audit Log
    const auditId = `aud-${Date.now().toString().slice(-6)}`;
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      auditId,
      req.user.email,
      'UPDATE_ORDER_STATUS',
      'ORDER',
      prevOrder.order_number,
      reason || `Status updated from ${prevOrder.status} to ${status}`,
      JSON.stringify({ previousStatus: prevOrder.status, newStatus: status, updatedBy: req.user.email })
    ]);

    res.json({
      message: `Order ${prevOrder.order_number} status updated to ${status}`,
      orderId: prevOrder.id,
      newStatus: status,
      auditId
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status: ' + err.message });
  }
});

module.exports = router;
