const express = require('express');
const router = express.Router();
const { getCollection } = require('../db/mongo');
const { optionalAuth } = require('../middleware/auth');

// Seed notifications fallback in memory in case Mongo is connecting or has minimal data
let memoryNotifications = [
  {
    id: 'notif-1',
    customer_id: 'CUST-0001',
    order_number: 'ORD-10291',
    title: 'Order Confirmed & Payment Verified',
    message: 'Your order for Wireless Keyboard P-204 (₹3,499) was confirmed and routed to Coimbatore Hub (W03).',
    type: 'ORDER_PLACED',
    read: false,
    created_at: new Date(Date.now() - 48 * 3600000).toISOString()
  },
  {
    id: 'notif-2',
    customer_id: 'CUST-0001',
    order_number: 'ORD-10291',
    title: '⚠ Shipment Transit Advisory',
    message: 'Your order #ORD-10291 is experiencing a minor fulfillment delay at the regional hub. Our operations team is addressing the route.',
    type: 'DELIVERY_DELAYED',
    read: false,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString()
  }
];

// GET /api/notifications
router.get('/', optionalAuth, async (req, res) => {
  const customerId = req.query.customerId || req.user?.customerId || req.user?.id || 'CUST-0001';

  try {
    const notifColl = getCollection('notifications');
    const mongoNotifs = await notifColl.find({
      $or: [
        { customer_id: customerId },
        { customer_id: 'SYSTEM_BROADCAST' },
        { customer_id: 'all' }
      ]
    }).sort({ created_at: -1 }).limit(50).toArray();

    if (mongoNotifs.length > 0) {
      return res.json({ notifications: mongoNotifs, unreadCount: mongoNotifs.filter(n => !n.read).length });
    }
  } catch (err) {
    // Mongo fallback
  }

  // Fallback to memory notifications
  const filtered = memoryNotifications.filter(n => n.customer_id === customerId || n.customer_id === 'SYSTEM_BROADCAST' || n.customer_id === 'CUST-0001');
  res.json({
    notifications: filtered,
    unreadCount: filtered.filter(n => !n.read).length
  });
});

// POST /api/notifications/:id/read
router.post('/:id/read', optionalAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const notifColl = getCollection('notifications');
    await notifColl.updateOne({ id }, { $set: { read: true } });
  } catch (e) {
    // update memory
    const item = memoryNotifications.find(n => n.id === id);
    if (item) item.read = true;
  }

  res.json({ success: true, message: `Notification ${id} marked as read.` });
});

// POST /api/notifications — Create notification (e.g. from checkout or AI resolution)
router.post('/', optionalAuth, async (req, res) => {
  const {
    customer_id = 'CUST-0001',
    order_number,
    title,
    message,
    type = 'SYSTEM_ALERT'
  } = req.body;

  const notifObj = {
    id: `notif-${Date.now()}`,
    customer_id,
    order_number,
    title: title || 'ShopSphere Update',
    message: message || '',
    type,
    read: false,
    created_at: new Date().toISOString()
  };

  try {
    const notifColl = getCollection('notifications');
    await notifColl.insertOne(notifObj);
  } catch (e) {
    memoryNotifications.unshift(notifObj);
  }

  res.status(201).json({ success: true, notification: notifObj });
});

module.exports = router;
