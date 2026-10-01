const { query, initPostgres } = require('./postgres');
const bcrypt = require('bcryptjs');

const MIGRATIONS = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB
);

CREATE TABLE IF NOT EXISTS warehouses (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  address TEXT,
  capacity INT,
  current_utilization INT,
  api_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id VARCHAR(50) NOT NULL,
  channel VARCHAR(50),
  warehouse_id VARCHAR(50),
  order_date TIMESTAMP,
  status VARCHAR(50),
  total_amount NUMERIC(12,2),
  shipping_address TEXT,
  shipping_city VARCHAR(100),
  expected_delivery TIMESTAMP,
  actual_delivery TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_city ON orders(shipping_city);
CREATE INDEX IF NOT EXISTS idx_orders_warehouse ON orders(warehouse_id);

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  sku VARCHAR(100),
  product_name VARCHAR(255),
  quantity INT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50),
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(50),
  transaction_date TIMESTAMP,
  failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

CREATE TABLE IF NOT EXISTS returns (
  id VARCHAR(50) PRIMARY KEY,
  return_number VARCHAR(50) UNIQUE,
  order_id VARCHAR(50) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255),
  reason TEXT,
  status VARCHAR(50),
  refund_amount NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(100) PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  sku VARCHAR(100),
  warehouse_id VARCHAR(50) NOT NULL,
  warehouse_code VARCHAR(20),
  product_name VARCHAR(255),
  category VARCHAR(100),
  available_quantity INT NOT NULL,
  reserved_quantity INT DEFAULT 0,
  damaged_quantity INT DEFAULT 0,
  reorder_threshold INT DEFAULT 20,
  status VARCHAR(50),
  last_sync_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_prod ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_wh ON inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);

CREATE TABLE IF NOT EXISTS inventory_events (
  id VARCHAR(50) PRIMARY KEY,
  event_type VARCHAR(50),
  product_id VARCHAR(50),
  warehouse_id VARCHAR(50),
  quantity INT,
  previous_qty INT,
  new_qty INT,
  reason TEXT,
  reference_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS restock_requests (
  id VARCHAR(50) PRIMARY KEY,
  request_number VARCHAR(50) UNIQUE,
  product_id VARCHAR(50),
  warehouse_id VARCHAR(50),
  supplier_id VARCHAR(50),
  quantity INT,
  status VARCHAR(50),
  requested_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transfers (
  id VARCHAR(50) PRIMARY KEY,
  transfer_number VARCHAR(50) UNIQUE,
  product_id VARCHAR(50),
  product_name VARCHAR(255),
  from_warehouse_id VARCHAR(50),
  to_warehouse_id VARCHAR(50),
  quantity INT,
  status VARCHAR(50),
  reason TEXT,
  requested_by VARCHAR(255),
  executed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidents (
  id VARCHAR(50) PRIMARY KEY,
  incident_number VARCHAR(50) UNIQUE,
  title VARCHAR(255),
  severity VARCHAR(50),
  service VARCHAR(100),
  description TEXT,
  affected_records_count INT,
  status VARCHAR(50),
  root_cause TEXT,
  resolution TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  user_email VARCHAR(255),
  action VARCHAR(100),
  entity VARCHAR(100),
  entity_id VARCHAR(100),
  reason TEXT,
  details JSONB,
  status VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS integration_connections (
  id VARCHAR(50) PRIMARY KEY,
  system_name VARCHAR(255),
  base_url TEXT,
  auth_type VARCHAR(50),
  api_key TEXT,
  environment VARCHAR(50),
  status VARCHAR(50),
  endpoints_status JSONB,
  last_test_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS field_mappings (
  id VARCHAR(50) PRIMARY KEY,
  integration_id VARCHAR(50),
  source_field VARCHAR(100),
  target_field VARCHAR(100),
  data_type VARCHAR(50),
  transformation VARCHAR(100),
  validation_rule TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id VARCHAR(50) PRIMARY KEY,
  connector_name VARCHAR(100),
  status VARCHAR(50),
  records_processed INT,
  records_failed INT,
  duration_ms INT,
  message TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  await initPostgres();

  const statements = MIGRATIONS.split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const sql of statements) {
    try {
      await query(sql + ';');
    } catch (err) {
      console.error(`Migration step failed: ${sql.slice(0, 60)}... -> ${err.message}`);
      throw err;
    }
  }

  // Seed Default Users for each role
  const roles = [
    { id: 'role-admin', name: 'Admin', desc: 'Full system administration, integrations, and operational authority' },
    { id: 'role-ops', name: 'Operations Manager', desc: 'Operational actions, cross-warehouse transfers, incident management' },
    { id: 'role-wh', name: 'Warehouse Manager', desc: 'Warehouse fulfillment, inventory adjustments, cycle count resolution' },
    { id: 'role-support', name: 'Support Agent', desc: 'Ticket resolution, customer notifications, goodwill credits' },
    { id: 'role-analyst', name: 'Analyst', desc: 'Analytics, data reporting, AI investigations' },
    { id: 'role-viewer', name: 'Viewer', desc: 'Read-only access across platform metrics' }
  ];

  for (const r of roles) {
    await query(`
      INSERT INTO roles (id, name, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (name) DO NOTHING;
    `, [r.id, r.name, r.desc]);
  }

  const defaultPassword = 'password123';
  const passwordHash = bcrypt.hashSync(defaultPassword, 10);

  const users = [
    { id: 'usr-admin', email: 'admin@shopsphere.com', name: 'Alex Vance (Chief Architect & Admin)', role: 'Admin' },
    { id: 'usr-ops', email: 'ops@shopsphere.com', name: 'Devon Patel (Operations Lead)', role: 'Operations Manager' },
    { id: 'usr-wh', email: 'warehouse@shopsphere.com', name: 'Marcus Chen (Warehouse Supervisor)', role: 'Warehouse Manager' },
    { id: 'usr-support', email: 'support@shopsphere.com', name: 'Sarah Jenkins (Support Lead)', role: 'Support Agent' },
    { id: 'usr-analyst', email: 'analyst@shopsphere.com', name: 'Priya Sharma (Operations Analyst)', role: 'Analyst' },
    { id: 'usr-viewer', email: 'viewer@shopsphere.com', name: 'Jordan Lee (Auditor / Viewer)', role: 'Viewer' }
  ];

  for (const u of users) {
    await query(`
      INSERT INTO users (id, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING;
    `, [u.id, u.email, passwordHash, u.name, u.role]);
  }

  console.log('✓ Database migrations and default role seed completed successfully.');
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal migration error:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations };
