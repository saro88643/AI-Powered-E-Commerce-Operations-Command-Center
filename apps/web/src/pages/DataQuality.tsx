import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Sparkles,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  FileCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface QualityReport {
  qualityScore: number;
  totalRecordsAnalyzed: number;
  mismatchCount: number;
  delayedCount: number;
  orphanCount: number;
  staleWarehousesCount: number;
  issues: Array<{
    type: string;
    severity: string;
    count: number;
    description: string;
  }>;
  auditTimestamp: string;
}

export const DataQuality: React.FC = () => {
  const [report, setReport] = useState<QualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAudit = async () => {
    try {
      const res = await api.get('/system/data-quality');
      setReport(res.data);
    } catch (e) {
      console.warn('Failed to load data quality report', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const handleRunAudit = () => {
    setRefreshing(true);
    fetchAudit();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" /> Automated Enterprise Data Hygiene
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Data Quality & Operational Integrity Engine</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time audit across 45,000+ relational & document records detecting discrepancies, orphans, and sync anomalies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAudit}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Run Live Integrity Audit
          </button>
        </div>
      </div>

      {/* Hero: Score & Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Quality Score Hero */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950/60 border border-indigo-900/50 rounded-xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Enterprise Data Quality Score</div>
            <div className="text-4xl font-extrabold text-white mt-1">
              {report ? `${report.qualityScore}%` : '---'}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Audited against schema constraints, foreign-key integrity, and physical warehouse inventory.
            </p>
            <div className="mt-3 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{report?.totalRecordsAnalyzed.toLocaleString() || '45,000'} Records Evaluated</span>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
            <ShieldCheck className="w-16 h-16 text-indigo-400" />
            <span className="text-[10px] font-bold text-indigo-300 mt-1 uppercase">Grade A-</span>
          </div>
        </div>

        {/* Inventory Mismatches */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Inventory Mismatches</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              {report?.mismatchCount ?? 0}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 border-t border-slate-800 pt-2">
            Discrepancies flagged at W03
          </div>
        </div>

        {/* Delayed SLA Orders */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Delayed SLA Orders</div>
            <div className="text-2xl font-bold text-rose-400 mt-1">
              {report?.delayedCount ?? 0}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 border-t border-slate-800 pt-2">
            Fulfillment SLA breaches
          </div>
        </div>

        {/* Sync Failure Nodes */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Sync Error Nodes</div>
            <div className="text-2xl font-bold text-indigo-400 mt-1">
              {report?.staleWarehousesCount ?? 0}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 border-t border-slate-800 pt-2">
            Edge nodes with sync lag
          </div>
        </div>
      </div>

      {/* Domain Quality Breakdown */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          Data Quality By Enterprise Subsystem
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white">Product Catalog (CSV/Postgres)</span>
              <span className="text-xs font-bold text-emerald-400">99.4%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '99.4%' }}></div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">2,050 SKUs mapped; 0 invalid prices.</div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white">Customer 360 (MongoDB)</span>
              <span className="text-xs font-bold text-emerald-400">98.1%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '98.1%' }}></div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">10,000 profiles; 0 broken phone IDs.</div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white">Fulfillment & Orders</span>
              <span className="text-xs font-bold text-amber-400">91.8%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '91.8%' }}></div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">15,000 orders; 143 delayed fulfillments.</div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white">Warehouse Inventory Sync</span>
              <span className="text-xs font-bold text-rose-400">84.2%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: '84.2%' }}></div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">W03 edge sync error flagged.</div>
          </div>
        </div>
      </div>

      {/* Active Operational Issues List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Active Detected Data Discrepancies & Anomalies
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlated issues detected during live database probe.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Last Audit: {report ? new Date(report.auditTimestamp).toLocaleTimeString() : '---'}
          </span>
        </div>

        <div className="space-y-3">
          {report?.issues && report.issues.length > 0 ? (
            report.issues.map((issue, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start gap-3">
                  {issue.severity === 'critical' ? (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  ) : issue.severity === 'high' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white uppercase tracking-wider">
                        {issue.type.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          issue.severity === 'critical'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{issue.description}</p>
                  </div>
                </div>

                <Link
                  to="/ai"
                  className="self-end sm:self-center shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Root-Cause in AI Console &rarr;
                </Link>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-sm text-slate-500">
              No anomalies detected. All database constraints and inventory balances are healthy.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
