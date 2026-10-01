const path = require('path');
const fs = require('fs');
const { query, initPostgres } = require('../apps/backend/src/db/postgres');
const { initMongo, getCollection } = require('../apps/backend/src/db/mongo');

const GEN_DIR = path.join(__dirname, '../data/generated');

async function batchInsert(tableName, columns, rows, batchSize = 100, onConflict = 'DO NOTHING') {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const valuePlaceholders = [];
    const values = [];
    let pIdx = 1;

    for (const row of chunk) {
      const rowPlaceholders = [];
      for (const col of columns) {
        rowPlaceholders.push(`$${pIdx++}`);
        values.push(row[col] !== undefined ? row[col] : null);
      }
      valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
    }

    const sql = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT ${onConflict};
    `;

    await query(sql, values);
  }
}

async function seed() {
  console.log('🌱 Starting ShopSphere Ultra-Fast Seeding Pipeline...');

  await initPostgres();
  await initMongo();

  // 1. Warehouses
  console.log('Seeding warehouses...');
  const warehouses = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'warehouses.json'), 'utf8'));
  await batchInsert(
    'warehouses',
    ['id', 'code', 'name', 'city', 'state', 'address', 'capacity', 'current_utilization', 'api_status', 'created_at'],
    warehouses,
    50,
    '(id) DO UPDATE SET api_status = EXCLUDED.api_status, current_utilization = EXCLUDED.current_utilization'
  );
  console.log(`✓ Seeded ${warehouses.length} warehouses`);

  // 2. Inventory
  console.log('Seeding inventory records...');
  const inventory = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'inventory.json'), 'utf8'));
  await batchInsert(
    'inventory',
    ['id', 'product_id', 'sku', 'warehouse_id', 'warehouse_code', 'product_name', 'category', 'available_quantity', 'reserved_quantity', 'damaged_quantity', 'reorder_threshold', 'status', 'last_sync_at'],
    inventory,
    100,
    '(id) DO UPDATE SET available_quantity = EXCLUDED.available_quantity, reserved_quantity = EXCLUDED.reserved_quantity, status = EXCLUDED.status'
  );
  console.log(`✓ Seeded ${inventory.length} inventory items`);

  // 3. Inventory Events
  console.log('Seeding inventory events...');
  const invEvents = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'inventory_events.json'), 'utf8'));
  await batchInsert(
    'inventory_events',
    ['id', 'event_type', 'product_id', 'warehouse_id', 'quantity', 'previous_qty', 'new_qty', 'reason', 'reference_id', 'created_at'],
    invEvents,
    100,
    'DO NOTHING'
  );
  console.log(`✓ Seeded ${invEvents.length} inventory events`);

  // 4. Orders
  console.log('Seeding orders...');
  const orders = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'orders.json'), 'utf8'));
  await batchInsert(
    'orders',
    ['id', 'order_number', 'customer_id', 'channel', 'warehouse_id', 'order_date', 'status', 'total_amount', 'shipping_address', 'shipping_city', 'expected_delivery', 'actual_delivery', 'created_at', 'updated_at'],
    orders,
    100,
    '(id) DO UPDATE SET status = EXCLUDED.status'
  );
  console.log(`✓ Seeded ${orders.length} orders`);

  // 5. Order Items
  console.log('Seeding order items...');
  const items = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'order_items.json'), 'utf8'));
  await batchInsert(
    'order_items',
    ['id', 'order_id', 'product_id', 'sku', 'product_name', 'quantity', 'unit_price', 'total_price'],
    items,
    100,
    'DO NOTHING'
  );
  console.log(`✓ Seeded ${items.length} order items`);

  // 6. Payments
  console.log('Seeding payments...');
  const payments = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'payments.json'), 'utf8'));
  await batchInsert(
    'payments',
    ['id', 'order_id', 'payment_method', 'amount', 'status', 'transaction_date', 'failure_reason'],
    payments,
    100,
    'DO NOTHING'
  );
  console.log(`✓ Seeded ${payments.length} payment records`);

  // 7. Returns
  console.log('Seeding returns...');
  const returns = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'returns.json'), 'utf8'));
  await batchInsert(
    'returns',
    ['id', 'return_number', 'order_id', 'product_id', 'product_name', 'reason', 'status', 'refund_amount', 'created_at'],
    returns,
    100,
    'DO NOTHING'
  );
  console.log(`✓ Seeded ${returns.length} return records`);

  // 8. Incidents
  console.log('Seeding incidents...');
  const incidents = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'incidents.json'), 'utf8'));
  await batchInsert(
    'incidents',
    ['id', 'incident_number', 'title', 'severity', 'service', 'description', 'affected_records_count', 'status', 'root_cause', 'resolution', 'created_at', 'updated_at'],
    incidents,
    20,
    'DO NOTHING'
  );
  console.log(`✓ Seeded ${incidents.length} incidents`);

  // 9. Initial Audit Logs
  console.log('Seeding audit logs...');
  const auditLogs = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'audit_logs.json'), 'utf8'));
  for (const a of auditLogs) {
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO NOTHING;
    `, [a.id, a.user_email, a.action, a.entity, a.entity_id, a.reason, JSON.stringify(a.details), a.status, a.timestamp]);
  }

  // 10. FDE Integration Connection & Canonical Field Mappings
  console.log('Seeding FDE client integration & field mappings...');
  await query(`
    INSERT INTO integration_connections (id, system_name, base_url, auth_type, api_key, environment, status, endpoints_status, last_test_at)
    VALUES (
      'conn-erp-external-01',
      'Nordic Retail ERP (Client Partner)',
      'http://localhost:4001',
      'bearer',
      'fde_prod_token_sec_99182',
      'production',
      'connected',
      '{"authentication": true, "productsEndpoint": true, "inventoryEndpoint": true, "ordersEndpoint": true, "responseFormat": true}',
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO NOTHING;
  `);

  const initialMappings = [
    { source: 'sku', target: 'product_id', type: 'string', transform: 'trim' },
    { source: 'available_qty', target: 'stock', type: 'number', transform: 'string_to_int' },
    { source: 'location_code', target: 'warehouse', type: 'string', transform: 'uppercase' },
    { source: 'selling_price', target: 'price', type: 'number', transform: 'currency_inr_to_usd' },
    { source: 'order_timestamp', target: 'order_date', type: 'date', transform: 'date_iso' }
  ];

  for (let mIdx = 0; mIdx < initialMappings.length; mIdx++) {
    const m = initialMappings[mIdx];
    await query(`
      INSERT INTO field_mappings (id, integration_id, source_field, target_field, data_type, transformation, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT (id) DO NOTHING;
    `, [`map-${String(mIdx + 1).padStart(3, '0')}`, 'conn-erp-external-01', m.source, m.target, m.type, m.transform]);
  }

  // 11. Seed MongoDB Customers & Support Tickets
  console.log('Seeding MongoDB collections (customers & support tickets)...');
  const custColl = getCollection('customers');
  const tickColl = getCollection('support_tickets');

  const customers = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'customers.json'), 'utf8'));
  const tickets = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'support_tickets.json'), 'utf8'));

  try {
    if (custColl.deleteMany) await custColl.deleteMany({});
    if (tickColl.deleteMany) await tickColl.deleteMany({});
  } catch (e) {}

  await custColl.insertMany(customers);
  await tickColl.insertMany(tickets);
  console.log(`✓ Seeded ${customers.length} MongoDB customers and ${tickets.length} support tickets`);

  console.log('✨ All ShopSphere databases and external systems successfully seeded!');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal seed error:', err);
      process.exit(1);
    });
}

module.exports = { seed };
