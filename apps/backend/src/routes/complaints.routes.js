const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const { authenticate } = require('../middleware/auth');

// Helper: Smart department detection based on complaint title & description
function detectDepartment(title, description, category) {
  const text = `${title} ${description} ${category || ''}`.toLowerCase();

  if (text.includes('deliver') || text.includes('delay') || text.includes('courier') || text.includes('transit') || text.includes('driver') || text.includes('tracking') || text.includes('late')) {
    return { id: 'dept-deliv', name: 'Delivery & Logistics', officer: 'Kavita Nair (Express Fleet Team Lead)', officerEmail: 'tl.express@shopsphere.com' };
  }
  if (text.includes('damage') || text.includes('broken') || text.includes('defective') || text.includes('tamper') || text.includes('quality') || text.includes('catalog') || text.includes('product')) {
    return { id: 'dept-prod', name: 'Product & Catalog', officer: 'Arjun Mehta (Catalog Data Team Lead)', officerEmail: 'tl.catalog@shopsphere.com' };
  }
  if (text.includes('warehouse') || text.includes('stock') || text.includes('inventory') || text.includes('scanner') || text.includes('pallet') || text.includes('hub')) {
    return { id: 'dept-wh', name: 'Warehousing & Inventory', officer: 'Marcus Chen (Warehouse Supervisor)', officerEmail: 'warehouse@shopsphere.com' };
  }
  if (text.includes('refund') || text.includes('payment') || text.includes('invoice') || text.includes('charge') || text.includes('billing') || text.includes('gst')) {
    return { id: 'dept-fin', name: 'Payments & Billing', officer: 'Ramesh Gupta (Finance Lead)', officerEmail: 'finance@shopsphere.com' };
  }
  if (text.includes('shift') || text.includes('roster') || text.includes('harass') || text.includes('salary') || text.includes('workplace') || text.includes('manager dispute')) {
    return { id: 'dept-hr', name: 'Human Resources', officer: 'Elena Rostova (Corporate HR Lead)', officerEmail: 'hr.lead@shopsphere.com' };
  }

  // Default fallback
  return { id: 'dept-supp', name: 'Customer Experience & Support', officer: 'David Miller (Support Escalations Team Lead)', officerEmail: 'tl.tier2support@shopsphere.com' };
}

