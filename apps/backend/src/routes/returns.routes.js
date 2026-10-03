const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { query } = require('../db/postgres');
const { getCollection } = require('../db/mongo');
const { ShopSpherePaymentConnector } = require('../connectors/PaymentConnector');
const { authenticate, optionalAuth, authorize } = require('../middleware/auth');

const paymentConnector = new ShopSpherePaymentConnector();

// Load policy chunks from company_policies.json for RAG return validation
let policyChunks = [];
try {
  const polPath = path.join(__dirname, '../../../../data/documents/company_policies.json');
  if (fs.existsSync(polPath)) {
    policyChunks = JSON.parse(fs.readFileSync(polPath, 'utf8'));
  }
} catch (e) {
  console.warn('[Returns] Could not load company_policies.json:', e.message);
}

// GET /api/returns
router.get('/', authenticate, async (req, res) => {
  const { status, productId, myReturns, page = 1, limit = 25 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let whereClauses = [];
    let params = [];

    // Customer scoping
    if (req.user.role === 'Customer' || myReturns === 'true') {
      const activeCustId = req.user.customerId || req.user.id || 'CUST-0001';
      params.push(activeCustId);
      whereClauses.push(`(o.customer_id = $${params.length} OR o.customer_id ILIKE $${params.length})`);
    }

    if (status) {
      params.push(status);
      whereClauses.push(`r.status = $${params.length}`);
    }
    if (productId) {
      params.push(productId);
      whereClauses.push(`r.product_id = $${params.length}`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await query(`
      SELECT COUNT(*) as count 
      FROM returns r 
      LEFT JOIN orders o ON r.order_id = o.id
      ${whereSQL}
    `, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(parseInt(limit));
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const dataRes = await query(`
      SELECT r.*, o.order_number, o.customer_id, o.shipping_city, o.shipping_address
      FROM returns r
      LEFT JOIN orders o ON r.order_id = o.id
      ${whereSQL}
      ORDER BY r.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, params);

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: dataRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch returns: ' + err.message });
  }
});

// POST /api/returns/evaluate-policy — RAG-based Return Policy Checker (Prompt Section 20 & 21)
router.post('/evaluate-policy', optionalAuth, async (req, res) => {
  const {
    orderNumber,
    productId,
    reason = 'Defective',
    category = 'Electronics'
  } = req.body;

  try {
    // 1. Check Order and Delivery Details
    let order = null;
    if (orderNumber) {
      const ordRes = await query('SELECT * FROM orders WHERE order_number ILIKE $1 OR id ILIKE $1', [orderNumber.trim()]);
      if (ordRes.rows.length > 0) {
        order = ordRes.rows[0];
      }
    }

    const deliveryDate = order?.actual_delivery ? new Date(order.actual_delivery) : new Date(Date.now() - 3 * 86400000);
    const now = new Date();
    const daysSinceDelivery = Math.max(0, Math.floor((now - deliveryDate) / (1000 * 3600 * 24)));

    // 2. Determine applicable return window based on category
    let allowedWindowDays = 14;
    if (['Electronics', 'Office & Computing'].includes(category)) {
      allowedWindowDays = 10;
    } else if (['Grocery', 'Digital'].includes(category)) {
      allowedWindowDays = 0;
    } else {
      allowedWindowDays = 14;
    }

    // 3. Search RAG Document Chunks for authoritative source
    const returnPolicyChunks = policyChunks.filter(c => 
      c.document_name === 'Return Policy.pdf' || c.document_name === 'Refund Policy.pdf'
    );

    let matchedChunk = returnPolicyChunks.find(c => c.chunk_id === 'RETURN-C01') || returnPolicyChunks[0];
    if (reason.toLowerCase().includes('damage') || reason.toLowerCase().includes('defect')) {
      matchedChunk = returnPolicyChunks.find(c => c.chunk_id === 'RETURN-C02') || matchedChunk;
    }

    // 4. Determine eligibility
    let eligible = true;
    let reasonText = '';

    if (allowedWindowDays === 0) {
      eligible = false;
      reasonText = `Products in category '${category}' are non-returnable under standard guidelines unless damaged on arrival.`;
    } else if (daysSinceDelivery > allowedWindowDays) {
      eligible = false;
      reasonText = `The return window of ${allowedWindowDays} days for this product category has elapsed (${daysSinceDelivery} days since delivery).`;
    } else {
      eligible = true;
      reasonText = `Product is eligible for return! Submitted within the allowed ${allowedWindowDays}-day window (${daysSinceDelivery} days elapsed). 100% free doorstep pickup will be arranged.`;
    }

    res.json({
      eligible,
      reasonSummary: reasonText,
      windowDays: allowedWindowDays,
      daysSinceDelivery,
      category,
      orderNumber: order?.order_number || orderNumber,
      policySource: {
        documentName: matchedChunk?.document_name || 'Return Policy.pdf',
        section: matchedChunk?.section || '1. Standard Return Windows & Eligibility',
        page: matchedChunk?.page || 1,
        chunkId: matchedChunk?.chunk_id || 'RETURN-C01',
        excerpt: matchedChunk?.content || 'ShopSphere Omnichannel Return Policy: Customers may return eligible products within 10 to 14 days of delivery.'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Policy evaluation failed: ' + err.message });
  }
});

// POST /api/returns — Customer creates a return request
router.post('/', optionalAuth, async (req, res) => {
  const {
    orderNumber,
    productId,
    reason,
    description,
    refundAmount
  } = req.body;

  if (!orderNumber || !productId || !reason) {
    return res.status(400).json({ error: 'orderNumber, productId, and reason are required' });
  }

  try {
    const ordRes = await query('SELECT * FROM orders WHERE order_number ILIKE $1 OR id ILIKE $1', [orderNumber.trim()]);
    if (ordRes.rows.length === 0) {
      return res.status(404).json({ error: `Order ${orderNumber} not found` });
    }
    const order = ordRes.rows[0];

    // Find item price
    const itemRes = await query('SELECT * FROM order_items WHERE order_id = $1 AND (product_id = $2 OR sku = $2)', [order.id, productId]);
    const calculatedRefund = refundAmount || (itemRes.rows[0]?.total_price || 3499.0);

    const returnId = `ret-${Date.now().toString().slice(-6)}`;
    const returnNumber = `RET-${Math.floor(10000 + Math.random() * 90000)}`;

    await query(`
      INSERT INTO returns (id, return_number, order_id, product_id, reason, status, refund_amount, created_at)
      VALUES ($1, $2, $3, $4, $5, 'requested', $6, CURRENT_TIMESTAMP)
    `, [
      returnId,
      returnNumber,
      order.id,
      productId,
      `${reason}: ${description || 'Customer initiated return via Storefront'}`,
      calculatedRefund
    ]);

    // Customer Notification in Mongo
    try {
      const notifColl = getCollection('notifications');
      await notifColl.insertOne({
        id: `notif-${Date.now()}`,
        customer_id: order.customer_id,
        order_number: order.order_number,
        title: 'Return Request Received',
        message: `Your return request #${returnNumber} for product ${productId} has been received. Free pickup will be scheduled within 48 hours.`,
        type: 'RETURN_REQUESTED',
        read: false,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      // ignore
    }

    // Audit Log
    const auditId = `aud-${Date.now().toString().slice(-6)}`;
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'RETURN_REQUESTED', 'RETURN', $3, $4, $5, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      auditId,
      req.user?.email || 'customer@shopsphere.in',
      returnNumber,
      `Return initiated for order ${order.order_number}`,
      JSON.stringify({ orderNumber: order.order_number, productId, refundAmount: calculatedRefund, reason })
    ]);

    res.status(201).json({
      success: true,
      message: `Return request ${returnNumber} submitted successfully.`,
      returnRecord: {
        id: returnId,
        return_number: returnNumber,
        order_number: order.order_number,
        product_id: productId,
        refund_amount: calculatedRefund,
        status: 'requested',
        estimatedPickup: new Date(Date.now() + 48 * 3600000).toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit return: ' + err.message });
  }
});

// POST /api/returns/:id/refund — Operations/Support processes the refund
router.post('/:id/refund', authenticate, authorize(['Admin', 'Operations Manager', 'Support Agent']), async (req, res) => {
  const { id } = req.params;
  const { reason, authorizedAmount } = req.body;

  try {
    const retRes = await query('SELECT * FROM returns WHERE id = $1 OR return_number = $1', [id]);
    if (retRes.rows.length === 0) {
      return res.status(404).json({ error: 'Return record not found' });
    }

    const returnRec = retRes.rows[0];
    const refundAmt = authorizedAmount || returnRec.refund_amount;

    // Call payment connector
    const refundRes = await paymentConnector.processRefund({
      orderId: returnRec.order_id,
      amount: refundAmt,
      reason: reason || returnRec.reason,
      authorizedBy: req.user.email
    });

    // Update return status
    await query("UPDATE returns SET status = 'refunded' WHERE id = $1", [returnRec.id]);

    // Record in Audit Log
    const auditId = `aud-${Date.now().toString().slice(-6)}`;
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'APPROVE_REFUND', 'RETURN', $3, $4, $5, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      auditId,
      req.user.email,
      returnRec.return_number,
      reason || 'Customer refund approved as per policy',
      JSON.stringify({
        orderId: returnRec.order_id,
        productId: returnRec.product_id,
        refundAmount: refundAmt,
        refundId: refundRes.refundId
      })
    ]);

    res.json({
      message: `Refund of INR ${refundAmt} processed successfully for return ${returnRec.return_number}`,
      refundId: refundRes.refundId,
      auditId,
      status: 'refunded'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process refund: ' + err.message });
  }
});

module.exports = router;
