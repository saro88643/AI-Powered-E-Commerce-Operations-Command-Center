const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.CRM_API_PORT || 4004;

app.use(cors());
app.use(express.json());

// Load seed data
const custPath = path.join(__dirname, '../../data/generated/customers.json');
const ordersPath = path.join(__dirname, '../../data/generated/orders.json');
const ticketsPath = path.join(__dirname, '../../data/generated/support_tickets.json');

let customers = [];
let orders = [];
let tickets = [];

try {
  customers = JSON.parse(fs.readFileSync(custPath, 'utf8'));
  orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
  tickets = JSON.parse(fs.readFileSync(ticketsPath, 'utf8'));
} catch (e) {
  console.warn('[CRM API] Warning: could not load seed json files');
}

// Failure simulator state
let failureConfig = {
  enabled: false,
  mode: 'none', // 'none' | 'degraded' | 'timeout' | 'error_500' | 'slow'
  latencyMs: 0,
  errorReason: 'CRM Database replica lag exceeding 120s'
};

// Middleware for failure simulation
app.use((req, res, next) => {
  if (req.path.startsWith('/simulator') || req.path === '/health') {
    return next();
  }

  if (failureConfig.enabled) {
    if (failureConfig.mode === 'timeout') {
      return setTimeout(() => {
        res.status(504).json({ error: 'Gateway Timeout: External CRM System connection timed out' });
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
      service: 'crm-api',
      status: 'degraded',
      port: PORT,
      responseTime: Date.now() - start + 410,
      error: failureConfig.errorReason,
      lastSync: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
    });
  }
  if (failureConfig.enabled && failureConfig.mode === 'error_500') {
    return res.status(500).json({
      service: 'crm-api',
      status: 'unhealthy',
      port: PORT,
      responseTime: Date.now() - start,
      error: failureConfig.errorReason
    });
  }
  res.json({
    service: 'crm-api',
    status: 'healthy',
    port: PORT,
    responseTime: Math.floor(Math.random() * 30) + 15,
    timestamp: new Date().toISOString()
  });
});

// GET /customers/:customerId
app.get('/customers/:customerId', (req, res) => {
  const { customerId } = req.params;
  const customer = customers.find(c => c.customer_id.toLowerCase() === customerId.toLowerCase());
  if (!customer) {
    return res.status(404).json({ error: `Customer ${customerId} not found` });
  }
  res.json(customer);
});

// GET /customers/:customerId/history
app.get('/customers/:customerId/history', (req, res) => {
  const { customerId } = req.params;
  const customer = customers.find(c => c.customer_id.toLowerCase() === customerId.toLowerCase());
  if (!customer) {
    return res.status(404).json({ error: `Customer ${customerId} not found` });
  }

  const custOrders = orders.filter(o => o.customer_id.toLowerCase() === customerId.toLowerCase());
  const custTickets = tickets.filter(t => t.customer_id.toLowerCase() === customerId.toLowerCase());

  res.json({
    customer,
    totalOrders: custOrders.length,
    totalTickets: custTickets.length,
    orders: custOrders,
    supportTickets: custTickets
  });
});

// POST /customers/:customerId/notification
app.post('/customers/:customerId/notification', (req, res) => {
  const { customerId } = req.params;
  const { channel = 'sms', template, message, priority = 'normal' } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message content is required' });
  }

  res.status(200).json({
    message: `Notification queued for customer ${customerId}`,
    notificationId: `NOTIF-${Date.now().toString().slice(-6)}`,
    customerId,
    channel,
    status: 'SENT',
    sentAt: new Date().toISOString(),
    content: message
  });
});

// Simulator endpoints
app.post('/simulator/configure', (req, res) => {
  const { enabled, mode, latencyMs, errorReason } = req.body;
  failureConfig.enabled = enabled !== undefined ? enabled : failureConfig.enabled;
  failureConfig.mode = mode || failureConfig.mode;
  failureConfig.latencyMs = latencyMs !== undefined ? latencyMs : failureConfig.latencyMs;
  failureConfig.errorReason = errorReason || failureConfig.errorReason;
  res.json({ message: 'CRM API Simulator configured', config: failureConfig });
});

app.post('/simulator/toggle', (req, res) => {
  failureConfig.enabled = !failureConfig.enabled;
  if (failureConfig.enabled && failureConfig.mode === 'none') {
    failureConfig.mode = 'degraded';
  }
  res.json({ message: `CRM API Failure Simulator ${failureConfig.enabled ? 'ENABLED' : 'DISABLED'}`, config: failureConfig });
});

app.get('/simulator/status', (req, res) => {
  res.json(failureConfig);
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[CRM API] running on port ${PORT}`);
  });
}
