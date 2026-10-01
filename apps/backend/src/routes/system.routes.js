const express = require('express');
const router = express.Router();
const qualityEngine = require('../dataQuality/qualityEngine');
const { query } = require('../db/postgres');
const { authenticate } = require('../middleware/auth');

// In-memory system activity logs
const systemLogs = [
  { id: 'log-1', level: 'INFO', service: 'API-GATEWAY', message: 'ShopSphere Gateway initialized on port 3000', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'log-2', level: 'WARN', service: 'INVENTORY-SYNC', message: 'Warehouse W03 heartbeat latency spike (420ms)', timestamp: new Date(Date.now() - 2400000).toISOString() },
  { id: 'log-3', level: 'ERROR', service: 'DELIVERY-CONNECTOR', message: 'SpeedFast logistics reported highway congestion near Salem corridor', timestamp: new Date(Date.now() - 1200000).toISOString() },
  { id: 'log-4', level: 'INFO', service: 'DATA-QUALITY', message: 'Scheduled data quality audit completed: score 92.4%', timestamp: new Date(Date.now() - 300000).toISOString() }
];

// GET /api/system/logs
router.get('/logs', authenticate, async (req, res) => {
  const auditRes = await query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 20');
  
  const combined = [
    ...systemLogs,
    ...auditRes.rows.map(a => ({
      id: a.id,
      level: a.status === 'SUCCESS' ? 'INFO' : 'ERROR',
      service: 'AUDIT',
      message: `${a.user_email} executed ${a.action} on ${a.entity} (${a.entity_id}): ${a.reason}`,
      timestamp: a.timestamp
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json(combined);
});

// GET /api/system/data-quality
router.get('/data-quality', authenticate, async (req, res) => {
  try {
    const report = await qualityEngine.runAudit();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to run data quality audit: ' + err.message });
  }
});

// GET /api/system/notifications
router.get('/notifications', authenticate, async (req, res) => {
  const notifications = [
    {
      id: 'notif-1',
      title: 'Warehouse W03 Sync Discrepancy',
      type: 'critical',
      message: '143 delayed orders in Coimbatore region linked to zero physical stock on Product P-204 at W03.',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      actionRoute: '/ai',
      actionLabel: 'Investigate in AI Console'
    },
    {
      id: 'notif-2',
      title: 'Carrier Route Alert',
      type: 'warning',
      message: 'SpeedFast Logistics reported delivery delay backlog on South Highway corridor.',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      actionRoute: '/delivery',
      actionLabel: 'View Logistics'
    },
    {
      id: 'notif-3',
      title: 'Repeat Customer Escalation',
      type: 'warning',
      message: 'VIP Customer Arjun Sundaram has opened 3 tickets regarding order ORD-00001.',
      timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
      actionRoute: '/support',
      actionLabel: 'Review Tickets'
    },
    {
      id: 'notif-4',
      title: 'High Return Rate Alert',
      type: 'info',
      message: 'Product P-512 (ErgoComfort Mesh Chair) return rate reached 24.5%. Supplier audit recommended.',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      actionRoute: '/products',
      actionLabel: 'View Product'
    }
  ];

  res.json(notifications);
});

module.exports = router;
