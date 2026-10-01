import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  GitMerge,
  ArrowRight,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  RefreshCw,
  Database,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  FileCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface FieldMapping {
  id: string;
  integration_id: string;
  source_field: string;
  target_field: string;
  data_type: string;
  transformation: string | null;
  validation_rule: string | null;
  is_active: boolean;
  created_at: string;
}

interface SyncLog {
  id: string;
  integration_id: string;
  records_processed: number;
  records_failed: number;
  duration_ms: number;
  status: string;
  error_details?: string;
  created_at: string;
}

export const DataMapping: React.FC = () => {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  // New mapping form state
  const [sourceField, setSourceField] = useState('');
  const [targetField, setTargetField] = useState('product_id');
  const [dataType, setDataType] = useState('string');
  const [transformation, setTransformation] = useState('trim_and_uppercase');
  const [validationRule, setValidationRule] = useState('not_empty');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync execution state
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mappingRes, logsRes] = await Promise.all([
        api.get('/integrations/mapping'),
        api.get('/integrations/sync/logs')
      ]);

      if (mappingRes.data.mappings) {
        setMappings(mappingRes.data.mappings);
      }
      setSyncLogs(logsRes.data || []);
    } catch (err) {
      console.warn('Failed to load data mappings/logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceField || !targetField) return;

    setSubmitting(true);
    setFormMsg(null);
    try {
      await api.post('/integrations/mapping', {
        integrationId: 'conn-erp-external-01',
        sourceField,
        targetField,
        dataType,
        transformation,
        validationRule
      });
      setFormMsg({ type: 'success', text: `Mapped "${sourceField}" → "${targetField}" successfully.` });
      setSourceField('');
      fetchData();
    } catch (err: any) {
      setFormMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save mapping.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunSync = async () => {
    setSyncing(true);
    setSyncSuccess(null);
    try {
      const res = await api.post('/integrations/sync', {
        integrationId: 'conn-erp-external-01'
      });
      setSyncSuccess(res.data);
      fetchData();
    } catch (err: any) {
      alert('Pipeline Sync failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const getSimulatedTransformResult = (trans: string | null) => {
    switch (trans) {
      case 'trim_and_uppercase':
        return '"  sku-p204 " → "SKU-P204"';
      case 'string_to_int':
        return '"150" → 150';
      case 'currency_usd_to_inr':
        return '$24.99 → ₹2,074.17';
      case 'date_normalize':
        return '"09/30/2026" → "2026-09-30T00:00:00Z"';
      case 'lowercase':
        return '"BLR-W03" → "blr-w03"';
      default:
        return 'Direct pass-through';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" /> Canonical Data Architecture
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Data Mapping & Synchronization Pipeline</h1>
          <p className="text-sm text-slate-400 mt-1">
            Define canonical transformation rules translating heterogeneous client schemas into ShopSphere models.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/integrations/onboard"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            Onboard New Client
          </Link>
          <button
            onClick={handleRunSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
          >
            {syncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Executing Pipeline...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Trigger Live Sync
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sync Execution Feedback Banner */}
      {syncSuccess && (
        <div className="bg-emerald-950/70 border border-emerald-700/80 rounded-xl p-4 text-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-white">Pipeline Synchronization Completed Successfully</div>
              <div className="text-xs text-emerald-300 font-mono mt-0.5">
                Processed: <span className="font-bold">{syncSuccess.records_processed}</span> records &nbsp;|&nbsp;
                Duration: <span className="font-bold">{syncSuccess.duration_ms} ms</span> &nbsp;|&nbsp;
                Failures: <span className="font-bold">{syncSuccess.records_failed}</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono bg-emerald-900/80 px-3 py-1 rounded border border-emerald-600 self-start md:self-auto">
            Log: {syncSuccess.logId || 'AUD-SYNC-RECENT'}
          </span>
        </div>
      )}

      {/* Canonical Flow Architecture Diagram Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Enterprise Data Ingestion Flow</div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs font-mono">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="text-slate-400 text-[10px] mb-1">STEP 1</div>
            <div className="text-white font-semibold">Client REST API</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="text-slate-400 text-[10px] mb-1">STEP 2</div>
            <div className="text-indigo-400 font-semibold">Connector</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="text-slate-400 text-[10px] mb-1">STEP 3</div>
            <div className="text-amber-400 font-semibold">Validation</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="text-slate-400 text-[10px] mb-1">STEP 4</div>
            <div className="text-cyan-400 font-semibold">Transformation</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="text-slate-400 text-[10px] mb-1">STEP 5</div>
            <div className="text-emerald-400 font-semibold">Canonical Store</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="text-slate-400 text-[10px] mb-1">STEP 6</div>
            <div className="text-purple-400 font-semibold">Redis Cache</div>
          </div>
        </div>
      </div>

      {/* Form: Add Field Mapping */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-indigo-400" />
          Add Canonical Field Translation Rule
        </h2>

        <form onSubmit={handleAddMapping} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">External Client Field</label>
              <input
                type="text"
                required
                value={sourceField}
                onChange={(e) => setSourceField(e.target.value)}
                placeholder="e.g. available_qty, item_sku"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Canonical Target Field</label>
              <select
                value={targetField}
                onChange={(e) => setTargetField(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="product_id">product_id (CanonicalProduct)</option>
                <option value="sku">sku (CanonicalProduct)</option>
                <option value="name">name (CanonicalProduct)</option>
                <option value="stock">stock (CanonicalInventory)</option>
                <option value="warehouse">warehouse (CanonicalInventory)</option>
                <option value="reserved">reserved (CanonicalInventory)</option>
                <option value="order_number">order_number (CanonicalOrder)</option>
                <option value="total_amount">total_amount (CanonicalOrder)</option>
                <option value="status">status (CanonicalOrder)</option>
                <option value="carrier_status">carrier_status (CanonicalDelivery)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Data Type</label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="string">string</option>
                <option value="integer">integer</option>
                <option value="float">float</option>
                <option value="boolean">boolean</option>
                <option value="date">date (ISO)</option>
                <option value="currency">currency</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Transformation Rule</label>
              <select
                value={transformation}
                onChange={(e) => setTransformation(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="trim_and_uppercase">Trim + Uppercase</option>
                <option value="string_to_int">String → Integer Cast</option>
                <option value="currency_usd_to_inr">Currency (USD → INR 83x)</option>
                <option value="date_normalize">Normalize to ISO-8601</option>
                <option value="lowercase">Lowercase</option>
                <option value="none">Direct Passthrough</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Validation Constraint</label>
              <select
                value={validationRule}
                onChange={(e) => setValidationRule(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="not_empty">Not Empty / Not Null</option>
                <option value="positive_integer">Positive Integer (&gt;= 0)</option>
                <option value="valid_iso_date">Valid ISO Date</option>
                <option value="regex_alphanumeric">Alphanumeric Code</option>
                <option value="none">Optional / None</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-400 font-mono">
              Live Preview: <span className="text-emerald-400">{getSimulatedTransformResult(transformation)}</span>
            </div>

            <button
              type="submit"
              disabled={submitting || !sourceField}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Save Field Rule
            </button>
          </div>
        </form>

        {formMsg && (
          <div
            className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 ${
              formMsg.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950/60 text-rose-300 border border-rose-800'
            }`}
          >
            {formMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            <span>{formMsg.text}</span>
          </div>
        )}
      </div>

      {/* Active Mappings Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              Active Field Translations ({mappings.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live canonical dictionary actively executed by <span className="font-mono text-indigo-300">canonicalTransformer.js</span>.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Client Field</th>
                <th className="py-3 px-4">Canonical Target</th>
                <th className="py-3 px-4">Data Type</th>
                <th className="py-3 px-4">Transformation</th>
                <th className="py-3 px-4">Validation Rule</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {mappings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No active mappings defined yet. Use the form above to configure schema translations.
                  </td>
                </tr>
              ) : (
                mappings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-medium text-amber-300">{m.source_field}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400 flex items-center gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      {m.target_field}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700">
                        {m.data_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">
                      {m.transformation || 'direct_passthrough'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {m.validation_rule || 'none'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync Execution History Logs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Pipeline Synchronization Audit Log
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical execution records of background ETL and manual client sync batches.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Integration</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Records Processed</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {syncLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                    No sync logs recorded yet. Trigger a sync above to execute the pipeline.
                  </td>
                </tr>
              ) : (
                syncLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-slate-300">{log.id}</td>
                    <td className="py-3 px-4 text-slate-400">{log.integration_id}</td>
                    <td className="py-3 px-4 text-slate-400 font-sans">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">{log.records_processed}</td>
                    <td className="py-3 px-4 text-slate-300">{log.duration_ms} ms</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
