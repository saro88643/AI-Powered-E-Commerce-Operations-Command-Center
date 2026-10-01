const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.DELIVERY_API_PORT || 4002;

app.use(cors());
app.use(express.json());

// Load seed data
const delivPath = path.join(__dirname, '../../data/generated/deliveries.json');
let deliveries = [];
try {
  deliveries = JSON.parse(fs.readFileSync(delivPath, 'utf8'));
} catch (e) {
  console.warn('[Delivery API] Warning: could not load deliveries.json');
}

// Failure simulator state
let failureConfig = {
  enabled: false,
  mode: 'none', // 'none' | 'degraded' | 'timeout' | 'error_500' | 'slow'
  latencyMs: 0,
  errorReason: 'Carrier API endpoint connection timed out'
};

// Middleware for failure simulation
app.use((req, res, next) => {
  if (req.path.startsWith('/simulator') || req.path === '/health') {
    return next();
  }

  if (failureConfig.enabled) {
    if (failureConfig.mode === 'timeout') {
      return setTimeout(() => {
        res.status(504).json({ error: 'Gateway Timeout: External Courier API did not respond' });
      }, 5000);
    }
    if (failureConfig.mode === 'error_500') {
      return res.status(500).json({ error: 'Internal Server Error: ' + failureConfig.errorReason });
    }
    if (failureConfig.mode === 'slow') {
      return setTimeout(next, failureConfig.latencyMs || 2500);
    }
  }
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  const start = Date.now();
  if (failureConfig.enabled && failureConfig.mode === 'degraded') {
    return res.status(200).json({
      service: 'delivery-api',
      status: 'degraded',
      port: PORT,
      responseTime: Date.now() - start + 380,
      error: failureConfig.errorReason,
      lastSync: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    });
  }
  if (failureConfig.enabled && failureConfig.mode === 'error_500') {
    return res.status(500).json({
      service: 'delivery-api',
      status: 'unhealthy',
      port: PORT,
      responseTime: Date.now() - start,
      error: failureConfig.errorReason
    });
  }
  res.json({
    service: 'delivery-api',
    status: 'healthy',
    port: PORT,
    responseTime: Math.floor(Math.random() * 35) + 20,
    timestamp: new Date().toISOString()
  });
});

// GET /delivery/delayed
app.get('/delivery/delayed', (req, res) => {
  const { city, partner, limit = 100, page = 1 } = req.query;
  let delayed = deliveries.filter(d => d.status === 'delayed');
  if (city) {
    delayed = delayed.filter(d => d.destination_city.toLowerCase() === city.toLowerCase());
  }
  if (partner) {
    delayed = delayed.filter(d => d.partner.toLowerCase() === partner.toLowerCase());
  }
  const total = delayed.length;
  const startIdx = (parseInt(page) - 1) * parseInt(limit);
  const data = delayed.slice(startIdx, startIdx + parseInt(limit));

  res.json({
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    delayedOrders: data
  });
});

// GET /delivery/:orderId
app.get('/delivery/:orderId', (req, res) => {
  const { orderId } = req.params;
  const delivery = deliveries.find(d => 
    d.order_id.toLowerCase() === orderId.toLowerCase() ||
    d.id.toLowerCase() === orderId.toLowerCase() ||
    d.tracking_number.toLowerCase() === orderId.toLowerCase()
  );
  if (!delivery) {
    return res.status(404).json({ error: `Delivery record for ${orderId} not found` });
  }
  res.json(delivery);
});

// POST /delivery/escalate
app.post('/delivery/escalate', (req, res) => {
  const { orderId, reason, priority = 'high', alternatePartner } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }
  const delivery = deliveries.find(d => d.order_id.toLowerCase() === orderId.toLowerCase());
  if (delivery) {
    delivery.delay_reason = reason || 'Escalated by operations manager';
    if (alternatePartner) {
      delivery.partner = alternatePartner;
    }
  }

  res.status(200).json({
    message: `Delivery for ${orderId} successfully escalated`,
    escalationId: `ESC-DEL-${Date.now().toString().slice(-6)}`,
    orderId,
    priority,
    alternatePartner: alternatePartner || (delivery ? delivery.partner : 'BlueDart Express'),
    timestamp: new Date().toISOString()
  });
});

// Simulator endpoints
app.post('/simulator/configure', (req, res) => {
  const { enabled, mode, latencyMs, errorReason } = req.body;
  failureConfig.enabled = enabled !== undefined ? enabled : failureConfig.enabled;
  failureConfig.mode = mode || failureConfig.mode;
  failureConfig.latencyMs = latencyMs !== undefined ? latencyMs : failureConfig.latencyMs;
  failureConfig.errorReason = errorReason || failureConfig.errorReason;
  res.json({ message: 'Delivery API Simulator configured', config: failureConfig });
});

app.post('/simulator/toggle', (req, res) => {
  failureConfig.enabled = !failureConfig.enabled;
  if (failureConfig.enabled && failureConfig.mode === 'none') {
    failureConfig.mode = 'degraded';
  }
  res.json({ message: `Delivery API Failure Simulator ${failureConfig.enabled ? 'ENABLED' : 'DISABLED'}`, config: failureConfig });
});

app.get('/simulator/status', (req, res) => {
  res.json(failureConfig);
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Delivery API] running on port ${PORT}`);
  });
}
