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
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  manager_id VARCHAR(50),
  head_officer_name VARCHAR(100),
  head_officer_email VARCHAR(255),
  sla_hours INT DEFAULT 24,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
  id VARCHAR(50) PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  department_id VARCHAR(50),
  department_name VARCHAR(100),
  category VARCHAR(100),
  severity VARCHAR(50) DEFAULT 'MEDIUM',
  status VARCHAR(50) DEFAULT 'OPEN',
  submitted_by_id VARCHAR(50),
  submitted_by_name VARCHAR(255),
  submitted_by_email VARCHAR(255),
  submitted_by_role VARCHAR(50),
  employee_id VARCHAR(50),
  team_lead_id VARCHAR(50),
  manager_id VARCHAR(50),
  client_id VARCHAR(50),
  order_id VARCHAR(50),
  order_number VARCHAR(50),
  product_id VARCHAR(50),
  assigned_officer_id VARCHAR(50),
  assigned_officer_name VARCHAR(255),
  assigned_officer_email VARCHAR(255),
  alert_sent BOOLEAN DEFAULT false,
  alert_time TIMESTAMP,
  resolution_notes TEXT,
  resolution_action VARCHAR(100),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_complaints_dept ON complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_tl ON complaints(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_complaints_mgr ON complaints(manager_id);
CREATE INDEX IF NOT EXISTS idx_complaints_emp ON complaints(employee_id);
CREATE INDEX IF NOT EXISTS idx_complaints_client ON complaints(client_id);

CREATE TABLE IF NOT EXISTS complaint_timeline (
  id VARCHAR(50) PRIMARY KEY,
  complaint_id VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  actor_name VARCHAR(255),
  actor_role VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_timeline_complaint ON complaint_timeline(complaint_id);

CREATE TABLE IF NOT EXISTS company_profile (
  id VARCHAR(50) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  description TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  headquarters TEXT,
  gstin VARCHAR(50),
  support_hotline VARCHAR(50),
  total_warehouses INT DEFAULT 20,
  active_fleet INT DEFAULT 450,
  sla_guarantee TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_lead_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
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
      if (!err.message.includes('already exists')) {
        console.error(`Migration step failed: ${sql.slice(0, 60)}... -> ${err.message}`);
        throw err;
      }
    }
  }

  // Seed Default Roles
  const roles = [
    { id: 'role-admin', name: 'Admin', desc: 'Full system administration, integrations, and operational authority' },
    { id: 'role-overall-mgr', name: 'Overall Manager', desc: 'Executive operational leadership, cross-department oversight, org chart authority' },
    { id: 'role-dept-mgr', name: 'Department Manager', desc: 'Department lead, team leads & HR supervisor, complaint escalation officer' },
    { id: 'role-hr', name: 'HR', desc: 'Human resources officer, employee grievances, workplace compliance' },
    { id: 'role-tl', name: 'Team Lead', desc: 'Squad leader, direct supervisor of employees, first-response officer for complaints' },
    { id: 'role-emp', name: 'Employee', desc: 'Department operator, task executor, grievance initiator' },
    { id: 'role-client', name: 'Client', desc: 'External commercial partner or buyer, tracks orders, lodges complaints' },
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

  // Seed Departments
  const departments = [
    { id: 'dept-prod', name: 'Product & Catalog', code: 'PROD', desc: 'Product listings, SKU data quality, packaging specs, defects tracking', mgr: 'Aisha Khan', email: 'manager.product@shopsphere.com', sla: 12 },
    { id: 'dept-deliv', name: 'Delivery & Logistics', code: 'DELIV', desc: 'Courier dispatch, last-mile tracking, fleet operations, transit delay resolution', mgr: 'Vikram Singh', email: 'manager.delivery@shopsphere.com', sla: 4 },
    { id: 'dept-supp', name: 'Customer Experience & Support', code: 'SUPP', desc: 'Customer escalations, loyalty accounts, post-purchase feedback, resolution desk', mgr: 'Sarah Jenkins', email: 'manager.support@shopsphere.com', sla: 8 },
    { id: 'dept-wh', name: 'Warehousing & Inventory', code: 'WH', desc: 'Fulfillment centers, stock levels, cycle counts, pallet staging, picking operations', mgr: 'Marcus Chen', email: 'warehouse@shopsphere.com', sla: 12 },
    { id: 'dept-fin', name: 'Payments & Billing', code: 'FIN', desc: 'Invoice reconciliation, client payouts, GST billing disputes, refund processing', mgr: 'Ramesh Gupta', email: 'finance@shopsphere.com', sla: 24 },
    { id: 'dept-hr', name: 'Human Resources', code: 'HR', desc: 'Personnel operations, employee grievance redressal, team wellness, shift planning', mgr: 'Elena Rostova', email: 'hr.lead@shopsphere.com', sla: 24 }
  ];

  for (const d of departments) {
    await query(`
      INSERT INTO departments (id, name, code, description, head_officer_name, head_officer_email, sla_hours, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
      ON CONFLICT (name) DO UPDATE SET
        code = EXCLUDED.code,
        description = EXCLUDED.description,
        head_officer_name = EXCLUDED.head_officer_name,
        head_officer_email = EXCLUDED.head_officer_email,
        sla_hours = EXCLUDED.sla_hours;
    `, [d.id, d.name, d.code, d.desc, d.mgr, d.email, d.sla]);
  }

  const defaultPassword = 'password123';
  const passwordHash = bcrypt.hashSync(defaultPassword, 10);

  // Seed Comprehensive Org Hierarchy Users
  const users = [
    // 1. Super Admin
    { id: 'usr-admin', email: 'admin@shopsphere.com', name: 'Alex Vance (Chief Architect & Admin)', role: 'Admin', deptId: null, deptName: null, mgrId: null, tlId: null, phone: '+1-555-0100' },
    
    // 2. Overall General Manager
    { id: 'usr-overall-mgr', email: 'devon.executive@shopsphere.com', name: 'Devon Patel (Overall Operations Director)', role: 'Overall Manager', deptId: null, deptName: 'Executive Leadership', mgrId: null, tlId: null, phone: '+91-98765-00001' },
    
    // 3. Department Managers
    { id: 'usr-mgr-deliv', email: 'manager.delivery@shopsphere.com', name: 'Vikram Singh (Delivery Manager)', role: 'Department Manager', deptId: 'dept-deliv', deptName: 'Delivery & Logistics', mgrId: 'usr-overall-mgr', tlId: null, phone: '+91-98765-10001' },
    { id: 'usr-mgr-prod', email: 'manager.product@shopsphere.com', name: 'Aisha Khan (Product Manager)', role: 'Department Manager', deptId: 'dept-prod', deptName: 'Product & Catalog', mgrId: 'usr-overall-mgr', tlId: null, phone: '+91-98765-10002' },
    { id: 'usr-mgr-supp', email: 'manager.support@shopsphere.com', name: 'Sarah Jenkins (Support Manager)', role: 'Department Manager', deptId: 'dept-supp', deptName: 'Customer Experience & Support', mgrId: 'usr-overall-mgr', tlId: null, phone: '+91-98765-10003' },
    { id: 'usr-mgr-wh', email: 'warehouse@shopsphere.com', name: 'Marcus Chen (Warehouse Supervisor)', role: 'Warehouse Manager', deptId: 'dept-wh', deptName: 'Warehousing & Inventory', mgrId: 'usr-overall-mgr', tlId: null, phone: '+91-98765-10004' },
    { id: 'usr-ops', email: 'ops@shopsphere.com', name: 'Devon Patel (Operations Lead)', role: 'Operations Manager', deptId: 'dept-deliv', deptName: 'Delivery & Logistics', mgrId: 'usr-overall-mgr', tlId: null, phone: '+91-98765-10005' },

    // 4. HR Officers
    { id: 'usr-hr-lead', email: 'hr.lead@shopsphere.com', name: 'Elena Rostova (Corporate HR Lead)', role: 'HR', deptId: 'dept-hr', deptName: 'Human Resources', mgrId: 'usr-overall-mgr', tlId: null, phone: '+91-98765-20001' },
    { id: 'usr-hr-ops', email: 'hr.delivery@shopsphere.com', name: 'Rahul Verma (Operations & Fleet HR)', role: 'HR', deptId: 'dept-hr', deptName: 'Human Resources', mgrId: 'usr-hr-lead', tlId: null, phone: '+91-98765-20002' },

    // 5. Team Leads (reporting to Department Managers)
    { id: 'usr-tl-express', email: 'tl.express@shopsphere.com', name: 'Kavita Nair (Express Fleet Team Lead)', role: 'Team Lead', deptId: 'dept-deliv', deptName: 'Delivery & Logistics', mgrId: 'usr-mgr-deliv', tlId: null, phone: '+91-98765-30001' },
    { id: 'usr-tl-catalog', email: 'tl.catalog@shopsphere.com', name: 'Arjun Mehta (Catalog Data Team Lead)', role: 'Team Lead', deptId: 'dept-prod', deptName: 'Product & Catalog', mgrId: 'usr-mgr-prod', tlId: null, phone: '+91-98765-30002' },
    { id: 'usr-tl-supp2', email: 'tl.tier2support@shopsphere.com', name: 'David Miller (Support Escalations Team Lead)', role: 'Team Lead', deptId: 'dept-supp', deptName: 'Customer Experience & Support', mgrId: 'usr-mgr-supp', tlId: null, phone: '+91-98765-30003' },

    // 6. Employees (reporting to specific Team Leads and Managers)
    { id: 'usr-emp-deliv1', email: 'emp.deliv1@shopsphere.com', name: 'Rohan Sharma (Senior Fleet Dispatcher)', role: 'Employee', deptId: 'dept-deliv', deptName: 'Delivery & Logistics', mgrId: 'usr-mgr-deliv', tlId: 'usr-tl-express', phone: '+91-98765-40001' },
    { id: 'usr-emp-deliv2', email: 'emp.deliv2@shopsphere.com', name: 'Sneha Rao (Last-Mile Routing Coordinator)', role: 'Employee', deptId: 'dept-deliv', deptName: 'Delivery & Logistics', mgrId: 'usr-mgr-deliv', tlId: 'usr-tl-express', phone: '+91-98765-40002' },
    { id: 'usr-emp-cat1', email: 'emp.cat1@shopsphere.com', name: 'Deepak Joshi (Catalog QA Specialist)', role: 'Employee', deptId: 'dept-prod', deptName: 'Product & Catalog', mgrId: 'usr-mgr-prod', tlId: 'usr-tl-catalog', phone: '+91-98765-40003' },
    { id: 'usr-emp-supp1', email: 'emp.supp1@shopsphere.com', name: 'Ananya Sen (Tier-1 Customer Specialist)', role: 'Employee', deptId: 'dept-supp', deptName: 'Customer Experience & Support', mgrId: 'usr-mgr-supp', tlId: 'usr-tl-supp2', phone: '+91-98765-40004' },
    { id: 'usr-support', email: 'support@shopsphere.com', name: 'Sarah Jenkins (Support Agent)', role: 'Support Agent', deptId: 'dept-supp', deptName: 'Customer Experience & Support', mgrId: 'usr-mgr-supp', tlId: 'usr-tl-supp2', phone: '+91-98765-40005' },
    { id: 'usr-analyst', email: 'analyst@shopsphere.com', name: 'Priya Sharma (Operations Analyst)', role: 'Analyst', deptId: null, deptName: null, mgrId: 'usr-overall-mgr', tlId: null, phone: '+91-98765-50001' },
    { id: 'usr-viewer', email: 'viewer@shopsphere.com', name: 'Jordan Lee (Auditor / Viewer)', role: 'Viewer', deptId: null, deptName: null, mgrId: null, tlId: null, phone: '+91-98765-50002' },

    // 7. Commercial Clients
    { id: 'usr-client-rel', email: 'client.reliance@enterprise.in', name: 'Rajesh Kumar (Reliance Retail Procurement)', role: 'Client', deptId: null, deptName: null, mgrId: null, tlId: null, phone: '+91-98111-22334', companyName: 'Reliance Retail Ltd', clientId: 'CLI-8801' },
    { id: 'usr-client-titan', email: 'client.titan@enterprise.in', name: 'Meera Nambiar (Titan Luxury Supply Partner)', role: 'Client', deptId: null, deptName: null, mgrId: null, tlId: null, phone: '+91-98222-33445', companyName: 'Titan Enterprise Co', clientId: 'CLI-8802' },
    { id: 'usr-client-zomato', email: 'client.zomato@hyperlocal.in', name: 'Sunil Grover (Hyperlocal Fulfillment Partner)', role: 'Client', deptId: null, deptName: null, mgrId: null, tlId: null, phone: '+91-98333-44556', companyName: 'Zomato Commerce Ltd', clientId: 'CLI-8803' }
  ];

  for (const u of users) {
    await query(`
      INSERT INTO users (id, email, password_hash, full_name, role, department_id, department_name, manager_id, team_lead_id, phone, company_name, client_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department_id = EXCLUDED.department_id,
        department_name = EXCLUDED.department_name,
        manager_id = EXCLUDED.manager_id,
        team_lead_id = EXCLUDED.team_lead_id,
        phone = EXCLUDED.phone,
        company_name = EXCLUDED.company_name,
        client_id = EXCLUDED.client_id;
    `, [
      u.id, u.email, passwordHash, u.name, u.role,
      u.deptId || null, u.deptName || null,
      u.mgrId || null, u.tlId || null,
      u.phone || null, u.companyName || null, u.clientId || null
    ]);
  }

  // Seed Company Profile
  await query(`
    INSERT INTO company_profile (id, company_name, tagline, description, email, phone, headquarters, gstin, support_hotline, total_warehouses, active_fleet, sla_guarantee)
    VALUES (
      'comp-01',
      'ShopSphere Operations Command Platform',
      'Enterprise Autonomous Multichannel Logistics & Fulfillment',
      'ShopSphere operates a tier-1 omnichannel fulfillment network powering over 50,000 daily orders across India with AI-powered root-cause diagnosis, automated carrier dispatch, and deterministic SLA tracking.',
      'contact@shopsphere.com',
      '+91-80-4900-8800',
      'ShopSphere Tower, Electronic City Phase 1, Bengaluru, Karnataka 560100',
      '29AABCS1429B1Z8',
      '1800-419-7000 (Toll Free)',
      20,
      450,
      '99.2% Same-Day / Next-Day Delivery Guarantee across Metro Hubs; 2-hour Grievance Response Commitment'
    )
    ON CONFLICT (id) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      tagline = EXCLUDED.tagline,
      description = EXCLUDED.description,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      headquarters = EXCLUDED.headquarters,
      gstin = EXCLUDED.gstin,
      support_hotline = EXCLUDED.support_hotline;
  `);

  // Seed Sample Real-World Complaints & Timelines
  const complaints = [
    {
      id: 'cmp-1001',
      ticket: 'TKT-2026-DEL-001',
      type: 'CLIENT_COMPLAINT',
      title: 'Coimbatore Hub: Bulk Consignment Delivery Delayed by 48 Hours',
      desc: 'Order ORD-2026-9041 containing 50 consumer electronics units has not reached the Coimbatore regional distribution center. Expected arrival was yesterday at 14:00.',
      deptId: 'dept-deliv',
      deptName: 'Delivery & Logistics',
      category: 'DELIVERY_DELAY',
      severity: 'CRITICAL',
      status: 'INVESTIGATING',
      subById: 'usr-client-rel',
      subByName: 'Rajesh Kumar (Reliance Retail)',
      subByEmail: 'client.reliance@enterprise.in',
      subByRole: 'Client',
      empId: null,
      tlId: 'usr-tl-express',
      mgrId: 'usr-mgr-deliv',
      clientId: 'CLI-8801',
      orderId: 'ORD-2026-9041',
      orderNum: 'ORD-2026-9041',
      prodId: 'PROD-ELEC-401',
      officerId: 'usr-tl-express',
      officerName: 'Kavita Nair (Express Fleet Team Lead)',
      officerEmail: 'tl.express@shopsphere.com',
      alertSent: true
    },
    {
      id: 'cmp-1002',
      ticket: 'TKT-2026-PROD-002',
      type: 'CLIENT_COMPLAINT',
      title: 'Packaging Tampered and Seal Broken on Premium Watch Batch',
      desc: 'Batch batch-W904 received at Titan showroom in Bengaluru with breached outer tamper tape. Requesting immediate return authorization and replacement units.',
      deptId: 'dept-prod',
      deptName: 'Product & Catalog',
      category: 'DAMAGED_PRODUCT',
      severity: 'HIGH',
      status: 'OPEN',
      subById: 'usr-client-titan',
      subByName: 'Meera Nambiar (Titan Luxury)',
      subByEmail: 'client.titan@enterprise.in',
      subByRole: 'Client',
      empId: null,
      tlId: 'usr-tl-catalog',
      mgrId: 'usr-mgr-prod',
      clientId: 'CLI-8802',
      orderId: 'ORD-2026-8812',
      orderNum: 'ORD-2026-8812',
      prodId: 'PROD-LUX-204',
      officerId: 'usr-tl-catalog',
      officerName: 'Arjun Mehta (Catalog Data Team Lead)',
      officerEmail: 'tl.catalog@shopsphere.com',
      alertSent: true
    },
    {
      id: 'cmp-1003',
      ticket: 'TKT-2026-EMP-003',
      type: 'EMPLOYEE_GRIEVANCE',
      title: 'Warehouse W03 Handheld Barcode Scanners Constantly Disconnecting',
      desc: 'During peak shift dispatch from 06:00 to 12:00, the Honeywell wireless scanners lose Wi-Fi connectivity on aisle 4B, causing severe scan queue delays of up to 40 minutes.',
      deptId: 'dept-deliv',
      deptName: 'Delivery & Logistics',
      category: 'WORKPLACE_EQUIPMENT',
      severity: 'HIGH',
      status: 'OFFICER_ALERTED',
      subById: 'usr-emp-deliv1',
      subByName: 'Rohan Sharma (Senior Fleet Dispatcher)',
      subByEmail: 'emp.deliv1@shopsphere.com',
      subByRole: 'Employee',
      empId: 'usr-emp-deliv1',
      tlId: 'usr-tl-express',
      mgrId: 'usr-mgr-deliv',
      clientId: null,
      orderId: null,
      orderNum: null,
      prodId: null,
      officerId: 'usr-tl-express',
      officerName: 'Kavita Nair (Express Fleet Team Lead)',
      officerEmail: 'tl.express@shopsphere.com',
      alertSent: true
    },
    {
      id: 'cmp-1004',
      ticket: 'TKT-2026-DEL-004',
      type: 'CLIENT_COMPLAINT',
      title: 'Wrong SKU delivered for Zomato Dark Store Order',
      desc: 'Received 100 units of SKU-BEV-99 instead of SKU-BEV-102. Urgent correction needed for ongoing Friday evening sales rush.',
      deptId: 'dept-deliv',
      deptName: 'Delivery & Logistics',
      category: 'WRONG_ITEM',
      severity: 'CRITICAL',
      status: 'RESOLVED',
      subById: 'usr-client-zomato',
      subByName: 'Sunil Grover (Hyperlocal Fulfillment)',
      subByEmail: 'client.zomato@hyperlocal.in',
      subByRole: 'Client',
      empId: null,
      tlId: 'usr-tl-express',
      mgrId: 'usr-mgr-deliv',
      clientId: 'CLI-8803',
      orderId: 'ORD-2026-7731',
      orderNum: 'ORD-2026-7731',
      prodId: 'SKU-BEV-102',
      officerId: 'usr-tl-express',
      officerName: 'Kavita Nair (Express Fleet Team Lead)',
      officerEmail: 'tl.express@shopsphere.com',
      alertSent: true
    }
  ];

  for (const c of complaints) {
    await query(`
      INSERT INTO complaints (
        id, ticket_number, type, title, description, department_id, department_name,
        category, severity, status, submitted_by_id, submitted_by_name, submitted_by_email,
        submitted_by_role, employee_id, team_lead_id, manager_id, client_id, order_id,
        order_number, product_id, assigned_officer_id, assigned_officer_name,
        assigned_officer_email, alert_sent, alert_time, resolution_notes, resolution_action, resolved_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, CURRENT_TIMESTAMP, $26, $27, $28)
      ON CONFLICT (ticket_number) DO NOTHING;
    `, [
      c.id, c.ticket, c.type, c.title, c.desc, c.deptId, c.deptName,
      c.category, c.severity, c.status, c.subById, c.subByName, c.subByEmail,
      c.subByRole, c.empId, c.tlId, c.mgrId, c.clientId, c.orderId,
      c.orderNum, c.prodId, c.officerId, c.officerName,
      c.officerEmail, c.alertSent,
      c.status === 'RESOLVED' ? 'Emergency courier rerouted with correct SKU from W02 Bengaluru within 90 minutes.' : null,
      c.status === 'RESOLVED' ? 'EXPRESS_REROUTE_DISPATCH' : null,
      c.status === 'RESOLVED' ? new Date().toISOString() : null
    ]);

    // Initial timeline
    await query(`
      INSERT INTO complaint_timeline (id, complaint_id, action, message, actor_name, actor_role)
      VALUES ($1, $2, 'SUBMITTED', $3, $4, $5)
      ON CONFLICT (id) DO NOTHING;
    `, [`tim-${c.id}-1`, c.id, `Ticket created and routed to ${c.deptName}`, c.subByName, c.subByRole]);

    await query(`
      INSERT INTO complaint_timeline (id, complaint_id, action, message, actor_name, actor_role)
      VALUES ($1, $2, 'OFFICER_ALERTED', $3, $4, $5)
      ON CONFLICT (id) DO NOTHING;
    `, [`tim-${c.id}-2`, c.id, `Immediate alert broadcasted to ${c.officerName}`, 'System Alert Engine', 'Automated Dispatch']);
  }

  console.log('✓ Database migrations, org hierarchy, departments, clients and complaints seeded successfully.');
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
