const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/company — Public/Client/Employee accessible company details
router.get('/', async (req, res) => {
  try {
    const profileRes = await query('SELECT * FROM company_profile LIMIT 1');
    const profile = profileRes.rows[0] || {
      company_name: 'ShopSphere Operations Command Platform',
      tagline: 'Enterprise Autonomous Multichannel Logistics & Fulfillment',
      description: 'Tier-1 omnichannel fulfillment network powering over 50,000 daily orders across India with AI-powered root-cause diagnosis, automated carrier dispatch, and deterministic SLA tracking.',
      email: 'contact@shopsphere.com',
      phone: '+91-80-4900-8800',
      headquarters: 'ShopSphere Tower, Electronic City Phase 1, Bengaluru, Karnataka 560100',
      gstin: '29AABCS1429B1Z8',
      support_hotline: '1800-419-7000 (Toll Free)',
      total_warehouses: 20,
      active_fleet: 450,
      sla_guarantee: '99.2% Same-Day / Next-Day Delivery Guarantee across Metro Hubs; 2-hour Grievance Response Commitment'
    };

    // Get live operational statistics
    const statsRes = await query(`
      SELECT 
        (SELECT COUNT(*) FROM warehouses) as total_warehouses,
        (SELECT COUNT(*) FROM orders) as total_orders_handled,
        (SELECT COUNT(*) FROM departments) as total_departments,
        (SELECT COUNT(*) FROM complaints WHERE status = 'RESOLVED') as resolved_complaints,
        (SELECT COUNT(*) FROM users WHERE role = 'Client') as active_commercial_clients
    `);

    // Get active departments list
    const deptsRes = await query(`
      SELECT name, code, head_officer_name, head_officer_email, sla_hours
      FROM departments
      WHERE status = 'ACTIVE'
      ORDER BY name ASC
    `);

    res.json({
      profile,
      operationalStats: statsRes.rows[0],
      departments: deptsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch company profile: ' + err.message });
  }
});

// PUT /api/company — Admin updates company operational details
router.put('/', authenticate, authorize(['Admin', 'Overall Manager']), async (req, res) => {
  const {
    companyName, tagline, description, email, phone, headquarters, gstin, supportHotline, slaGuarantee
  } = req.body;

  try {
    await query(`
      UPDATE company_profile
      SET company_name = COALESCE($1, company_name),
          tagline = COALESCE($2, tagline),
          description = COALESCE($3, description),
          email = COALESCE($4, email),
          phone = COALESCE($5, phone),
          headquarters = COALESCE($6, headquarters),
          gstin = COALESCE($7, gstin),
          support_hotline = COALESCE($8, support_hotline),
          sla_guarantee = COALESCE($9, sla_guarantee),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 'comp-01'
    `, [companyName, tagline, description, email, phone, headquarters, gstin, supportHotline, slaGuarantee]);

    res.json({ message: 'Company profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update company profile: ' + err.message });
  }
});

module.exports = router;
