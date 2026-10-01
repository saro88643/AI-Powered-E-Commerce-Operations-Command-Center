const axios = require('axios');
const redis = require('../db/redis');
const { query } = require('../db/postgres');

class InventoryConnector {
  async getInventory(filters = {}) { throw new Error('Not implemented'); }
  async getProductInventory(productId) { throw new Error('Not implemented'); }
  async createTransfer(transferData) { throw new Error('Not implemented'); }
  async healthCheck() { throw new Error('Not implemented'); }
}

class ShopSphereInventoryConnector extends InventoryConnector {
  constructor(baseUrl) {
    super();
    this.baseUrl = baseUrl || process.env.INVENTORY_API_URL || 'http://localhost:4001';
  }

  async healthCheck() {
    try {
      const res = await axios.get(`${this.baseUrl}/health`, { timeout: 2000 });
      return res.data;
    } catch (err) {
      return {
        service: 'inventory-api',
        status: 'unreachable',
        error: err.message,
        responseTime: 2000
      };
    }
  }

  async getInventory(filters = {}) {
    const cacheKey = `cache:inventory:${JSON.stringify(filters)}`;
    try {
      const res = await axios.get(`${this.baseUrl}/inventory`, { params: filters, timeout: 3000 });
      await redis.set(cacheKey, res.data, 300); // 5 min TTL
      return {
        ...res.data,
        isCached: false,
        source: 'Live Inventory API'
      };
    } catch (err) {
      console.warn(`[InventoryConnector] Live API failed (${err.message}). Checking cache/resilience...`);
      const cached = await redis.get(cacheKey);
      const meta = redis.getCacheMetadata(cacheKey);

      // Record incident if not already recorded
      await this.recordFailureIncident('inventory-api', err.message);

      if (cached) {
        return {
          ...cached,
          isCached: true,
          lastSuccessfulSync: meta.lastSuccessfulSync || new Date(Date.now() - 3600000).toISOString(),
          warning: 'Live Inventory API unavailable. Displaying cached inventory records.'
        };
      }

      // If neither live nor cache, query persistent database
      const dbRes = await query('SELECT * FROM inventory LIMIT 100');
      return {
        total: dbRes.rowCount,
        data: dbRes.rows,
        isCached: true,
        lastSuccessfulSync: new Date(Date.now() - 7200000).toISOString(),
        warning: 'Live Inventory API and Cache unavailable. Displaying internal fallback database.'
      };
    }
  }

  async getProductInventory(productId) {
    const cacheKey = `cache:inventory:product:${productId}`;
    try {
      const res = await axios.get(`${this.baseUrl}/inventory/${productId}`, { timeout: 3000 });
      await redis.set(cacheKey, res.data, 300);
      return {
        ...res.data,
        isCached: false
      };
    } catch (err) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return {
          ...cached,
          isCached: true,
          lastSuccessfulSync: redis.getCacheMetadata(cacheKey).lastSuccessfulSync
        };
      }
      const dbRes = await query('SELECT * FROM inventory WHERE product_id = $1', [productId]);
      return {
        productId,
        warehouses: dbRes.rows,
        isCached: true,
        warning: 'Inventory API unavailable. Local fallback.'
      };
    }
  }

  async createTransfer(transferData) {
    // Write operations call the API directly
    const res = await axios.post(`${this.baseUrl}/inventory/transfer`, transferData, { timeout: 5000 });
    // Invalidate inventory cache
    await redis.del(`cache:inventory:product:${transferData.productId}`);
    return res.data;
  }

  async recordFailureIncident(service, errorMsg) {
    try {
      await query(`
        INSERT INTO incidents (id, incident_number, title, severity, service, description, affected_records_count, status, root_cause, created_at, updated_at)
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT (incident_number) DO NOTHING;
      `, [
        `inc-auto-${Date.now().toString().slice(-4)}`,
        `INC-AUTO-${service.toUpperCase()}`,
        `Automated Alert: ${service} Connectivity Failure`,
        'high',
        service,
        `External API request failed with error: ${errorMsg}. Switched to cached fallback state.`,
        100,
        'Open',
        `Network or service degradation in ${service}`
      ]);
    } catch (e) {
      // ignore conflict
    }
  }
}

module.exports = {
  InventoryConnector,
  ShopSphereInventoryConnector
};
