const express = require('express');
const router = express.Router();
const { getCollection } = require('../db/mongo');
const { query } = require('../db/postgres');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/support and /api/support/tickets
router.get('/', (req, res, next) => {
  req.url = '/tickets' + (req.url === '/' ? '' : req.url);
  next();
});

// GET /api/support/tickets
router.get('/tickets', authenticate, async (req, res) => {
  const { category, priority, status, customerId, orderId, search, page = 1, limit = 25 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const tickColl = getCollection('support_tickets');
    let filter = {};
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (customerId) filter.customer_id = customerId;
    if (orderId) filter.order_id = orderId;
    if (search) {
      filter.$or = [
        { ticket_id: new RegExp(search, 'i') },
        { customer_id: new RegExp(search, 'i') },
        { order_id: new RegExp(search, 'i') },
        { message: new RegExp(search, 'i') }
      ];
    }

    const total = await tickColl.countDocuments(filter);
    const data = await tickColl.find(filter).skip(skip).limit(parseInt(limit)).toArray();

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      data
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets: ' + err.message });
  }
});

// GET /api/support/repeat-contacts
router.get('/repeat-contacts', authenticate, async (req, res) => {
  try {
    const tickColl = getCollection('support_tickets');
    const allTickets = await tickColl.find({}).toArray();

    // Group by customer_id
    const customerMap = {};
    for (const t of allTickets) {
      if (!customerMap[t.customer_id]) {
        customerMap[t.customer_id] = [];
      }
      customerMap[t.customer_id].push(t);
    }

    // Customers with >= 3 tickets
    const repeatCustomers = Object.entries(customerMap)
      .filter(([_, tickets]) => tickets.length >= 3)
      .map(([customerId, tickets]) => ({
        customerId,
        ticketCount: tickets.length,
        openCount: tickets.filter(t => t.status !== 'resolved').length,
        urgentCount: tickets.filter(t => t.priority === 'urgent').length,
        primaryCategory: tickets[0]?.category,
        tickets
      }))
      .sort((a, b) => b.ticketCount - a.ticketCount);

    res.json({
      totalRepeatCustomers: repeatCustomers.length,
      data: repeatCustomers
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to analyze repeat contacts: ' + err.message });
  }
});

// PATCH /api/support/tickets/:id/status
router.patch('/tickets/:id/status', authenticate, authorize(['Admin', 'Operations Manager', 'Support Agent']), async (req, res) => {
  const { id } = req.params;
  const { status, resolutionNote } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const tickColl = getCollection('support_tickets');
    await tickColl.updateOne(
      { ticket_id: id },
      {
        $set: {
          status,
          resolution_note: resolutionNote,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }
      }
    );

    // Audit log
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'UPDATE_TICKET_STATUS', 'TICKET', $3, $4, $5, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      `aud-${Date.now().toString().slice(-6)}`,
      req.user.email,
      id,
      resolutionNote || `Status updated to ${status}`,
      JSON.stringify({ newStatus: status, updatedBy: req.user.email })
    ]);

    res.json({ message: `Ticket ${id} status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ticket: ' + err.message });
  }
});

// POST /api/support/tickets
router.post('/tickets', authenticate, async (req, res) => {
  const { customerId, orderId, category, priority, message } = req.body;
  if (!customerId || !message) {
    return res.status(400).json({ error: 'customerId and message are required' });
  }

  try {
    const tickColl = getCollection('support_tickets');
    const ticketId = `TCK-${Date.now().toString().slice(-5)}`;
    const newTicket = {
      ticket_id: ticketId,
      customer_id: customerId,
      order_id: orderId || null,
      category: category || 'general',
      priority: priority || 'medium',
      message,
      status: 'open',
      created_at: new Date().toISOString(),
      resolved_at: null
    };

    await tickColl.insertOne(newTicket);
    res.status(201).json(newTicket);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create ticket: ' + err.message });
  }
});

module.exports = router;
