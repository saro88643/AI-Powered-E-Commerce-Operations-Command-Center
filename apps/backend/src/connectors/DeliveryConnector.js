const axios = require('axios');
const redis = require('../db/redis');
const { query } = require('../db/postgres');

class DeliveryConnector {
  async getDelivery(orderId) { throw new Error('Not implemented'); }
  async getDelayedDeliveries(filters) { throw new Error('Not implemented'); }
  async escalateDelivery(escalationData) { throw new Error('Not implemented'); }
  async healthCheck() { throw new Error('Not implemented'); }
}

class ShopSphereDeliveryConnector extends DeliveryConnector {
  constructor(baseUrl) {
    super();
    this.baseUrl = baseUrl || process.env.DELIVERY_API_URL || 'http://localhost:4002';
  }

  async healthCheck() {
    try {
      const res = await axios.get(`${this.baseUrl}/health`, { timeout: 2000 });
      return res.data;
    } catch (err) {
      return {
        service: 'delivery-api',
        status: 'unreachable',
        error: err.message,
        responseTime: 2000
      };
    }
  }

  async getDelivery(orderId) {
    const cacheKey = `cache:delivery:${orderId}`;
    try {
      const res = await axios.get(`${this.baseUrl}/delivery/${orderId}`, { timeout: 3000 });
      await redis.set(cacheKey, res.data, 300);
      return { ...res.data, isCached: false };
    } catch (err) {
      console.warn(`[DeliveryConnector] API error (${err.message}). Checking cache.`);
      const cached = await redis.get(cacheKey);
      if (cached) {
        return {
          ...cached,
          isCached: true,
          lastSuccessfulSync: redis.getCacheMetadata(cacheKey).lastSuccessfulSync,
          warning: 'Delivery API unavailable. Displaying cached delivery record.'
        };
      }
      return null;
    }
  }

  async getDelayedDeliveries(filters = {}) {
    const cacheKey = `cache:delivery:delayed:${JSON.stringify(filters)}`;
    try {
      const res = await axios.get(`${this.baseUrl}/delivery/delayed`, { params: filters, timeout: 3000 });
      await redis.set(cacheKey, res.data, 300);
      return { ...res.data, isCached: false };
    } catch (err) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return {
          ...cached,
          isCached: true,
          lastSuccessfulSync: redis.getCacheMetadata(cacheKey).lastSuccessfulSync,
          warning: 'Delivery API unavailable. Cached data.'
        };
      }
      // Query database directly as fallback
      const dbRes = await query(`
        SELECT o.id, o.order_number, o.shipping_city as destination_city, o.status, o.expected_delivery, w.name as warehouse_name
        FROM orders o
        LEFT JOIN warehouses w ON o.warehouse_id = w.id
        WHERE o.status = 'delayed'
        LIMIT 100
      `);
      return {
        total: dbRes.rowCount,
        delayedOrders: dbRes.rows,
        isCached: true,
        warning: 'Delivery API unavailable. Local database fallback.'
      };
    }
  }

  async escalateDelivery(escalationData) {
    const res = await axios.post(`${this.baseUrl}/delivery/escalate`, escalationData, { timeout: 5000 });
    return res.data;
  }
}

module.exports = {
  DeliveryConnector,
  ShopSphereDeliveryConnector
};
