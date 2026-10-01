const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../db/postgres');
const { authenticate, JWT_SECRET, ROLE_PERMISSIONS } = require('../middleware/auth');

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

module.exports = router;
