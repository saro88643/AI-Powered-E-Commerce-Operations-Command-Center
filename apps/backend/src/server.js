const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const { initPostgres } = require('./db/postgres');
const { initMongo } = require('./db/mongo');
const { initRedis } = require('./db/redis');

// Import routes
const authRoutes = require('./routes/auth.routes');
const ordersRoutes = require('./routes/orders.routes');
const customersRoutes = require('./routes/customers.routes');
const productsRoutes = require('./routes/products.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const warehousesRoutes = require('./routes/warehouses.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const supportRoutes = require('./routes/support.routes');
const returnsRoutes = require('./routes/returns.routes');
const incidentsRoutes = require('./routes/incidents.routes');
const integrationsRoutes = require('./routes/integrations.routes');
const auditRoutes = require('./routes/audit.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const searchRoutes = require('./routes/search.routes');
const systemRoutes = require('./routes/system.routes');
const aiRoutes = require('./routes/ai.routes');
const departmentsRoutes = require('./routes/departments.routes');
const complaintsRoutes = require('./routes/complaints.routes');
const companyRoutes = require('./routes/company.routes');
const notificationsRoutes = require('./routes/notifications.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'healthy',
    service: 'shopsphere-api-gateway',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount domain routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/warehouses', warehousesRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/notifications', notificationsRoutes);

// OpenAPI / Swagger Documentation specification (Requirement 45)
app.get('/api/docs', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'ShopSphere Operations Command Center API',
      version: '1.0.0',
      description: 'Comprehensive REST API documentation for the ShopSphere multi-channel e-commerce operations platform.'
    },
    paths: {
      '/api/auth/login': {
        post: {
          summary: 'User login for JWT token and role permissions',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } } } } },
          responses: { 200: { description: 'Authenticated user and token' } }
        }
      },
      '/api/orders': {
        get: {
          summary: 'List orders with filtering and pagination',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'city', in: 'query', schema: { type: 'string' } },
            { name: 'warehouseId', in: 'query', schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'Paginated orders list' } }
        }
      },
      '/api/dashboard/stats': {
        get: {
          summary: 'Calculated real-time operational KPIs',
          responses: { 200: { description: 'Live metrics calculated from databases' } }
        }
      },
      '/api/ai/investigate': {
        post: {
          summary: 'Run AI Operational Investigation across databases and RAG',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { question: { type: 'string' } } } } } },
          responses: { 200: { description: 'RCA, findings, evidence cards, citations, recommended actions' } }
        }
      },
      '/api/ai/action/confirm': {
        post: {
          summary: 'Confirm and execute authorized write action with verification and audit log',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { actionType: { type: 'string' }, parameters: { type: 'object' } } } } } },
          responses: { 200: { description: 'Action resolution verification and audit log ID' } }
        }
      }
    }
  });
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    service: 'shopsphere-api-gateway',
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  try {
    await initPostgres();

    // Auto-migrate if tables not present
    const { query } = require('./db/postgres');
    try {
      const check = await query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'orders'");
      if (!check.rows[0] || parseInt(check.rows[0].count, 10) === 0) {
        console.log('⚡ Initializing database schema and default dataset...');
        const { runMigrations } = require('./db/migrate');
        await runMigrations();
        const { seed } = require('../../../scripts/seed_all');
        await seed();
      }
    } catch (e) {
      console.log('⚡ Running initial migration...');
      const { runMigrations } = require('./db/migrate');
      await runMigrations();
      const { seed } = require('../../../scripts/seed_all');
      await seed();
    }

    await initMongo();
    await initRedis();

    app.listen(PORT, () => {
      console.log(`\n=================================================`);
      console.log(`🚀 ShopSphere API Gateway running at http://localhost:${PORT}`);
      console.log(`📚 OpenAPI Documentation available at http://localhost:${PORT}/api/docs`);
      console.log(`=================================================\n`);
    });
  } catch (err) {
    console.error('Fatal error starting ShopSphere Backend:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
