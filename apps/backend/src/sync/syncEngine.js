const { query } = require('../db/postgres');
const redis = require('../db/redis');
const { ShopSphereInventoryConnector } = require('../connectors/InventoryConnector');
const CanonicalTransformer = require('../canonical/canonicalTransformer');

class SyncEngine {
  constructor() {
    this.inventoryConnector = new ShopSphereInventoryConnector();
  }

  async runSync(integrationId = 'conn-erp-external-01') {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsFailed = 0;
    let status = 'SUCCESS';
    let message = 'Synchronization completed successfully';

    try {
      // 1. Fetch active field mappings for this integration
      const mapRes = await query('SELECT * FROM field_mappings WHERE integration_id = $1 AND is_active = true', [integrationId]);
      const mappings = mapRes.rows;

      // 2. Pull external inventory records via connector
      const extData = await this.inventoryConnector.getInventory({ limit: 100 });
      const rawRecords = extData.data || [];

      // 3. Transform each record into Canonical model & Upsert to database
      for (const raw of rawRecords) {
        try {
          const canonical = CanonicalTransformer.toCanonicalInventory(raw, mappings);
          
          await query(`
            UPDATE inventory 
            SET available_quantity = $1, last_sync_at = CURRENT_TIMESTAMP
            WHERE product_id = $2 AND warehouse_id = $3
          `, [canonical.available_quantity, canonical.product_id, canonical.warehouse_id]);

          recordsProcessed++;
        } catch (itemErr) {
          recordsFailed++;
        }
      }

      // 4. Invalidate and update Redis cache
      await redis.set('cache:inventory:last_sync', {
        timestamp: new Date().toISOString(),
        recordsProcessed,
        recordsFailed
      }, 3600);

    } catch (err) {
      status = 'FAILED';
      message = err.message;
    }

    const durationMs = Date.now() - startTime;

    // 5. Record sync log
    const logId = `sync-${Date.now().toString().slice(-6)}`;
    await query(`
      INSERT INTO sync_logs (id, connector_name, status, records_processed, records_failed, duration_ms, message, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    `, [logId, integrationId, status, recordsProcessed, recordsFailed, durationMs, message]);

    return {
      logId,
      status,
      recordsProcessed,
      recordsFailed,
      durationMs,
      message,
      timestamp: new Date().toISOString()
    };
  }

  async getRecentLogs(limit = 20) {
    const res = await query('SELECT * FROM sync_logs ORDER BY timestamp DESC LIMIT $1', [limit]);
    return res.rows;
  }
}

module.exports = new SyncEngine();
