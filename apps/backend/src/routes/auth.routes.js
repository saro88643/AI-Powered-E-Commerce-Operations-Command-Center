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
        fullName: user.full_name
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
        permissions: ROLE_PERMISSIONS[user.role] || []
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.fullName,
      role: req.user.role,
      permissions: ROLE_PERMISSIONS[req.user.role] || []
    }
  });
});

// POST /api/auth/switch-role (Demo feature to test RBAC roles easily)
router.post('/switch-role', authenticate, async (req, res) => {
  const { role } = req.body;
  if (!ROLE_PERMISSIONS[role]) {
    return res.status(400).json({ error: `Invalid role. Allowed roles: ${Object.keys(ROLE_PERMISSIONS).join(', ')}` });
  }

  const updatedToken = jwt.sign(
    {
      id: req.user.id,
      email: req.user.email,
      role: role,
      fullName: req.user.fullName
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token: updatedToken,
    user: {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.fullName,
      role: role,
      permissions: ROLE_PERMISSIONS[role]
    }
  });
});

// -------------------------------------------------------------
// COMPANY ADMIN ONLY: User Management, Roles & Password Admin
// -------------------------------------------------------------

// GET /api/auth/users — Company Admin lists all users
router.get('/users', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const result = await query(`
      SELECT id, email, full_name, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json({ users: result.rows, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve company users: ' + err.message });
  }
});

// POST /api/auth/users — Company Admin provisions new user & assigns role
router.post('/users', authenticate, authorize(['Admin']), async (req, res) => {
  const { email, password, fullName, role } = req.body;

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

    await query(`
      INSERT INTO users (id, email, password_hash, full_name, role, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    `, [newId, cleanEmail, passwordHash, fullName.trim(), role]);

    // Record in immutable audit log
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'CREATE_USER', 'USER', $3, $4, $5, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      `aud-${Date.now().toString().slice(-6)}`,
      req.user.email,
      newId,
      `Company Admin created new user ${cleanEmail} with role ${role}`,
      JSON.stringify({ newUserId: newId, email: cleanEmail, fullName, role })
    ]);

    res.status(201).json({
      message: 'User provisioned successfully by Company Admin',
      user: {
        id: newId,
        email: cleanEmail,
        fullName: fullName.trim(),
        role,
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
