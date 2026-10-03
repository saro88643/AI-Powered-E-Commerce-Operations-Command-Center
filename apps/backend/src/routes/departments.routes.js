const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/departments — List all departments with operational statistics
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        d.id, d.name, d.code, d.description, d.head_officer_name, d.head_officer_email,
        d.sla_hours, d.status, d.created_at,
        COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'Employee') as employee_count,
        COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'Team Lead') as team_lead_count,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status NOT IN ('RESOLVED', 'CLOSED')) as active_complaints_count,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'RESOLVED') as resolved_complaints_count
      FROM departments d
      LEFT JOIN users u ON u.department_id = d.id
      LEFT JOIN complaints c ON c.department_id = d.id
      GROUP BY d.id
      ORDER BY d.name ASC
    `);

    res.json({ departments: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch departments: ' + err.message });
  }
});

// POST /api/departments — Admin provisions a new company department
router.post('/', authenticate, authorize(['Admin', 'Overall Manager']), async (req, res) => {
  const { name, code, description, headOfficerName, headOfficerEmail, slaHours } = req.body;

  if (!name || !code) {
    return res.status(400).json({ error: 'Department name and code are required' });
  }

  const deptId = `dept-${code.toLowerCase().trim()}-${Date.now().toString().slice(-4)}`;

  try {
    await query(`
      INSERT INTO departments (id, name, code, description, head_officer_name, head_officer_email, sla_hours, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
    `, [deptId, name.trim(), code.toUpperCase().trim(), description || '', headOfficerName || '', headOfficerEmail || '', slaHours || 24]);

    // Record audit log
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'CREATE_DEPARTMENT', 'DEPARTMENT', $3, $4, $5, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      `aud-${Date.now().toString().slice(-6)}`,
      req.user.email,
      deptId,
      `Created new department ${name} (${code})`,
      JSON.stringify({ name, code, headOfficerName, slaHours })
    ]);

    res.status(201).json({
      message: 'Department created successfully',
      department: { id: deptId, name, code, description, headOfficerName, headOfficerEmail, slaHours }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create department: ' + err.message });
  }
});

// PUT /api/departments/:id — Update department details
router.put('/:id', authenticate, authorize(['Admin', 'Overall Manager']), async (req, res) => {
  const { id } = req.params;
  const { name, code, description, headOfficerName, headOfficerEmail, slaHours, status } = req.body;

  try {
    await query(`
      UPDATE departments
      SET name = COALESCE($1, name),
          code = COALESCE($2, code),
          description = COALESCE($3, description),
          head_officer_name = COALESCE($4, head_officer_name),
          head_officer_email = COALESCE($5, head_officer_email),
          sla_hours = COALESCE($6, sla_hours),
          status = COALESCE($7, status)
      WHERE id = $8
    `, [name, code, description, headOfficerName, headOfficerEmail, slaHours, status, id]);

    res.json({ message: 'Department updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update department: ' + err.message });
  }
});

// GET /api/departments/org-chart — Full Hierarchical Organization Chart Tree
router.get('/org-chart', authenticate, async (req, res) => {
  try {
    // 1. Fetch Overall Manager / Executives
    const execsRes = await query(`
      SELECT id, full_name, email, role, phone, 'ACTIVE' as status
      FROM users 
      WHERE role IN ('Overall Manager', 'Admin')
      ORDER BY role ASC, full_name ASC
    `);

    // 2. Fetch Departments
    const deptsRes = await query(`
      SELECT 
        d.id, d.name, d.code, d.description, d.head_officer_name, d.head_officer_email,
        d.sla_hours, d.status,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status NOT IN ('RESOLVED', 'CLOSED')) as active_complaints
      FROM departments d
      LEFT JOIN complaints c ON c.department_id = d.id
      GROUP BY d.id
      ORDER BY d.name ASC
    `);

    // 3. Fetch all Users with their reporting line and active complaints
    const usersRes = await query(`
      SELECT 
        u.id, u.full_name, u.email, u.role, u.department_id, u.department_name,
        u.manager_id, u.team_lead_id, u.phone, u.status,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status NOT IN ('RESOLVED', 'CLOSED')) as pending_tickets
      FROM users u
      LEFT JOIN complaints c ON (c.assigned_officer_id = u.id OR c.employee_id = u.id)
      WHERE u.role NOT IN ('Client')
      GROUP BY u.id
      ORDER BY u.full_name ASC
    `);

    const allUsers = usersRes.rows;
    const depts = deptsRes.rows;

    // Assemble hierarchical tree
    const departmentNodes = depts.map(dept => {
      // Find Department Manager
      const deptManager = allUsers.find(u => u.department_id === dept.id && u.role.includes('Manager')) || {
        id: `mock-mgr-${dept.id}`,
        full_name: dept.head_officer_name || 'Designated Department Manager',
        email: dept.head_officer_email,
        role: 'Department Manager',
        pending_tickets: 0
      };

      // Find HR for this department
      const deptHRs = allUsers.filter(u => u.department_id === dept.id && u.role === 'HR');

      // Find Team Leads for this department
      const teamLeads = allUsers.filter(u => u.department_id === dept.id && u.role === 'Team Lead');

      // For each Team Lead, find their assigned Employees
      const teamLeadNodes = teamLeads.map(tl => {
        const teamEmployees = allUsers.filter(u => u.team_lead_id === tl.id || (u.department_id === dept.id && u.role === 'Employee' && !u.team_lead_id));
        return {
          ...tl,
          employees: teamEmployees
        };
      });

      // Direct employees not under team leads
      const unassignedEmployees = allUsers.filter(u => u.department_id === dept.id && u.role === 'Employee' && !teamLeads.some(tl => tl.id === u.team_lead_id));

      return {
        ...dept,
        manager: deptManager,
        hrs: deptHRs,
        teamLeads: teamLeadNodes,
        unassignedEmployees,
        totalStaff: allUsers.filter(u => u.department_id === dept.id).length
      };
    });

    const rootNode = {
      id: 'root-exec',
      companyName: 'ShopSphere Global Operations',
      executives: execsRes.rows,
      departments: departmentNodes,
      totalEmployees: allUsers.length,
      totalDepartments: depts.length
    };

    res.json(rootNode);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate organization chart: ' + err.message });
  }
});

module.exports = router;
