const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../db/postgres');
const { authenticate, authorize, JWT_SECRET, ROLE_PERMISSIONS } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userRes = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userRes.rows[0];
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        departmentId: user.department_id,
        departmentName: user.department_name,
        managerId: user.manager_id,
        teamLeadId: user.team_lead_id,
        clientId: user.client_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        departmentId: user.department_id,
        departmentName: user.department_name,
        managerId: user.manager_id,
        teamLeadId: user.team_lead_id,
        clientId: user.client_id,
        companyName: user.company_name,
        phone: user.phone,
        permissions: ROLE_PERMISSIONS[user.role] || []
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const userRes = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length > 0) {
      const u = userRes.rows[0];
      return res.json({
        user: {
          id: u.id,
          email: u.email,
          fullName: u.full_name,
          role: u.role,
          departmentId: u.department_id,
          departmentName: u.department_name,
          managerId: u.manager_id,
          teamLeadId: u.team_lead_id,
          clientId: u.client_id,
          companyName: u.company_name,
          phone: u.phone,
          permissions: ROLE_PERMISSIONS[u.role] || []
        }
      });
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        fullName: req.user.fullName,
        role: req.user.role,
        departmentId: req.user.departmentId,
        departmentName: req.user.departmentName,
        managerId: req.user.managerId,
        teamLeadId: req.user.teamLeadId,
        clientId: req.user.clientId,
        permissions: ROLE_PERMISSIONS[req.user.role] || []
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/switch-role (Demo switcher for testing all hierarchy roles easily)
router.post('/switch-role', authenticate, async (req, res) => {
  const { role } = req.body;
  if (!ROLE_PERMISSIONS[role]) {
    return res.status(400).json({ error: `Invalid role. Allowed roles: ${Object.keys(ROLE_PERMISSIONS).join(', ')}` });
  }

  try {
    // Try to find a representative user with this role
    const demoUserRes = await query('SELECT * FROM users WHERE role = $1 ORDER BY created_at ASC LIMIT 1', [role]);
    let target = demoUserRes.rows[0];

    if (!target) {
      target = {
        id: req.user.id,
        email: req.user.email,
        full_name: req.user.fullName,
        role: role,
        department_id: null,
        department_name: null,
        manager_id: null,
        team_lead_id: null,
        client_id: null
      };
    }

    const updatedToken = jwt.sign(
      {
        id: target.id,
        email: target.email,
        role: target.role,
        fullName: target.full_name,
        departmentId: target.department_id,
        departmentName: target.department_name,
        managerId: target.manager_id,
        teamLeadId: target.team_lead_id,
        clientId: target.client_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token: updatedToken,
      user: {
        id: target.id,
        email: target.email,
        fullName: target.full_name,
        role: target.role,
        departmentId: target.department_id,
        departmentName: target.department_name,
        managerId: target.manager_id,
        teamLeadId: target.team_lead_id,
        clientId: target.client_id,
        companyName: target.company_name,
        phone: target.phone,
        permissions: ROLE_PERMISSIONS[role]
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Switch role failed: ' + err.message });
  }
});

// POST /api/auth/client-register — Public registration for commercial clients
router.post('/client-register', async (req, res) => {
  const { email, password, fullName, companyName, phone } = req.body;

  if (!email || !password || !fullName || !companyName) {
    return res.status(400).json({ error: 'Email, password, fullName, and companyName are required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: `Account with email '${cleanEmail}' already exists. Please login.` });
    }

    const newId = `usr-cli-${Date.now().toString().slice(-6)}`;
    const newClientId = `CLI-${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = bcrypt.hashSync(password, 10);

    await query(`
      INSERT INTO users (id, email, password_hash, full_name, role, company_name, client_id, phone, created_at)
      VALUES ($1, $2, $3, $4, 'Client', $5, $6, $7, CURRENT_TIMESTAMP)
    `, [newId, cleanEmail, passwordHash, fullName.trim(), companyName.trim(), newClientId, phone || null]);

    const token = jwt.sign(
      {
        id: newId,
        email: cleanEmail,
        role: 'Client',
        fullName: fullName.trim(),
        clientId: newClientId,
        departmentId: null,
        departmentName: null,
        managerId: null,
        teamLeadId: null
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Client account registered successfully',
      token,
      user: {
        id: newId,
        email: cleanEmail,
        fullName: fullName.trim(),
        role: 'Client',
        companyName: companyName.trim(),
        clientId: newClientId,
        phone: phone || null,
        permissions: ROLE_PERMISSIONS['Client']
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Client registration failed: ' + err.message });
  }
});

// GET /api/auth/hierarchy-users — Fetch managers, team leads, and departments for assignment
router.get('/hierarchy-users', authenticate, async (req, res) => {
  try {
    const managersRes = await query(`
      SELECT id, email, full_name, role, department_id, department_name 
      FROM users 
      WHERE role IN ('Overall Manager', 'Department Manager', 'Admin')
      ORDER BY full_name ASC
    `);

    const teamLeadsRes = await query(`
      SELECT id, email, full_name, role, department_id, department_name, manager_id 
      FROM users 
      WHERE role = 'Team Lead'
      ORDER BY full_name ASC
    `);

    const deptsRes = await query(`
      SELECT id, name, code, head_officer_name 
      FROM departments 
      ORDER BY name ASC
    `);

    res.json({
      managers: managersRes.rows,
      teamLeads: teamLeadsRes.rows,
      departments: deptsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hierarchy users: ' + err.message });
  }
});

// GET /api/auth/users — Company Admin lists all users with hierarchy details
router.get('/users', authenticate, authorize(['Admin', 'Overall Manager']), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        u.id, u.email, u.full_name, u.role, u.department_id, u.department_name,
        u.manager_id, mgr.full_name as manager_name,
        u.team_lead_id, tl.full_name as team_lead_name,
        u.phone, u.company_name, u.client_id, u.status, u.created_at
      FROM users u
      LEFT JOIN users mgr ON u.manager_id = mgr.id
      LEFT JOIN users tl ON u.team_lead_id = tl.id
      ORDER BY u.created_at DESC
    `);
    res.json({ users: result.rows, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve company users: ' + err.message });
  }
});

// POST /api/auth/users — Company Admin provisions new user & assigns role and reporting lines
router.post('/users', authenticate, authorize(['Admin', 'Overall Manager']), async (req, res) => {
  const { email, password, fullName, role, departmentId, departmentName, managerId, teamLeadId, phone, companyName, clientId } = req.body;

  if (!email || !password || !fullName || !role) {
    return res.status(400).json({ error: 'Email, password, fullName, and role are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Invalid email address or Gmail ID format.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  if (!ROLE_PERMISSIONS[role]) {
    return res.status(400).json({
      error: `Invalid role '${role}'. Allowed roles: ${Object.keys(ROLE_PERMISSIONS).join(', ')}`
    });
  }

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: `User with email '${cleanEmail}' already exists.` });
    }

    const newId = `usr-${Date.now().toString().slice(-6)}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const assignedClientId = role === 'Client' ? (clientId || `CLI-${Math.floor(1000 + Math.random() * 9000)}`) : null;

    await query(`
      INSERT INTO users (id, email, password_hash, full_name, role, department_id, department_name, manager_id, team_lead_id, phone, company_name, client_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
    `, [newId, cleanEmail, passwordHash, fullName.trim(), role, departmentId || null, departmentName || null, managerId || null, teamLeadId || null, phone || null, companyName || null, assignedClientId]);

    // Record in immutable audit log
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'CREATE_USER', 'USER', $3, $4, $5, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      `aud-${Date.now().toString().slice(-6)}`,
      req.user.email,
      newId,
      `Company Admin created new user ${cleanEmail} with role ${role} in ${departmentName || 'Global'}`,
      JSON.stringify({ newUserId: newId, email: cleanEmail, fullName, role, departmentName, managerId, teamLeadId })
    ]);

    res.status(201).json({
      message: 'User provisioned successfully with reporting hierarchy',
      user: {
        id: newId,
        email: cleanEmail,
        fullName: fullName.trim(),
        role,
        departmentId,
        departmentName,
        managerId,
        teamLeadId,
        clientId: assignedClientId,
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user: ' + err.message });
  }
});

// PUT /api/auth/users/:id/role — Company Admin changes role
router.put('/users/:id/role', authenticate, authorize(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !ROLE_PERMISSIONS[role]) {
    return res.status(400).json({
      error: `Valid role is required. Allowed roles: ${Object.keys(ROLE_PERMISSIONS).join(', ')}`
    });
  }

  try {
    const userCheck = await query('SELECT id, email, role FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = userCheck.rows[0];

    // Prevent demoting the primary admin if it's the current user and only admin
    if (req.user.id === id && role !== 'Admin') {
      const adminCount = await query("SELECT COUNT(*) as count FROM users WHERE role = 'Admin'");
      if (parseInt(adminCount.rows[0].count, 10) <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last remaining Admin role.' });
      }
    }

    await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);

    // Audit log
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'UPDATE_USER_ROLE', 'USER', $3, $4, $5, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      `aud-${Date.now().toString().slice(-6)}`,
      req.user.email,
      id,
      `Company Admin updated user role from ${targetUser.role} to ${role}`,
      JSON.stringify({ userId: id, oldRole: targetUser.role, newRole: role, targetEmail: targetUser.email })
    ]);

    res.json({ message: `Role updated to ${role} successfully for user ${targetUser.email}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role: ' + err.message });
  }
});

// PUT /api/auth/users/:id/password — Company Admin changes/resets password
router.put('/users/:id/password', authenticate, authorize(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  try {
    const userCheck = await query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = userCheck.rows[0];
    const passwordHash = bcrypt.hashSync(newPassword, 10);

    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);

    // Audit log
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'RESET_USER_PASSWORD', 'USER', $3, $4, $5, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      `aud-${Date.now().toString().slice(-6)}`,
      req.user.email,
      id,
      `Company Admin reset password for ${targetUser.email}`,
      JSON.stringify({ userId: id, targetEmail: targetUser.email, resetBy: req.user.email })
    ]);

    res.json({ message: `Password reset successfully for user ${targetUser.email}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password: ' + err.message });
  }
});

// DELETE /api/auth/users/:id — Company Admin deletes user
router.delete('/users/:id', authenticate, authorize(['Admin']), async (req, res) => {
  const { id } = req.params;

  if (req.user.id === id) {
    return res.status(400).json({ error: 'Cannot delete your own admin account while logged in.' });
  }

  try {
    const userCheck = await query('SELECT id, email, role FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = userCheck.rows[0];
    await query('DELETE FROM users WHERE id = $1', [id]);

    // Audit log
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'DELETE_USER', 'USER', $3, $4, $5, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      `aud-${Date.now().toString().slice(-6)}`,
      req.user.email,
      id,
      `Company Admin deleted user ${targetUser.email}`,
      JSON.stringify({ userId: id, deletedEmail: targetUser.email, role: targetUser.role })
    ]);

    res.json({ message: `User ${targetUser.email} has been deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user: ' + err.message });
  }
});

module.exports = router;
