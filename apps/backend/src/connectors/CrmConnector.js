const axios = require('axios');
const redis = require('../db/redis');

class CrmConnector {
  async getCustomer(customerId) { throw new Error('Not implemented'); }
  async getCustomerHistory(customerId) { throw new Error('Not implemented'); }
  async sendNotification(notificationData) { throw new Error('Not implemented'); }
  async healthCheck() { throw new Error('Not implemented'); }
}

class ShopSphereCrmConnector extends CrmConnector {
  constructor(baseUrl) {
    super();
    this.baseUrl = baseUrl || process.env.CRM_API_URL || 'http://localhost:4004';
  }

  async healthCheck() {
    try {
      const res = await axios.get(`${this.baseUrl}/health`, { timeout: 2000 });
      return res.data;
    } catch (err) {
      return {
        service: 'crm-api',
        status: 'unreachable',
        error: err.message,
        responseTime: 2000
      };
    }
  }

  async getCustomer(customerId) {
    try {
      const res = await axios.get(`${this.baseUrl}/customers/${customerId}`, { timeout: 3000 });
      return res.data;
    } catch (err) {
      return null;
    }
  }

  async getCustomerHistory(customerId) {
    try {
      const res = await axios.get(`${this.baseUrl}/customers/${customerId}/history`, { timeout: 3000 });
      return res.data;
    } catch (err) {
      return null;
    }
  }

  async sendNotification(customerId, data) {
    const res = await axios.post(`${this.baseUrl}/customers/${customerId}/notification`, data, { timeout: 5000 });
    return res.data;
  }
}

module.exports = {
  CrmConnector,
  ShopSphereCrmConnector
};
