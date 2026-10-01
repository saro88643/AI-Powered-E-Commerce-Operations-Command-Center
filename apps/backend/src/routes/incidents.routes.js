const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/incidents
router.get('/', authenticate, async (req, res) => {
  const { status, severity, service } = req.query;

  try {
    let whereClauses = [];
    let params = [];

    if (status) {
      params.push(status);
      whereClauses.push(`status = $${params.length}`);
    }
    if (severity) {
      params.push(severity);
      whereClauses.push(`severity = $${params.length}`);
    }
    if (service) {
      params.push(service);
      whereClauses.push(`service = $${params.length}`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const resInc = await query(`SELECT * FROM incidents ${whereSQL} ORDER BY created_at DESC`, params);

    res.json(resInc.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incidents: ' + err.message });
  }
});

// GET /api/incidents/:id
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const resInc = await query('SELECT * FROM incidents WHERE id = $1 OR incident_number = $1', [id]);
    if (resInc.rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(resInc.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incident: ' + err.message });
  }
});

// PATCH /api/incidents/:id
router.patch('/:id', authenticate, authorize(['Admin', 'Operations Manager']), async (req, res) => {
  const { id } = req.params;
  const { status, root_cause, resolution } = req.body;

  try {
    const incRes = await query('SELECT * FROM incidents WHERE id = $1 OR incident_number = $1', [id]);
    if (incRes.rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    const incident = incRes.rows[0];

    await query(`
      UPDATE incidents 
      SET status = COALESCE($1, status),
          root_cause = COALESCE($2, root_cause),
          resolution = COALESCE($3, resolution),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [status, root_cause, resolution, incident.id]);

    // Audit log
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'UPDATE_INCIDENT', 'INCIDENT', $3, 'Operational status update', $4, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      `aud-${Date.now().toString().slice(-6)}`,
      req.user.email,
      incident.incident_number,
      JSON.stringify({ newStatus: status, root_cause, resolution, updatedBy: req.user.email })
    ]);

    res.json({ message: `Incident ${incident.incident_number} updated`, status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update incident: ' + err.message });
  }
});

// POST /api/incidents
router.post('/', authenticate, authorize(['Admin', 'Operations Manager']), async (req, res) => {
  const { title, severity = 'medium', service, description, affected_records_count = 0, root_cause } = req.body;

  if (!title || !service || !description) {
    return res.status(400).json({ error: 'title, service, and description are required' });
  }

  try {
    const incNum = `INC-2026-${Date.now().toString().slice(-4)}`;
    const incId = `inc-${Date.now()}`;

    await query(`
      INSERT INTO incidents (id, incident_number, title, severity, service, description, affected_records_count, status, root_cause, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Open', $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [incId, incNum, title, severity, service, description, affected_records_count, root_cause || null]);

    // Audit log
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'CREATE_INCIDENT', 'INCIDENT', $3, 'Manual operational failure declaration', $4, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      `aud-${Date.now().toString().slice(-6)}`,
      req.user.email,
      incNum,
      JSON.stringify({ title, severity, service, affected_records_count })
    ]);

    res.status(201).json({
      message: `Incident ${incNum} created`,
      incidentNumber: incNum,
      id: incId
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create incident: ' + err.message });
  }
});

module.exports = router;
