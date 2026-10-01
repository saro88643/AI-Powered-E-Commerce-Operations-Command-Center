const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.INVENTORY_API_PORT || 4001;

app.use(cors());
app.use(express.json());

// Load seed data
const invPath = path.join(__dirname, '../../data/generated/inventory.json');
let inventory = [];
try {
  inventory = JSON.parse(fs.readFileSync(invPath, 'utf8'));
} catch (e) {
  console.warn('[Inventory API] Warning: could not load initial inventory.json');
}

// Failure simulator state
let failureConfig = {
  enabled: false,
  mode: 'none', // 'none' | 'degraded' | 'timeout' | 'error_500' | 'slow'
  latencyMs: 0,
  errorReason: 'Inventory synchronization unavailable'
};

// Middleware for failure simulation
app.use((req, res, next) => {
  if (req.path.startsWith('/simulator') || req.path === '/health') {
    return next();
  }

  if (failureConfig.enabled) {
    if (failureConfig.mode === 'timeout') {
      return setTimeout(() => {
        res.status(504).json({ error: 'Gateway Timeout: External Inventory System did not respond in time' });
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
      service: 'inventory-api',
      status: 'degraded',
      port: PORT,
      responseTime: Date.now() - start + 450,
      error: failureConfig.errorReason,
      lastSync: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
    });
  }
  if (failureConfig.enabled && failureConfig.mode === 'error_500') {
    return res.status(500).json({
      service: 'inventory-api',
      status: 'unhealthy',
      port: PORT,
      responseTime: Date.now() - start,
      error: failureConfig.errorReason
    });
  }
  res.json({
    service: 'inventory-api',
    status: 'healthy',
    port: PORT,
    responseTime: Math.floor(Math.random() * 40) + 15,
    timestamp: new Date().toISOString()
  });
});

// GET /inventory
app.get('/inventory', (req, res) => {
  const { warehouseId, status, category, limit = 100, page = 1 } = req.query;
  let filtered = [...inventory];
  if (warehouseId) {
    filtered = filtered.filter(i => i.warehouse_id === warehouseId || i.warehouse_code === warehouseId);
  }
  if (status) {
    filtered = filtered.filter(i => i.status.toLowerCase() === status.toLowerCase());
  }
  if (category) {
    filtered = filtered.filter(i => i.category && i.category.toLowerCase() === category.toLowerCase());
  }
  const total = filtered.length;
  const startIdx = (parseInt(page) - 1) * parseInt(limit);
  const data = filtered.slice(startIdx, startIdx + parseInt(limit));

  res.json({
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    data
  });
});

// GET /inventory/:productId
app.get('/inventory/:productId', (req, res) => {
  const { productId } = req.params;
  const items = inventory.filter(i => i.product_id.toLowerCase() === productId.toLowerCase());
  if (items.length === 0) {
    return res.status(404).json({ error: `Product ${productId} not found in inventory` });
  }
  const totalAvailable = items.reduce((sum, item) => sum + item.available_quantity, 0);
  const totalReserved = items.reduce((sum, item) => sum + item.reserved_quantity, 0);
  res.json({
    productId,
    totalAvailable,
    totalReserved,
    warehouses: items
  });
});

// GET /inventory/:productId/:warehouseId
app.get('/inventory/:productId/:warehouseId', (req, res) => {
  const { productId, warehouseId } = req.params;
  const item = inventory.find(i => 
    i.product_id.toLowerCase() === productId.toLowerCase() &&
    (i.warehouse_id.toLowerCase() === warehouseId.toLowerCase() || (i.warehouse_code && i.warehouse_code.toLowerCase() === warehouseId.toLowerCase()))
  );
  if (!item) {
    return res.status(404).json({ error: `Inventory item for ${productId} at ${warehouseId} not found` });
  }
  res.json(item);
});

// POST /inventory/transfer
app.post('/inventory/transfer', (req, res) => {
  const { productId, fromWarehouseId, toWarehouseId, quantity, reason } = req.body;
  if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
    return res.status(400).json({ error: 'Missing required transfer fields: productId, fromWarehouseId, toWarehouseId, quantity' });
  }

  const fromItem = inventory.find(i => 
    i.product_id.toLowerCase() === productId.toLowerCase() &&
    (i.warehouse_id === fromWarehouseId || i.warehouse_code === fromWarehouseId)
  );
  const toItem = inventory.find(i => 
    i.product_id.toLowerCase() === productId.toLowerCase() &&
    (i.warehouse_id === toWarehouseId || i.warehouse_code === toWarehouseId)
  );

  if (!fromItem) {
    return res.status(400).json({ error: `Source warehouse ${fromWarehouseId} does not stock product ${productId}` });
  }
  if (fromItem.available_quantity < quantity) {
    return res.status(400).json({ error: `Insufficient stock at ${fromWarehouseId}. Available: ${fromItem.available_quantity}, Requested: ${quantity}` });
  }

  fromItem.available_quantity -= quantity;
  if (toItem) {
    toItem.available_quantity += quantity;
    if (toItem.status === 'Mismatch' || toItem.status === 'Critical') {
      toItem.status = 'Healthy';
    }
  }

  const transferRecord = {
    transferId: `TRF-${Date.now().toString().slice(-6)}`,
    productId,
    fromWarehouseId,
    toWarehouseId,
    quantity,
    reason: reason || 'Inventory balancing transfer',
    status: 'COMPLETED',
    executedAt: new Date().toISOString()
  };

  res.status(201).json({
    message: 'Inventory transfer executed successfully',
    transfer: transferRecord,
    updatedSourceStock: fromItem.available_quantity,
    updatedTargetStock: toItem ? toItem.available_quantity : quantity
  });
});

// Simulator endpoints
app.post('/simulator/configure', (req, res) => {
  const { enabled, mode, latencyMs, errorReason } = req.body;
  failureConfig.enabled = enabled !== undefined ? enabled : failureConfig.enabled;
  failureConfig.mode = mode || failureConfig.mode;
  failureConfig.latencyMs = latencyMs !== undefined ? latencyMs : failureConfig.latencyMs;
  failureConfig.errorReason = errorReason || failureConfig.errorReason;
  res.json({ message: 'Inventory API Simulator configured', config: failureConfig });
});

app.post('/simulator/toggle', (req, res) => {
  failureConfig.enabled = !failureConfig.enabled;
  if (failureConfig.enabled && failureConfig.mode === 'none') {
    failureConfig.mode = 'degraded';
  }
  res.json({ message: `Inventory API Failure Simulator ${failureConfig.enabled ? 'ENABLED' : 'DISABLED'}`, config: failureConfig });
});

app.get('/simulator/status', (req, res) => {
  res.json(failureConfig);
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Inventory API] running on port ${PORT}`);
  });
}
