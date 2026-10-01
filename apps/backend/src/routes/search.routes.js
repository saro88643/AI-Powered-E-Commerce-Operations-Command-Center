const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const { getCollection } = require('../db/mongo');
const { authenticate } = require('../middleware/auth');

// GET /api/search
router.get('/', authenticate, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length === 0) {
    return res.json({ orders: [], customers: [], products: [], tickets: [], warehouses: [], incidents: [] });
  }

  const term = q.trim();
  const searchPattern = `%${term}%`;

  try {
    // 1. Search Orders
    const ordRes = await query(`
      SELECT id, order_number, customer_id, shipping_city, status, total_amount, expected_delivery
      FROM orders
      WHERE order_number ILIKE $1 OR customer_id ILIKE $1 OR shipping_city ILIKE $1
      LIMIT 10
    `, [searchPattern]);

    // 2. Search Warehouses
    const whRes = await query(`
      SELECT id, code, name, city, api_status
      FROM warehouses
      WHERE code ILIKE $1 OR name ILIKE $1 OR city ILIKE $1
      LIMIT 10
    `, [searchPattern]);

    // 3. Search Incidents
    const incRes = await query(`
      SELECT id, incident_number, title, severity, status, service
      FROM incidents
      WHERE incident_number ILIKE $1 OR title ILIKE $1 OR description ILIKE $1
      LIMIT 10
    `, [searchPattern]);

    // 4. Search Products in Inventory
    const prodRes = await query(`
      SELECT DISTINCT product_id, sku, product_name, category
      FROM inventory
      WHERE product_id ILIKE $1 OR sku ILIKE $1 OR product_name ILIKE $1
      LIMIT 10
    `, [searchPattern]);

    // 5. Search Customers & Tickets in MongoDB
    const custColl = getCollection('customers');
    const tickColl = getCollection('support_tickets');

    const customers = await custColl.find({
      $or: [
        { customer_id: new RegExp(term, 'i') },
        { name: new RegExp(term, 'i') },
        { email: new RegExp(term, 'i') },
        { phone: new RegExp(term, 'i') }
      ]
    }).limit(10).toArray();

    const tickets = await tickColl.find({
      $or: [
        { ticket_id: new RegExp(term, 'i') },
        { customer_id: new RegExp(term, 'i') },
        { order_id: new RegExp(term, 'i') },
        { message: new RegExp(term, 'i') }
      ]
    }).limit(10).toArray();

    res.json({
      query: term,
      results: {
        orders: ordRes.rows,
        customers,
        products: prodRes.rows,
        tickets,
        warehouses: whRes.rows,
        incidents: incRes.rows
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Search failed: ' + err.message });
  }
});

module.exports = router;
