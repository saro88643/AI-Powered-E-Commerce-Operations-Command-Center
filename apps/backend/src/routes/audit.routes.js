const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const { authenticate } = require('../middleware/auth');

// GET /api/audit
router.get('/', authenticate, async (req, res) => {
  const { user, action, entity, status, page = 1, limit = 25 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let whereClauses = [];
    let params = [];

    if (user) {
      params.push(`%${user}%`);
      whereClauses.push(`user_email ILIKE $${params.length}`);
    }
    if (action) {
      params.push(action);
      whereClauses.push(`action = $${params.length}`);
    }
    if (entity) {
      params.push(entity);
      whereClauses.push(`entity = $${params.length}`);
    }
    if (status) {
      params.push(status);
      whereClauses.push(`status = $${params.length}`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) as count FROM audit_logs ${whereSQL}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(parseInt(limit));
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const dataRes = await query(`
      SELECT * FROM audit_logs
      ${whereSQL}
      ORDER BY timestamp DESC
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
    res.status(500).json({ error: 'Failed to fetch audit logs: ' + err.message });
  }
});

module.exports = router;