// POST /api/complaints — Submit a new Complaint or Employee Grievance
router.post('/', authenticate, async (req, res) => {
  const {
    type = 'CLIENT_COMPLAINT', // 'CLIENT_COMPLAINT' or 'EMPLOYEE_GRIEVANCE'
    title,
    description,
    departmentId,
    category = 'GENERAL_SERVICE',
    severity = 'HIGH',
    orderId,
    orderNumber,
    productId,
    clientId
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  try {
    // Detect department if not specified
    const detected = detectDepartment(title, description, category);
    const targetDeptId = departmentId || detected.id;

    // Fetch department details
    const deptRes = await query('SELECT id, name, head_officer_name, head_officer_email FROM departments WHERE id = $1', [targetDeptId]);
    const deptInfo = deptRes.rows[0] || { name: detected.name, head_officer_name: detected.officer, head_officer_email: detected.officerEmail };

    // Find designated officer for this department (Team Lead or Manager)
    const officerRes = await query(`
      SELECT id, full_name, email, role 
      FROM users 
      WHERE department_id = $1 AND role IN ('Team Lead', 'Department Manager')
      ORDER BY role ASC LIMIT 1
    `, [targetDeptId]);

    const assignedOfficer = {
      id: officerRes.rows[0]?.id || `off-${targetDeptId}`,
      full_name: officerRes.rows[0]?.full_name || deptInfo.head_officer_name || detected.officer || 'Department Officer',
      email: officerRes.rows[0]?.email || deptInfo.head_officer_email || detected.officerEmail || 'officer@shopsphere.com'
    };

    const newTicketNum = `TKT-${new Date().getFullYear()}-${deptInfo.name.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newId = `cmp-${Date.now().toString().slice(-6)}`;

    // Resolve user reporting lines if employee grievance
    let empId = null;
    let tlId = null;
    let mgrId = null;

    if (type === 'EMPLOYEE_GRIEVANCE' || req.user.role === 'Employee') {
      empId = req.user.id;
      // Fetch employee's assigned team lead and manager
      const empInfo = await query('SELECT team_lead_id, manager_id FROM users WHERE id = $1', [req.user.id]);
      if (empInfo.rows.length > 0) {
        tlId = empInfo.rows[0].team_lead_id;
        mgrId = empInfo.rows[0].manager_id;
      }
    }

    const assignedClientId = clientId || req.user.clientId || null;

    await query(`
      INSERT INTO complaints (
        id, ticket_number, type, title, description, department_id, department_name,
        category, severity, status, submitted_by_id, submitted_by_name, submitted_by_email,
        submitted_by_role, employee_id, team_lead_id, manager_id, client_id, order_id,
        order_number, product_id, assigned_officer_id, assigned_officer_name,
        assigned_officer_email, alert_sent, alert_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'OFFICER_ALERTED', $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, true, CURRENT_TIMESTAMP)
    `, [
      newId, newTicketNum, type, title.trim(), description.trim(), targetDeptId, deptInfo.name,
      category, severity, req.user?.id || 'usr-cust-01', req.user?.fullName || req.user?.email || 'ShopSphere Customer', req.user?.email || 'customer@shopsphere.in',
      req.user?.role || 'Customer', empId || null, tlId || null, mgrId || null, assignedClientId || null, orderId || null,
      orderNumber || null, productId || null, assignedOfficer.id, assignedOfficer.full_name,
      assignedOfficer.email
    ]);

    // Insert timeline entry 1: Ticket Filed
    await query(`
      INSERT INTO complaint_timeline (id, complaint_id, action, message, actor_name, actor_role)
      VALUES ($1, $2, 'SUBMITTED', $3, $4, $5)
    `, [`tim-${newId}-1`, newId, `Complaint lodged under ${category}. Auto-detected department: ${deptInfo.name}.`, req.user?.fullName || req.user?.email || 'ShopSphere Customer', req.user?.role || 'Customer']);

    // Insert timeline entry 2: Officer Alert Broadcasted
    await query(`
      INSERT INTO complaint_timeline (id, complaint_id, action, message, actor_name, actor_role)
      VALUES ($1, $2, 'OFFICER_ALERTED', $3, $4, $5)
    `, [`tim-${newId}-2`, newId, `High-priority alert dispatched immediately to ${assignedOfficer.full_name} (${assignedOfficer.email})`, 'Live Alert Engine', 'Automated Dispatch']);

    // Immutable audit log
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'COMPLAINT_FILED', 'COMPLAINT', $3, $4, $5, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      `aud-${Date.now().toString().slice(-6)}`,
      req.user.email,
      newId,
      `New ${type} filed: ${title} -> Alerted ${assignedOfficer.full_name}`,
      JSON.stringify({ ticketNumber: newTicketNum, department: deptInfo.name, officer: assignedOfficer.full_name, severity })
    ]);

    res.status(201).json({
      message: 'Complaint successfully registered. Officer has been alerted immediately.',
      complaint: {
        id: newId,
        ticketNumber: newTicketNum,
        type,
        title,
        description,
        departmentName: deptInfo.name,
        assignedOfficerName: assignedOfficer.full_name,
        assignedOfficerEmail: assignedOfficer.email,
        status: 'OFFICER_ALERTED',
        alertSent: true,
        alertTime: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to file complaint: ' + err.message });
  }
});

// GET /api/complaints — Scoped list of complaints based on hierarchy and role
router.get('/', authenticate, async (req, res) => {
  const { departmentId, status, severity, type, search } = req.query;

  try {
    let whereClauses = [];
    let params = [];

    // STRICT ROLE & HIERARCHY SCOPING RULES:
    if (req.user.role === 'Client') {
      // Clients only see their own complaints
      params.push(req.user.clientId || req.user.id);
      params.push(req.user.email.toLowerCase());
      whereClauses.push(`(c.client_id = $${params.length - 1} OR c.submitted_by_id = $${params.length - 1} OR LOWER(c.submitted_by_email) = $${params.length})`);
    } else if (req.user.role === 'Employee') {
      // Employees ONLY see the grievances THEY submitted!
      params.push(req.user.id);
      whereClauses.push(`(c.employee_id = $${params.length} OR c.submitted_by_id = $${params.length})`);
    } else if (req.user.role === 'Team Lead') {
      // Team Leads see:
      // 1. Client complaints assigned to their department/team
      // 2. Grievances from employees ASSIGNED TO THIS TEAM LEAD!
      params.push(req.user.id);
      params.push(req.user.departmentId || 'dept-deliv');
      whereClauses.push(`(
        c.team_lead_id = $${params.length - 1} 
        OR c.assigned_officer_id = $${params.length - 1}
        OR (c.type = 'CLIENT_COMPLAINT' AND c.department_id = $${params.length})
      )`);
    } else if (req.user.role === 'Department Manager') {
      // Department Managers see:
      // All complaints and grievances within their department
      params.push(req.user.departmentId || 'dept-deliv');
      params.push(req.user.id);
      whereClauses.push(`(c.department_id = $${params.length - 1} OR c.manager_id = $${params.length})`);
    } else if (req.user.role === 'HR') {
      // HR sees all employee grievances and HR department tickets
      whereClauses.push(`(c.type = 'EMPLOYEE_GRIEVANCE' OR c.department_id = 'dept-hr')`);
    }
    // Admin and Overall Manager see all complaints across the organization

    // Query Filters
    if (departmentId && departmentId !== 'ALL') {
      params.push(departmentId);
      whereClauses.push(`c.department_id = $${params.length}`);
    }
    if (status && status !== 'ALL') {
      params.push(status);
      whereClauses.push(`c.status = $${params.length}`);
    }
    if (severity && severity !== 'ALL') {
      params.push(severity);
      whereClauses.push(`c.severity = $${params.length}`);
    }
    if (type && type !== 'ALL') {
      params.push(type);
      whereClauses.push(`c.type = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`(c.title ILIKE $${params.length} OR c.ticket_number ILIKE $${params.length} OR c.description ILIKE $${params.length} OR c.order_number ILIKE $${params.length})`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const result = await query(`
      SELECT 
        c.id, c.ticket_number, c.type, c.title, c.description, c.department_id, c.department_name,
        c.category, c.severity, c.status, c.submitted_by_name, c.submitted_by_email, c.submitted_by_role,
        c.employee_id, c.team_lead_id, c.manager_id, c.client_id, c.order_id, c.order_number,
        c.product_id, c.assigned_officer_name, c.assigned_officer_email, c.alert_sent, c.alert_time,
        c.resolution_notes, c.resolution_action, c.resolved_at, c.created_at, c.updated_at
      FROM complaints c
      ${whereSQL}
      ORDER BY 
        CASE c.severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          ELSE 4
        END,
        c.created_at DESC
    `, params);

    res.json({ complaints: result.rows, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve complaints: ' + err.message });
  }
});

// GET /api/complaints/live-alerts — Real-time active alerts for logged-in Officer / Manager
router.get('/live-alerts', authenticate, async (req, res) => {
  try {
    let whereSQL = "WHERE c.status IN ('OPEN', 'OFFICER_ALERTED', 'INVESTIGATING') AND c.alert_sent = true";
    const params = [];

    if (req.user.role === 'Team Lead') {
      params.push(req.user.id);
      params.push(req.user.departmentId || 'dept-deliv');
      whereSQL += ` AND (c.team_lead_id = $1 OR c.assigned_officer_id = $1 OR c.department_id = $2)`;
    } else if (req.user.role === 'Department Manager') {
      params.push(req.user.departmentId || 'dept-deliv');
      whereSQL += ` AND (c.department_id = $1)`;
    }

    const alertsRes = await query(`
      SELECT 
        c.id, c.ticket_number, c.type, c.title, c.department_name, c.severity,
        c.status, c.assigned_officer_name, c.submitted_by_name, c.created_at, c.alert_time
      FROM complaints c
      ${whereSQL}
      ORDER BY c.alert_time DESC
      LIMIT 10
    `, params);

    res.json({ alerts: alertsRes.rows, count: alertsRes.rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch live alerts: ' + err.message });
  }
});

// GET /api/complaints/stats — Management & Senior Level Analytics
router.get('/stats', authenticate, async (req, res) => {
  try {
    // By Department breakdown
    const deptStats = await query(`
      SELECT 
        d.id as department_id,
        d.name as department_name,
        d.code as department_code,
        COUNT(c.id) as total_complaints,
        COUNT(c.id) FILTER (WHERE c.status NOT IN ('RESOLVED', 'CLOSED')) as active_complaints,
        COUNT(c.id) FILTER (WHERE c.status = 'RESOLVED') as resolved_complaints,
        COUNT(c.id) FILTER (WHERE c.severity = 'CRITICAL') as critical_count,
        ROUND(AVG(d.sla_hours), 0) as target_sla_hours
      FROM departments d
      LEFT JOIN complaints c ON c.department_id = d.id
      GROUP BY d.id
      ORDER BY total_complaints DESC
    `);

    // Overall status counts
    const statusStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'OPEN') as open,
        COUNT(*) FILTER (WHERE status = 'OFFICER_ALERTED') as alerted,
        COUNT(*) FILTER (WHERE status = 'INVESTIGATING') as investigating,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress,
        COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved,
        COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical
      FROM complaints
    `);

    // Category breakdown
    const categoryStats = await query(`
      SELECT category, COUNT(*) as count 
      FROM complaints 
      GROUP BY category 
      ORDER BY count DESC 
      LIMIT 6
    `);

    res.json({
      departmentBreakdown: deptStats.rows,
      statusCounts: statusStats.rows[0],
      categoryBreakdown: categoryStats.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaint analytics: ' + err.message });
  }
});

// GET /api/complaints/:id — Retrieve full complaint with timeline
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const compRes = await query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (compRes.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint ticket not found' });
    }

    const complaint = compRes.rows[0];

    // Check permissions
    if (req.user.role === 'Employee' && complaint.submitted_by_id !== req.user.id && complaint.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only view your own grievances.' });
    }
    if (req.user.role === 'Client' && complaint.client_id !== req.user.clientId && complaint.submitted_by_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only view your own complaints.' });
    }

    const timelineRes = await query('SELECT * FROM complaint_timeline WHERE complaint_id = $1 ORDER BY timestamp ASC', [id]);

    res.json({
      complaint,
      timeline: timelineRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaint detail: ' + err.message });
  }
});

// PUT /api/complaints/:id/status — Update status, resolution notes, and action taken
router.put('/:id/status', authenticate, async (req, res) => {
  const { id } = req.params;
  const { status, resolutionNotes, resolutionAction, assignedOfficerId, assignedOfficerName } = req.body;

  try {
    const existing = await query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const current = existing.rows[0];
    const isResolving = status === 'RESOLVED';
    const resolvedAt = isResolving ? new Date().toISOString() : current.resolved_at;

    await query(`
      UPDATE complaints 
      SET status = COALESCE($1, status),
          resolution_notes = COALESCE($2, resolution_notes),
          resolution_action = COALESCE($3, resolution_action),
          assigned_officer_id = COALESCE($4, assigned_officer_id),
          assigned_officer_name = COALESCE($5, assigned_officer_name),
          resolved_at = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
    `, [status, resolutionNotes, resolutionAction, assignedOfficerId, assignedOfficerName, resolvedAt, id]);

    // Insert timeline update
    const timelineAction = isResolving ? 'RESOLVED' : 'STATUS_UPDATE';
    const msg = isResolving 
      ? `Ticket marked RESOLVED with action: ${resolutionAction || 'Corrective Measures Applied'}. Notes: ${resolutionNotes || 'Remediation completed.'}`
      : `Status changed from ${current.status} to ${status}. ${resolutionNotes ? `Note: ${resolutionNotes}` : ''}`;

    await query(`
      INSERT INTO complaint_timeline (id, complaint_id, action, message, actor_name, actor_role)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [`tim-${id}-${Date.now().toString().slice(-4)}`, id, timelineAction, msg, req.user.fullName, req.user.role]);

    // Immutable audit log
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'UPDATE_COMPLAINT_STATUS', 'COMPLAINT', $3, $4, $5, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      `aud-${Date.now().toString().slice(-6)}`,
      req.user.email,
      id,
      `Officer updated ticket ${current.ticket_number} status to ${status}`,
      JSON.stringify({ oldStatus: current.status, newStatus: status, resolutionAction })
    ]);

    res.json({ message: 'Complaint status updated successfully', status, resolvedAt });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update complaint: ' + err.message });
  }
});

// POST /api/complaints/:id/timeline — Add a note or response to timeline
router.post('/:id/timeline', authenticate, async (req, res) => {
  const { id } = req.params;
  const { message, action = 'OFFICER_NOTE' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    const timelineId = `tim-${id}-${Date.now().toString().slice(-4)}`;
    await query(`
      INSERT INTO complaint_timeline (id, complaint_id, action, message, actor_name, actor_role)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [timelineId, id, action, message.trim(), req.user.fullName, req.user.role]);

    res.status(201).json({ message: 'Timeline note recorded', entryId: timelineId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add timeline entry: ' + err.message });
  }
});

module.exports = router;
