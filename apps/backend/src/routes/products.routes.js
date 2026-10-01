const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { query } = require('../db/postgres');
const { authenticate } = require('../middleware/auth');

// Cache CSV products in memory for fast querying
let productCatalog = [];
const csvPath = path.join(__dirname, '../../../../data/csv/product_catalog.csv');
try {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    const obj = {};
    headers.forEach((h, idx) => {
      let val = parts[idx];
      if (['price', 'cost', 'weight', 'rating', 'return_rate'].includes(h)) val = parseFloat(val);
      if (['reorder_threshold'].includes(h)) val = parseInt(val, 10);
      obj[h] = val;
    });
    productCatalog.push(obj);
  }
} catch (e) {
  console.warn('Could not parse product_catalog.csv:', e.message);
}

// GET /api/products
router.get('/', authenticate, async (req, res) => {
  const { category, minReturnRate, search, page = 1, limit = 25 } = req.query;

  let filtered = [...productCatalog];
  if (category) {
    filtered = filtered.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
  }
  if (minReturnRate) {
    filtered = filtered.filter(p => p.return_rate >= parseFloat(minReturnRate));
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(p => 
      (p.product_id && p.product_id.toLowerCase().includes(s)) ||
      (p.name && p.name.toLowerCase().includes(s)) ||
      (p.sku && p.sku.toLowerCase().includes(s)) ||
      (p.brand && p.brand.toLowerCase().includes(s))
    );
  }

  const total = filtered.length;
  const startIdx = (parseInt(page) - 1) * parseInt(limit);
  const data = filtered.slice(startIdx, startIdx + parseInt(limit));

  res.json({
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
    data
  });
});

// GET /api/products/:id
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const product = productCatalog.find(p => p.product_id.toLowerCase() === id.toLowerCase() || p.sku.toLowerCase() === id.toLowerCase());

  if (!product) {
    return res.status(404).json({ error: `Product ${id} not found` });
  }

  // Get live inventory distribution across warehouses
  const invRes = await query(`
    SELECT i.*, w.name as warehouse_name, w.city as warehouse_city
    FROM inventory i
    LEFT JOIN warehouses w ON i.warehouse_id = w.id
    WHERE i.product_id = $1
  `, [product.product_id]);

  // Get return statistics
  const retRes = await query(`
    SELECT COUNT(*) as return_count, SUM(refund_amount) as total_refunded
    FROM returns
    WHERE product_id = $1
  `, [product.product_id]);

  res.json({
    ...product,
    inventory: invRes.rows,
    returnsSummary: {
      returnCount: parseInt(retRes.rows[0]?.return_count || 0, 10),
      totalRefunded: parseFloat(retRes.rows[0]?.total_refunded || 0)
    }
  });
});

module.exports = router;
