const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const { ShopSpherePaymentConnector } = require('../connectors/PaymentConnector');
const { authenticate, authorize } = require('../middleware/auth');

const paymentConnector = new ShopSpherePaymentConnector();

// GET /api/returns
router.get('/', authenticate, async (req, res) => {
  const { status, productId, page = 1, limit = 25 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let whereClauses = [];
    let params = [];

    if (status) {
      params.push(status);
      whereClauses.push(`r.status = $${params.length}`);
    }
    if (productId) {
      params.push(productId);
      whereClauses.push(`r.product_id = $${params.length}`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) as count FROM returns r ${whereSQL}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(parseInt(limit));
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const dataRes = await query(`
      SELECT r.*, o.order_number, o.customer_id, o.shipping_city
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

// POST /api/returns/:id/refund
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
