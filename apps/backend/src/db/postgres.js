const { Pool } = require('pg');
const { PGlite } = require('@electric-sql/pglite');
const path = require('path');
const fs = require('fs');

let pool = null;
let pgliteInstance = null;
let isPgLite = false;

const dataDir = path.join(__dirname, '../../../../data/pgdata/pglite_db');

async function initPostgres() {
  const dbUrl = process.env.DATABASE_URL;

  // Try standard PostgreSQL first if URL provided
  if (dbUrl && !process.env.FORCE_PGLITE) {
    try {
      const testPool = new Pool({
        connectionString: dbUrl,
        connectionTimeoutMillis: 2000
      });
      await testPool.query('SELECT 1');
      console.log('✓ Connected to PostgreSQL server via Pool');
      pool = testPool;
      return;
    } catch (err) {
      console.log(`ℹ Native PostgreSQL server not reachable (${err.message}). Using persistent PGlite engine.`);
    }
  }

  // Fallback to embedded PGlite
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    const pidFile = path.join(dataDir, 'postmaster.pid');
    if (fs.existsSync(pidFile)) {
      try { fs.unlinkSync(pidFile); } catch (err) {}
    }
    const lockFiles = fs.readdirSync(dataDir).filter(f => f.includes('.lock'));
    for (const lf of lockFiles) {
      try { fs.unlinkSync(path.join(dataDir, lf)); } catch (err) {}
    }

    pgliteInstance = new PGlite(dataDir);
    await pgliteInstance.query('SELECT 1');
    isPgLite = true;
    console.log(`✓ Initialized persistent PGlite PostgreSQL engine at: ${dataDir}`);
  } catch (e) {
    console.warn(`ℹ Persistent PGlite experienced journal lock (${e.message}). Re-initializing fresh storage...`);
    try {
      fs.rmSync(dataDir, { recursive: true, force: true });
      fs.mkdirSync(dataDir, { recursive: true });
      pgliteInstance = new PGlite(dataDir);
      await pgliteInstance.query('SELECT 1');
      isPgLite = true;
      console.log(`✓ Re-initialized clean persistent PGlite PostgreSQL engine at: ${dataDir}`);
    } catch (err2) {
      console.error('Using in-memory PGlite:', err2.message);
      pgliteInstance = new PGlite();
      isPgLite = true;
    }
  }
}

async function query(text, params = []) {
  if (!pool && !pgliteInstance) {
    await initPostgres();
  }

  try {
    if (pool) {
      const res = await pool.query(text, params);
      return { rows: res.rows, rowCount: res.rowCount };
    } else {
      const res = await pgliteInstance.query(text, params);
      return { rows: res.rows || [], rowCount: (res.rows || []).length };
    }
  } catch (err) {
    console.error(`[DB Query Error] ${err.message}\nSQL: ${text}`);
    throw err;
  }
}

module.exports = {
  initPostgres,
  query,
  getIsPgLite: () => isPgLite
};
