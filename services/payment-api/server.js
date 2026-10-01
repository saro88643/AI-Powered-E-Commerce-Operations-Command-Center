const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PAYMENT_API_PORT || 4003;

app.use(cors());
app.use(express.json());

// Load seed data
const payPath = path.join(__dirname, '../../data/generated/payments.json');
let payments = [];
try {
  payments = JSON.parse(fs.readFileSync(payPath, 'utf8'));
} catch (e) {
  console.warn('[Payment API] Warning: could not load payments.json');
}

// Failure simulator state
let failureConfig = {
  enabled: false,
  mode: 'none', // 'none' | 'degraded' | 'timeout' | 'error_500' | 'slow'
  latencyMs: 0,
  errorReason: 'Payment Gateway Clearing House Unavailable'
};

// Middleware for failure simulation
app.use((req, res, next) => {
  if (req.path.startsWith('/simulator') || req.path === '/health') {
    return next();
  }

  if (failureConfig.enabled) {
    if (failureConfig.mode === 'timeout') {
      return setTimeout(() => {
        res.status(504).json({ error: 'Gateway Timeout: Bank switch timeout' });
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
      service: 'payment-api',
      status: 'degraded',
      port: PORT,
      responseTime: Date.now() - start + 520,
      error: failureConfig.errorReason,
      lastSync: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    });
  }
  if (failureConfig.enabled && failureConfig.mode === 'error_500') {
    return res.status(500).json({
      service: 'payment-api',
      status: 'unhealthy',
      port: PORT,
      responseTime: Date.now() - start,
      error: failureConfig.errorReason
    });
  }
  res.json({
    service: 'payment-api',
    status: 'healthy',
    port: PORT,
    responseTime: Math.floor(Math.random() * 25) + 12,
    timestamp: new Date().toISOString()
  });
});

// GET /payments/:orderId
app.get('/payments/:orderId', (req, res) => {
  const { orderId } = req.params;
  const payment = payments.find(p => 
    p.order_id.toLowerCase() === orderId.toLowerCase() ||
    p.id.toLowerCase() === orderId.toLowerCase()
  );
  if (!payment) {
    return res.status(404).json({ error: `Payment record for ${orderId} not found` });
  }
  res.json(payment);
});

// POST /payments/refund
app.post('/payments/refund', (req, res) => {
  const { orderId, amount, reason, authorizedBy } = req.body;
  if (!orderId || !amount) {
    return res.status(400).json({ error: 'orderId and amount are required' });
  }

  const payment = payments.find(p => p.order_id.toLowerCase() === orderId.toLowerCase());
  if (payment) {
    payment.status = 'refunded';
  }

  res.status(200).json({
    message: `Refund of INR ${amount} processed successfully`,
    refundId: `REF-TXN-${Date.now().toString().slice(-6)}`,
    orderId,
    amount,
    reason: reason || 'Customer compensation / cancellation',
    status: 'SUCCESS',
    authorizedBy: authorizedBy || 'Operations Lead',
    settlementDate: new Date().toISOString()
  });
});

// Simulator endpoints
app.post('/simulator/configure', (req, res) => {
  const { enabled, mode, latencyMs, errorReason } = req.body;
  failureConfig.enabled = enabled !== undefined ? enabled : failureConfig.enabled;
  failureConfig.mode = mode || failureConfig.mode;
  failureConfig.latencyMs = latencyMs !== undefined ? latencyMs : failureConfig.latencyMs;
  failureConfig.errorReason = errorReason || failureConfig.errorReason;
  res.json({ message: 'Payment API Simulator configured', config: failureConfig });
});

app.post('/simulator/toggle', (req, res) => {
  failureConfig.enabled = !failureConfig.enabled;
  if (failureConfig.enabled && failureConfig.mode === 'none') {
    failureConfig.mode = 'degraded';
  }
  res.json({ message: `Payment API Failure Simulator ${failureConfig.enabled ? 'ENABLED' : 'DISABLED'}`, config: failureConfig });
});

app.get('/simulator/status', (req, res) => {
  res.json(failureConfig);
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Payment API] running on port ${PORT}`);
  });
}
