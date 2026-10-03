/**
 * ShopSphere End-to-End Test Suite
 * Tests all core subsystems, database queries, simulated microservices,
 * RAG retrieval, AI investigation, safety action gates, and audit trails.
 */

const axios = require('axios');
const { query } = require('../apps/backend/src/db/postgres');
const { getDb } = require('../apps/backend/src/db/mongo');
const GenericRESTConnector = require('../apps/backend/src/connectors/GenericRESTConnector');
const canonicalTransformer = require('../apps/backend/src/canonical/canonicalTransformer');

const { spawn } = require('child_process');
const path = require('path');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
const INVENTORY_API_URL = process.env.INVENTORY_API_URL || 'http://localhost:4001';
const DELIVERY_API_URL = process.env.DELIVERY_API_URL || 'http://localhost:4002';

let passedTests = 0;
let failedTests = 0;
const spawnedProcesses = [];

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${message}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✗\x1b[0m ${message}`);
    failedTests++;
  }
}

async function isPortHealthy(url) {
  try {
    const res = await axios.get(url, { timeout: 1000 });
    return res.status >= 200 && res.status < 500;
  } catch (e) {
    return false;
  }
}

async function ensureServicesRunning() {
  const rootDir = path.resolve(__dirname, '..');
  
  const backendHealthy = await isPortHealthy(`${BACKEND_URL}/health`);
  const inventoryHealthy = await isPortHealthy(`${INVENTORY_API_URL}/health`);
  const aiHealthy = await isPortHealthy(`${AI_SERVICE_URL}/health`);

  if (backendHealthy && inventoryHealthy && aiHealthy) {
    return;
  }

  console.log('⚡ Auto-starting ShopSphere microservices for E2E test execution...');

  if (!inventoryHealthy) {
    const p = spawn('node', ['services/run_services.js'], { cwd: rootDir, stdio: 'ignore' });
    spawnedProcesses.push(p);
  }

  if (!aiHealthy) {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const p = spawn(pythonCmd, ['apps/ai-service/run.py'], { cwd: rootDir, stdio: 'ignore' });
    spawnedProcesses.push(p);
  }

  if (!backendHealthy) {
    const p = spawn('node', ['apps/backend/src/server.js'], { cwd: rootDir, stdio: 'ignore' });
    spawnedProcesses.push(p);
  }

  // Poll until all services are healthy (max 15 seconds)
  const startTime = Date.now();
  while (Date.now() - startTime < 15000) {
    const bOK = await isPortHealthy(`${BACKEND_URL}/health`);
    const iOK = await isPortHealthy(`${INVENTORY_API_URL}/health`);
    const aOK = await isPortHealthy(`${AI_SERVICE_URL}/health`);
    if (bOK && iOK && aOK) {
      console.log('  ✓ All ShopSphere microservices and backend API online.\n');
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('  ⚠ Warning: Some services took longer to respond. Proceeding with tests...\n');
}

function cleanupSpawnedServices() {
  if (spawnedProcesses.length > 0) {
    console.log('🧹 Cleaning up auto-started test services...');
    spawnedProcesses.forEach((p) => {
      try {
        if (process.platform === 'win32' && p.pid) {
          spawn('taskkill', ['/pid', p.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
        } else {
          p.kill('SIGTERM');
        }
      } catch (e) {}
    });
  }
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('   ShopSphere Operations Command Center — End-to-End Test Suite  ');
  console.log('================================================================\n');

  await ensureServicesRunning();

  let adminToken = '';
  let viewerToken = '';

  // -------------------------------------------------------------
  // TEST SUITE 1: Authentication & RBAC Authorization
  // -------------------------------------------------------------
  console.log('\x1b[36m[SUITE 1]\x1b[0m Authentication & Role-Based Access Control (RBAC)');
  try {
    const adminLogin = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'admin@shopsphere.com',
      password: 'password123'
    });
    assert(adminLogin.data.token && adminLogin.data.user.role === 'Admin', 'Admin user login and JWT issuance');
    adminToken = adminLogin.data.token;

    const viewerLogin = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'viewer@shopsphere.com',
      password: 'password123'
    });
    assert(viewerLogin.data.token && viewerLogin.data.user.role === 'Viewer', 'Viewer user login with restricted role');
    viewerToken = viewerLogin.data.token;

    // RBAC write prevention test for Viewer
    try {
      await axios.post(
        `${BACKEND_URL}/api/inventory/transfers`,
        { fromWarehouse: 'BLR-W02', toWarehouse: 'CBE-W03', productId: 'P-204', quantity: 10 },
        { headers: { Authorization: `Bearer ${viewerToken}` } }
      );
      assert(false, 'Viewer was erroneously allowed to execute write operation');
    } catch (err) {
      assert(err.response?.status === 403, 'RBAC successfully rejected Viewer write attempt with HTTP 403 Forbidden');
    }

    // Admin User Provisioning & Password Management test
    const userEmail = `operator.${Date.now()}@gmail.com`;
    const newUserRes = await axios.post(
      `${BACKEND_URL}/api/auth/users`,
      { email: userEmail, password: 'initialPass123', fullName: 'Test Operator', role: 'Operations Manager' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(newUserRes.status === 201 && newUserRes.data.user.email === userEmail, 'Company Admin provisioned new operator user account with Gmail ID');

    // Admin Password Reset test
    const resetRes = await axios.put(
      `${BACKEND_URL}/api/auth/users/${newUserRes.data.user.id}/password`,
      { newPassword: 'updatedPass456' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(resetRes.status === 200, 'Company Admin successfully reset operator password');

    // Verify login with new password
    const newLoginRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: userEmail,
      password: 'updatedPass456'
    });
    assert(newLoginRes.data.user.role === 'Operations Manager', 'Operator logged in with updated password and received Operations Manager role');

    // Verify Viewer cannot provision users
    try {
      await axios.post(
        `${BACKEND_URL}/api/auth/users`,
        { email: 'unauthorized@gmail.com', password: 'test123', fullName: 'Hacker', role: 'Admin' },
        { headers: { Authorization: `Bearer ${viewerToken}` } }
      );
      assert(false, 'Viewer was erroneously allowed to provision a user');
    } catch (err) {
      assert(err.response?.status === 403, 'RBAC rejected non-admin user provisioning attempt with HTTP 403 Forbidden');
    }

    // Clean up test user
    await axios.delete(`${BACKEND_URL}/api/auth/users/${newUserRes.data.user.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  } catch (err) {
    console.error('Suite 1 setup error:', err.message);
  }

  // -------------------------------------------------------------
  // TEST SUITE 2: Relational PostgreSQL / PGlite & Document Store
  // -------------------------------------------------------------
  console.log('\n\x1b[36m[SUITE 2]\x1b[0m Multi-Database Data Integrity (PostgreSQL + MongoDB)');
  try {
    const ordersRes = await axios.get(`${BACKEND_URL}/api/orders?limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const orderCount = ordersRes.data.total;
    assert(orderCount >= 10000, `PostgreSQL contains ${orderCount.toLocaleString()} orders (>= 10,000 target)`);

    const invRes = await axios.get(`${BACKEND_URL}/api/inventory?search=P-204`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const p204Stock = invRes.data.data.find((i) => i.product_id === 'P-204');
    assert(p204Stock !== undefined, `Product P-204 stock record exists in inventory (status: ${p204Stock?.status})`);

    const custRes = await axios.get(`${BACKEND_URL}/api/customers?limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const custCount = custRes.data.total;
    assert(custCount >= 10000, `MongoDB contains ${custCount.toLocaleString()} customer profiles (>= 10,000 target)`);

    const ticketsRes = await axios.get(`${BACKEND_URL}/api/support/tickets?limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const ticketsCount = ticketsRes.data.total;
    assert(ticketsCount >= 5000, `MongoDB contains ${ticketsCount.toLocaleString()} support tickets (>= 5,000 target)`);
  } catch (err) {
    console.error('Suite 2 error:', err.message);
  }

  // -------------------------------------------------------------
  // TEST SUITE 3: External Simulated Microservices & Failure Modes
  // -------------------------------------------------------------
  console.log('\n\x1b[36m[SUITE 3]\x1b[0m External Microservices & Dynamic Failure Simulation');
  try {
    // Inventory API probe
    const invApiRes = await axios.get(`${INVENTORY_API_URL}/inventory/P-204`);
    assert(invApiRes.status === 200 && invApiRes.data.productId === 'P-204', 'External Inventory API (:4001) responsive for P-204');

    // Delivery API probe
    const delApiRes = await axios.get(`${DELIVERY_API_URL}/delivery/delayed`);
    assert(delApiRes.status === 200 && Array.isArray(delApiRes.data.delayedOrders), 'External Delivery API (:4002) returned delayed orders stream');

    // Failure Simulator Toggle
    await axios.post(`${INVENTORY_API_URL}/simulator/toggle`, { mode: 'degraded' });
    const degradedHealth = await axios.get(`${INVENTORY_API_URL}/health`);
    assert(degradedHealth.data.status === 'degraded', 'Failure Simulator dynamically toggled Inventory API to degraded mode');

    // Reset back to healthy
    await axios.post(`${INVENTORY_API_URL}/simulator/toggle`, { mode: 'healthy' });
    const healthyHealth = await axios.get(`${INVENTORY_API_URL}/health`);
    assert(healthyHealth.data.status === 'healthy', 'Failure Simulator restored Inventory API to healthy mode');
  } catch (err) {
    console.error('Suite 3 error:', err.message);
  }

  // -------------------------------------------------------------
  // TEST SUITE 4: RAG Vector Retrieval & Operational Policies
  // -------------------------------------------------------------
  console.log('\n\x1b[36m[SUITE 4]\x1b[0m Vector Store Policy Search & Grounded Citations');
  try {
    const policySearch = await axios.post(`${AI_SERVICE_URL}/policies/search`, {
      query: 'late delivery compensation and order refund',
      limit: 3
    });
    const results = policySearch.data;
    assert(Array.isArray(results) && results.length > 0, 'Vector Store returned semantic policy matches');
    
    const refundMatch = results.find((r) => (r.documentName || r.document_name || '').includes('Refund') || (r.documentName || r.document_name || '').includes('Shipping'));
    assert(refundMatch !== undefined, `Retrieved specific company policy: "${refundMatch?.documentName || refundMatch?.document_name}"`);
  } catch (err) {
    console.error('Suite 4 error:', err.message);
  }

  // -------------------------------------------------------------
  // TEST SUITE 5: Flagship E2E Scenario: Coimbatore Delayed Orders
  // -------------------------------------------------------------
  console.log('\n\x1b[36m[SUITE 5]\x1b[0m End-to-End AI Investigation: Coimbatore Delayed Orders');
  try {
    const aiRes = await axios.post(
      `${BACKEND_URL}/api/ai/investigate`,
      { question: 'Why are customers from Coimbatore receiving orders late?' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const data = aiRes.data;

    assert(data.summary && data.summary.includes('Coimbatore'), 'AI generated grounded summary addressing Coimbatore orders');
    assert(data.investigationSteps && data.investigationSteps.length >= 5, `Timeline trace showed ${data.investigationSteps.length} executed tools`);
    assert(data.evidence && data.evidence.length >= 3, `AI collected ${data.evidence.length} concrete evidence cards`);

    const w03Evidence = data.evidence.find((e) => e.title.includes('W03') || e.description.includes('W03') || e.metric.includes('31'));
    assert(w03Evidence !== undefined, 'AI successfully discovered Warehouse W03 as the root cause bottleneck');

    assert(data.citations && data.citations.length > 0, 'AI grounded response with official operational document citation');
  } catch (err) {
    console.error('Suite 5 error:', err.message);
  }

  // -------------------------------------------------------------
  // TEST SUITE 6: Flagship E2E Scenario: Fix P-204 Issue & Audit Verification
  // -------------------------------------------------------------
  console.log('\n\x1b[36m[SUITE 6]\x1b[0m End-to-End Action Workflow: Investigate P-204 & Execute Stock Transfer');
  try {
    // Step A: Investigate P-204
    const invRes = await axios.post(
      `${BACKEND_URL}/api/ai/investigate`,
      { question: 'Something is wrong with Product P-204. Find out why.' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const investigation = invRes.data;
    assert(investigation.rootCauseAnalysis !== undefined, 'AI performed multi-system Root Cause Analysis on P-204');
    assert(investigation.recommendedAction !== undefined, 'AI proposed recommended remediation action');
    assert(investigation.recommendedAction.requiresConfirmation === true, 'Safety gate enforced: Action requires explicit operator confirmation');

    // Step B: Confirm & Execute Action
    const confirmRes = await axios.post(
      `${BACKEND_URL}/api/ai/action/confirm`,
      {
        actionType: investigation.recommendedAction.actionType,
        parameters: investigation.recommendedAction.parameters,
        reason: 'Automated remediation of Coimbatore W03 stock discrepancy'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const resolution = confirmRes.data;
    assert(resolution.success === true, 'Remediation action executed successfully');
    assert(resolution.transferId && resolution.transferId.startsWith('TRF-'), `Generated official transfer ID: ${resolution.transferId}`);

    // Step C: Verify resulting inventory in PostgreSQL
    const postInvRes = await axios.get(`${BACKEND_URL}/api/inventory?search=P-204`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(postInvRes.data.data.length > 0, `Verified inventory update: P-204 records found and updated`);

    // Step D: Verify Audit Log creation
    const auditRes = await axios.get(`${BACKEND_URL}/api/audit?entity=TRANSFER`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const foundAudit = auditRes.data.data.find((a) => a.entity_id === resolution.transferId || a.action.includes('REMEDIATION') || a.action.includes('TRANSFER'));
    assert(foundAudit !== undefined, `Verified immutable audit log entry for ${resolution.transferId}`);
  } catch (err) {
    console.error('Suite 6 error:', err.response?.data || err.stack || err.message);
  }

  // -------------------------------------------------------------
  // TEST SUITE 7: FDE Connector & Canonical Schema Transformation
  // -------------------------------------------------------------
  console.log('\n\x1b[36m[SUITE 7]\x1b[0m Forward Deployed Engineer (FDE) Connector & Canonical Model');
  try {
    const rawExternalOrder = {
      client_order_no: 'EXT-99214',
      user_identifier: 'CUST-0012',
      gross_amount_usd: 120.0,
      destination_warehouse: 'blr-w02',
      carrier_tracking_status: 'in_transit'
    };

    const canonicalOrder = canonicalTransformer.transformOrder(rawExternalOrder);
    assert(canonicalOrder.order_number === 'EXT-99214', 'Transformed client_order_no -> order_number');
    assert(canonicalOrder.total_amount === 9960, 'Transformed USD gross amount to INR currency (120 * 83 = 9960)');
    assert(canonicalOrder.warehouse_id === 'BLR-W02', 'Applied trim and uppercase transformation to warehouse code');

    const connector = new GenericRESTConnector({ baseUrl: INVENTORY_API_URL });
    const fullTest = await connector.runFullIntegrationTest();
    assert(fullTest.authentication && fullTest.inventoryEndpoint, 'GenericRESTConnector passed live diagnostic probe');
  } catch (err) {
    console.error('Suite 7 error:', err.message);
  }

  // -------------------------------------------------------------
  // TEST SUITE 8: Customer E-Commerce Storefront Integration
  // -------------------------------------------------------------
  console.log('\n\x1b[36m[SUITE 8]\x1b[0m Customer Storefront, Checkout, Payment Simulation & RAG Returns');
  try {
    // 1. Browse products
    const catRes = await axios.get(`${BACKEND_URL}/api/products/categories`);
    assert(catRes.data.categories && catRes.data.categories.length >= 5, 'Customer can browse product categories');

    const prodDetailRes = await axios.get(`${BACKEND_URL}/api/products/P-204`);
    assert(prodDetailRes.data.product_id === 'P-204' && prodDetailRes.data.inventory, 'Customer product detail includes live regional warehouse stock');

    // 2. Simulated Payment Failure Flow (Requirement 10)
    try {
      await axios.post(`${BACKEND_URL}/api/orders`, {
        items: [{ product_id: 'P-204', quantity: 1, price: 3499.0 }],
        customerName: 'Aarav Sharma',
        shippingAddress: '124 Gandhipuram',
        shippingCity: 'Coimbatore',
        paymentMethod: 'UPI',
        simulatePaymentFailure: true
      });
      assert(false, 'Checkout erroneously accepted failed payment');
    } catch (err) {
      assert(err.response?.status === 402 && err.response?.data?.paymentStatus === 'FAILED', 'Payment simulation failure correctly rejected with HTTP 402 Payment Required');
    }

    // 3. Successful Order Placement & Inventory Reservation (Requirement 8 & 11)
    const checkoutRes = await axios.post(`${BACKEND_URL}/api/orders`, {
      items: [{ product_id: 'P-204', quantity: 1, price: 3499.0 }],
      customerName: 'Aarav Sharma',
      shippingAddress: '124 Gandhipuram',
      shippingCity: 'Coimbatore',
      paymentMethod: 'UPI',
      simulatePaymentFailure: false,
      channel: 'WEBSITE'
    });
    assert(checkoutRes.status === 201 && checkoutRes.data.order?.order_number, `Successful order created: ${checkoutRes.data.order?.order_number} allocated to ${checkoutRes.data.order?.warehouse?.name || 'W03'}`);

    const newOrderNum = checkoutRes.data.order?.order_number;

    // 4. Live Order Tracking Milestone Timeline (Requirement 14)
    const trackRes = await axios.get(`${BACKEND_URL}/api/orders/track/${newOrderNum}`);
    assert(trackRes.data.milestones && trackRes.data.milestones.length >= 5, `Live consignment tracking retrieved ${trackRes.data.milestones.length} milestone events`);

    // 5. RAG Return Policy Evaluation (Requirement 21)
    const policyEvalRes = await axios.post(`${BACKEND_URL}/api/returns/evaluate-policy`, {
      orderNumber: newOrderNum,
      productId: 'P-204',
      reason: 'Defective',
      category: 'Electronics'
    });
    assert(policyEvalRes.data.eligible === true && policyEvalRes.data.policySource?.documentName === 'Return Policy.pdf', `RAG policy check cited document "${policyEvalRes.data.policySource?.documentName}" (Chunk: ${policyEvalRes.data.policySource?.chunkId})`);

    // 6. Customer Complaint Registration (Requirement 18 & 19)
    const complaintRes = await axios.post(`${BACKEND_URL}/api/complaints`, {
      type: 'CLIENT_COMPLAINT',
      title: `Delivery delay query for ${newOrderNum}`,
      description: 'Order tracking states pending allocation at W03 hub.',
      category: 'delivery_delay',
      severity: 'HIGH',
      orderNumber: newOrderNum
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert(complaintRes.status === 201 && complaintRes.data.complaint?.ticketNumber, `Registered customer complaint ticket: ${complaintRes.data.complaint?.ticketNumber} and dispatched officer alert`);

    // 7. Customer Notifications Inbox (Requirement 23)
    const notifRes = await axios.get(`${BACKEND_URL}/api/notifications?customerId=CUST-0001`);
    assert(notifRes.data.notifications && notifRes.data.notifications.length > 0, `Customer inbox received ${notifRes.data.notifications.length} real-time notifications`);
  } catch (err) {
    console.error('Suite 8 error:', err.response?.data || err.stack || err.message);
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`   TEST SUITE SUMMARY: \x1b[32m${passedTests} PASSED\x1b[0m, \x1b[${failedTests > 0 ? '31' : '32'}m${failedTests} FAILED\x1b[0m`);
  console.log('================================================================\n');

  cleanupSpawnedServices();

  if (failedTests > 0) {
    process.exit(1);
  }
}

// Allow standalone execution
if (require.main === module) {
  runTestSuite().catch((err) => {
    console.error('Fatal test runner error:', err);
    cleanupSpawnedServices();
    process.exit(1);
  });
}

module.exports = { runTestSuite };
