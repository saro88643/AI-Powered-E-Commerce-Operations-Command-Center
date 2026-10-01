const express = require('express');
const router = express.Router();
const { getCollection } = require('../db/mongo');
const { query } = require('../db/postgres');
const { authenticate } = require('../middleware/auth');

// GET /api/customers
router.get('/', authenticate, async (req, res) => {
  const { city, segment, search, page = 1, limit = 25 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const custColl = getCollection('customers');
    let filter = {};
    if (city) filter.city = new RegExp(city, 'i');
    if (segment) filter.segment = segment;
    if (search) {
      filter.$or = [
        { customer_id: new RegExp(search, 'i') },
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const total = await custColl.countDocuments(filter);
    const data = await custColl.find(filter).skip(skip).limit(parseInt(limit)).toArray();

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      data
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers: ' + err.message });
  }
});

// GET /api/customers/:id (Customer 360 view)
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const custColl = getCollection('customers');
    const customer = await custColl.findOne({
      $or: [{ customer_id: id }, { customer_id: id.toUpperCase() }]
    });

    if (!customer) {
      return res.status(404).json({ error: `Customer ${id} not found` });
    }

    // 1. Fetch Orders from PostgreSQL
    const ordRes = await query(`
      SELECT o.*, w.name as warehouse_name
      FROM orders o
      LEFT JOIN warehouses w ON o.warehouse_id = w.id
      WHERE o.customer_id = $1
      ORDER BY o.order_date DESC
    `, [customer.customer_id]);

    // 2. Fetch Support Tickets from MongoDB
    const tickColl = getCollection('support_tickets');
    const tickets = await tickColl.find({ customer_id: customer.customer_id }).toArray();

    // 3. Fetch Returns
    const retRes = await query(`
      SELECT r.* 
      FROM returns r
      JOIN orders o ON r.order_id = o.id
      WHERE o.customer_id = $1
      ORDER BY r.created_at DESC
    `, [customer.customer_id]);

    res.json({
      profile: customer,
      metrics: {
        totalOrders: ordRes.rows.length,
        totalSpend: ordRes.rows.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
        delayedOrdersCount: ordRes.rows.filter(o => o.status === 'delayed').length,
        openTicketsCount: tickets.filter(t => t.status !== 'resolved').length,
        totalReturnsCount: retRes.rows.length
      },
      orders: ordRes.rows,
      supportTickets: tickets,
      returns: retRes.rows,
      customerEvents: [
        { eventType: 'support_ticket', description: 'Customer opened ticket regarding delivery SLA', timestamp: new Date(Date.now() - 86400000).toISOString() },
        { eventType: 'checkout', description: 'Placed order ORD-00001 via Web Channel', timestamp: new Date(Date.now() - 345600000).toISOString() }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer 360 profile: ' + err.message });
  }
});

module.exports = router;
