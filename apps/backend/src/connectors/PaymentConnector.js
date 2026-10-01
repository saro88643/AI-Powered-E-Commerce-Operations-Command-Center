const axios = require('axios');
const redis = require('../db/redis');

class PaymentConnector {
  async getPayment(orderId) { throw new Error('Not implemented'); }
  async processRefund(refundData) { throw new Error('Not implemented'); }
  async healthCheck() { throw new Error('Not implemented'); }
}

class ShopSpherePaymentConnector extends PaymentConnector {
  constructor(baseUrl) {
    super();
    this.baseUrl = baseUrl || process.env.PAYMENT_API_URL || 'http://localhost:4003';
  }

  async healthCheck() {
    try {
      const res = await axios.get(`${this.baseUrl}/health`, { timeout: 2000 });
      return res.data;
    } catch (err) {
      return {
        service: 'payment-api',
        status: 'unreachable',
        error: err.message,
        responseTime: 2000
      };
    }
  }

  async getPayment(orderId) {
    try {
      const res = await axios.get(`${this.baseUrl}/payments/${orderId}`, { timeout: 3000 });
      return res.data;
    } catch (err) {
      return null;
    }
  }

  async processRefund(refundData) {
    const res = await axios.post(`${this.baseUrl}/payments/refund`, refundData, { timeout: 5000 });
    return res.data;
  }
}

module.exports = {
  PaymentConnector,
  ShopSpherePaymentConnector
};
