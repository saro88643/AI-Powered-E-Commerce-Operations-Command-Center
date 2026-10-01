const express = require('express');
const router = express.Router();
const axios = require('axios');
const { query } = require('../db/postgres');
const GenericRESTConnector = require('../connectors/GenericRESTConnector');
const syncEngine = require('../sync/syncEngine');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/integrations/status (Live health monitoring for all 4 external microservices)
router.get('/status', authenticate, async (req, res) => {
  const services = [
    { id: 'inventory-api', name: 'Inventory API Gateway', port: process.env.INVENTORY_API_PORT || 4001, url: process.env.INVENTORY_API_URL || 'http://localhost:4001' },
    { id: 'delivery-api', name: 'Carrier Delivery Partner API', port: process.env.DELIVERY_API_PORT || 4002, url: process.env.DELIVERY_API_URL || 'http://localhost:4002' },
    { id: 'payment-api', name: 'Payment Clearing Switch API', port: process.env.PAYMENT_API_PORT || 4003, url: process.env.PAYMENT_API_URL || 'http://localhost:4003' },
    { id: 'crm-api', name: 'Omnichannel CRM System', port: process.env.CRM_API_PORT || 4004, url: process.env.CRM_API_URL || 'http://localhost:4004' }
  ];

  const results = await Promise.all(services.map(async (svc) => {
    const start = Date.now();
    try {
      const resp = await axios.get(`${svc.url}/health`, { timeout: 2500 });
      const latency = Date.now() - start;
      const simStatus = await axios.get(`${svc.url}/simulator/status`, { timeout: 1500 }).catch(() => ({ data: {} }));
      return {
        ...svc,
        status: resp.data.status || 'healthy',
        responseTime: resp.data.responseTime || latency,
        lastSuccessfulSync: resp.data.lastSync || new Date().toISOString(),
        error: resp.data.error || null,
        errorRate: resp.data.status === 'degraded' ? 14.5 : (resp.data.status === 'unhealthy' ? 100 : 0.2),
        simulator: simStatus.data
      };
    } catch (err) {
      return {
        ...svc,
        status: 'unreachable',
        responseTime: Date.now() - start,
        lastSuccessfulSync: new Date(Date.now() - 3600000 * 4).toISOString(),
        error: err.message,
        errorRate: 100,
        simulator: { enabled: false }
      };
    }
  }));

  res.json(results);
});

// POST /api/integrations/test (Real HTTP tests for FDE Onboarding)
router.post('/test', authenticate, async (req, res) => {
  const { baseUrl, authType, apiKey } = req.body;
  if (!baseUrl) {
    return res.status(400).json({ error: 'baseUrl is required' });
  }

  const connector = new GenericRESTConnector({ baseUrl, authType, apiKey });
  const testResults = await connector.runFullIntegrationTest();

  res.json(testResults);
});

// POST /api/integrations/onboard (Save new client system)
router.post('/onboard', authenticate, authorize(['Admin']), async (req, res) => {
  const { systemName, baseUrl, authType, apiKey, environment } = req.body;

  if (!systemName || !baseUrl) {
    return res.status(400).json({ error: 'systemName and baseUrl are required' });
  }

  try {
    // Run live test first
    const connector = new GenericRESTConnector({ baseUrl, authType, apiKey });
    const testResults = await connector.runFullIntegrationTest();

    const connId = `conn-${Date.now().toString().slice(-6)}`;
    await query(`
      INSERT INTO integration_connections (id, system_name, base_url, auth_type, api_key, environment, status, endpoints_status, last_test_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    `, [
      connId,
      systemName,
      baseUrl,
      authType || 'bearer',
      apiKey || null,
      environment || 'production',
      testResults.authentication ? 'connected' : 'degraded',
      JSON.stringify(testResults)
    ]);

    // Audit log
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'ONBOARD_CLIENT_INTEGRATION', 'INTEGRATION', $3, 'FDE Onboarding client system', $4, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      `aud-${Date.now().toString().slice(-6)}`,
      req.user.email,
      connId,
      JSON.stringify({ systemName, baseUrl, environment, testPassed: testResults.authentication })
    ]);

    res.status(201).json({
      message: `Client system ${systemName} successfully onboarded`,
      connectionId: connId,
      testResults
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to onboard integration: ' + err.message });
  }
});

// GET /api/integrations/mapping
router.get('/mapping', authenticate, async (req, res) => {
  const { integrationId = 'conn-erp-external-01' } = req.query;

  try {
    const mappingsRes = await query('SELECT * FROM field_mappings WHERE integration_id = $1 ORDER BY created_at ASC', [integrationId]);
    const connectionsRes = await query('SELECT * FROM integration_connections ORDER BY last_test_at DESC');

    res.json({
      connections: connectionsRes.rows,
      mappings: mappingsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch field mappings: ' + err.message });
  }
});

// POST /api/integrations/mapping
router.post('/mapping', authenticate, authorize(['Admin', 'Operations Manager']), async (req, res) => {
  const { integrationId, sourceField, targetField, dataType, transformation, validationRule } = req.body;

  if (!sourceField || !targetField) {
    return res.status(400).json({ error: 'sourceField and targetField are required' });
  }

  try {
    const mapId = `map-${Date.now().toString().slice(-6)}`;
    await query(`
      INSERT INTO field_mappings (id, integration_id, source_field, target_field, data_type, transformation, validation_rule, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, CURRENT_TIMESTAMP)
    `, [mapId, integrationId || 'conn-erp-external-01', sourceField, targetField, dataType || 'string', transformation || null, validationRule || null]);

    // Audit log
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'CREATE_FIELD_MAPPING', 'MAPPING', $3, 'Configured canonical schema translation', $4, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      `aud-${Date.now().toString().slice(-6)}`,
      req.user.email,
      mapId,
      JSON.stringify({ sourceField, targetField, transformation })
    ]);

    res.status(201).json({ message: 'Field mapping saved successfully', mappingId: mapId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save field mapping: ' + err.message });
  }
});

// POST /api/integrations/sync
router.post('/sync', authenticate, authorize(['Admin', 'Operations Manager']), async (req, res) => {
  const { integrationId } = req.body;

  try {
    const syncResult = await syncEngine.runSync(integrationId || 'conn-erp-external-01');

    // Audit log
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'RUN_DATA_SYNC', 'SYNC', $3, 'Manual pipeline synchronization triggered', $4, $5, CURRENT_TIMESTAMP)
    `, [
      `aud-${Date.now().toString().slice(-6)}`,
      req.user.email,
      syncResult.logId,
      JSON.stringify(syncResult),
      syncResult.status
    ]);

    res.json(syncResult);
  } catch (err) {
    res.status(500).json({ error: 'Sync failed: ' + err.message });
  }
});

// GET /api/integrations/sync/logs
router.get('/sync/logs', authenticate, async (req, res) => {
  try {
    const logs = await syncEngine.getRecentLogs(25);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sync logs: ' + err.message });
  }
});

// POST /api/integrations/simulator/toggle (Toggle external failure simulation)
router.post('/simulator/toggle', authenticate, authorize(['Admin', 'Operations Manager']), async (req, res) => {
  const { service, mode } = req.body;
  const portMap = {
    'inventory-api': 4001,
    'delivery-api': 4002,
    'payment-api': 4003,
    'crm-api': 4004
  };

  const port = portMap[service] || 4001;
  try {
    const toggleRes = await axios.post(`http://localhost:${port}/simulator/toggle`, { mode });
    res.json(toggleRes.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle simulator on port ' + port + ': ' + err.message });
  }
});

module.exports = router;
