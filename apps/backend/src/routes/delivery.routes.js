const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { query } = require('../db/postgres');
const { ShopSphereDeliveryConnector } = require('../connectors/DeliveryConnector');
const { authenticate, authorize } = require('../middleware/auth');

const connector = new ShopSphereDeliveryConnector();

// GET /api/delivery/metrics
router.get('/metrics', authenticate, async (req, res) => {
  try {
    const delivData = await connector.getDelayedDeliveries({});
    
    // Partner benchmarks
    const partnerStats = [
      { partner: 'SpeedFast', onTimeRate: 81.4, totalVolume: 4200, avgTransitDays: 3.2, status: 'Probation (South corridor delay)' },
      { partner: 'BlueDart', onTimeRate: 96.8, totalVolume: 4800, avgTransitDays: 1.8, status: 'Optimal' },
      { partner: 'Delhivery', onTimeRate: 94.2, totalVolume: 3500, avgTransitDays: 2.1, status: 'Optimal' },
      { partner: 'ExpressCargo', onTimeRate: 89.5, totalVolume: 1500, avgTransitDays: 2.8, status: 'Acceptable' },
      { partner: 'LocalHub', onTimeRate: 92.1, totalVolume: 1000, avgTransitDays: 1.2, status: 'Optimal' }
    ];

    res.json({
      totalDeliveries: 15000,
      onTimePercentage: 89.7,
      delayedDeliveriesCount: delivData.total || 450,
      partnerStats,
      isCached: delivData.isCached || false,
      lastSuccessfulSync: delivData.lastSuccessfulSync
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch delivery metrics: ' + err.message });
  }
});

// GET /api/delivery/delayed
router.get('/delayed', authenticate, async (req, res) => {
  const { city, partner, page = 1, limit = 25 } = req.query;

  try {
    const data = await connector.getDelayedDeliveries({ city, partner, page, limit });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch delayed deliveries: ' + err.message });
  }
});

// POST /api/delivery/escalate
router.post('/escalate', authenticate, authorize(['Admin', 'Operations Manager', 'Support Agent']), async (req, res) => {
  const { orderId, reason, priority, alternatePartner } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  try {
    const result = await connector.escalateDelivery({ orderId, reason, priority, alternatePartner });

    // Record in audit log
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'DELIVERY_ESCALATION', 'DELIVERY', $3, $4, $5, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      `aud-${Date.now().toString().slice(-6)}`,
      req.user.email,
      orderId,
      reason || 'Courier delay escalation',
      JSON.stringify({ orderId, alternatePartner, priority })
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to escalate delivery: ' + err.message });
  }
});

module.exports = router;
