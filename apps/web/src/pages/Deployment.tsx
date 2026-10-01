import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Server,
  ShieldCheck,
  Cpu,
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowRight,
  Database,
  FileCheck,
  DownloadCloud
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface IntegrationStatus {
  id: string;
  name: string;
  status: string;
  responseTime: number;
  lastSuccessfulSync: string;
  errorRate: number;
}

export const Deployment: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIntegrations = async () => {
    try {
      const res = await api.get('/integrations/status');
      setIntegrations(res.data);
    } catch (e) {
      console.warn('Failed to load integration health for deployment view', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchIntegrations();
  };

  // FDE Milestones Checklist
  const deploymentSteps = [
    {
      id: 1,
      title: 'API Credentials & Mutual TLS Handshake',
      desc: 'Configured encrypted Bearer tokens and HMAC headers for external client VPC.',
      status: 'completed',
      timestamp: '2026-09-30 08:30:14 UTC',
      verifiedBy: 'FDE Automation Agent'
    },
    {
      id: 2,
      title: 'Network Connectivity & Health Check Probe',
      desc: 'Executed HTTP OPTIONS and /health ping across all four external microservice endpoints.',
      status: 'completed',
      timestamp: '2026-09-30 08:32:05 UTC',
      verifiedBy: 'Diagnostic Engine'
    },
    {
      id: 3,
      title: 'Product Catalog Endpoint Discovery',
      desc: 'Mapped /products endpoint with 2,050 active SKUs, price, category and supplier foreign keys.',
      status: 'completed',
      timestamp: '2026-09-30 08:35:40 UTC',
      verifiedBy: 'Canonical Schema Validator'
    },
    {
      id: 4,
      title: 'Inventory Stream & Warehouse Discrepancy Detection',
      desc: 'Discovered stock levels across 20 warehouses; flagged Warehouse W03 sync discrepancy.',
      status: 'completed',
      timestamp: '2026-09-30 08:41:12 UTC',
      verifiedBy: 'Sync & Quality Engine'
    },
    {
      id: 5,
      title: 'Order Fulfillment & Carrier Route Synchronization',
      desc: 'Linked SpeedFast, BlueDart, and Delhivery partner tracking APIs to order status stream.',
      status: 'completed',
      timestamp: '2026-09-30 08:45:22 UTC',
      verifiedBy: 'Carrier Delivery Connector'
    },
    {
      id: 6,
      title: 'Canonical Field Translation Matrix',
      desc: 'Generated and persisted schema transformation dictionary for client-specific attribute tags.',
      status: 'completed',
      timestamp: '2026-09-30 08:50:09 UTC',
      verifiedBy: 'PostgreSQL Migration Runner'
    },
    {
      id: 7,
      title: 'Dry-Run Ingestion & Transformation Validation',
      desc: 'Validated 15,000 orders and 10,000 customer records against zero schema corruption constraints.',
      status: 'completed',
      timestamp: '2026-09-30 08:55:18 UTC',
      verifiedBy: 'FDE Pipeline Verifier'
    },
    {
      id: 8,
      title: 'Production Cutover & Active AI Agent Operationalization',
      desc: 'LangGraph multi-source root-cause investigation agent connected to live production tables.',
      status: 'completed',
      timestamp: '2026-09-30 09:00:00 UTC',
      verifiedBy: 'ShopSphere Command Core'
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" /> Production Operations Matrix
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">FDE Client Deployment & Readiness Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise customer integration status, deployment milestones, connector architecture, and production readiness audit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            Re-run Diagnostic Probes
          </button>
          <Link
            to="/ai"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition"
          >
            Launch AI Operations
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Deployment Environment Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-900/40 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider">DEPLOYMENT TARGET</div>
            <div className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
              <span>RetailCorp Global Omnichannel Enterprise</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                ACTIVE PRODUCTION
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div>Tenant: <span className="text-slate-200">tenant-fde-corp-01</span></div>
            <div>Cluster: <span className="text-slate-200">us-east-k8s-prod</span></div>
            <div>Latency: <span className="text-emerald-400">22 ms avg</span></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px] mb-1">Connector Architecture</div>
            <div className="text-white font-semibold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              GenericRESTConnector
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Pluggable enterprise adapter</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px] mb-1">Canonical Store</div>
            <div className="text-white font-semibold flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              PostgreSQL Relational Core
            </div>
            <div className="text-[10px] text-slate-500 mt-1">16 tables + foreign keys</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px] mb-1">Unstructured Support</div>
            <div className="text-white font-semibold flex items-center gap-1.5">
              <Server className="w-4 h-4 text-amber-400" />
              MongoDB Customer 360
            </div>
            <div className="text-[10px] text-slate-500 mt-1">10k profiles & tickets</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px] mb-1">Investigation Intelligence</div>
            <div className="text-white font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              LangGraph + RAG Store
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Grounded operational reasoning</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Checklist & Integration Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Checklist */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              FDE Onboarding & Deployment Checklist (8/8 Verified)
            </h2>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800">
              100% Complete
            </span>
          </div>

          <div className="space-y-3">
            {deploymentSteps.map((step) => (
              <div
                key={step.id}
                className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-start gap-3 hover:border-slate-700 transition"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">{step.title}</span>
                    <span className="text-[10px] font-mono text-slate-500">{step.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Audited by: <span className="text-slate-400">{step.verifiedBy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Integrations Health Status */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              Connected Microservice Gateways
            </h2>

            <div className="space-y-3">
              {integrations.map((svc) => (
                <div
                  key={svc.id}
                  className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-white">{svc.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Latency: <span className="text-emerald-400">{svc.responseTime} ms</span> &nbsp;|&nbsp;
                      Errors: <span className="text-slate-300">{svc.errorRate}%</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      svc.status === 'healthy'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : svc.status === 'degraded'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {svc.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800">
              <Link
                to="/integrations"
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition"
              >
                Open Failure Simulator & Gateway Controls &rarr;
              </Link>
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">FDE Toolkit Navigation</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/integrations/onboard"
                className="p-2.5 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white transition flex items-center gap-2"
              >
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                Client Onboarding
              </Link>
              <Link
                to="/integrations/mapping"
                className="p-2.5 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white transition flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Data Mapping
              </Link>
              <Link
                to="/system/data-quality"
                className="p-2.5 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Data Quality Audit
              </Link>
              <Link
                to="/audit"
                className="p-2.5 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white transition flex items-center gap-2"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Audit Logs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
