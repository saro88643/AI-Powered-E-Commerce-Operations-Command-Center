const inventoryApp = require('./inventory-api/server');
const deliveryApp = require('./delivery-api/server');
const paymentApp = require('./payment-api/server');
const crmApp = require('./crm-api/server');

const INVENTORY_PORT = process.env.INVENTORY_API_PORT || 4001;
const DELIVERY_PORT = process.env.DELIVERY_API_PORT || 4002;
const PAYMENT_PORT = process.env.PAYMENT_API_PORT || 4003;
const CRM_PORT = process.env.CRM_API_PORT || 4004;

console.log('🚀 Starting ShopSphere External Simulated Microservices...');

inventoryApp.listen(INVENTORY_PORT, () => {
  console.log(`  ✓ Inventory API running at http://localhost:${INVENTORY_PORT}`);
});

deliveryApp.listen(DELIVERY_PORT, () => {
  console.log(`  ✓ Delivery API running at http://localhost:${DELIVERY_PORT}`);
});

paymentApp.listen(PAYMENT_PORT, () => {
  console.log(`  ✓ Payment API running at http://localhost:${PAYMENT_PORT}`);
});

crmApp.listen(CRM_PORT, () => {
  console.log(`  ✓ CRM API running at http://localhost:${CRM_PORT}`);
});
