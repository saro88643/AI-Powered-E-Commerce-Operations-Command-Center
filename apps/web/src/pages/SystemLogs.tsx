import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  Terminal,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Info,
  XCircle,
  Play,
  Pause,
  Server,
  Activity,
  Layers
} from 'lucide-react';

interface SystemLog {
  id: string;
  level: string;
  service: string;
  message: string;
  timestamp: string;
}

export const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await api.get('/system/logs');
      setLogs(res.data);
    } catch (e) {
      console.warn('Failed to load system logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredLogs = logs.filter((log) => {
    if (levelFilter && log.level !== levelFilter) return false;
    if (serviceFilter && log.service !== serviceFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.service.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const errorCount = logs.filter((l) => l.level === 'ERROR').length;
  const warnCount = logs.filter((l) => l.level === 'WARN').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Terminal className="w-4 h-4" /> Observability & Telemetry
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System & Application Logs</h1>
          <p className="text-sm text-slate-400 mt-1">
            Centralized operational event stream tracking API latency, AI tool calls, database mutations, and external gateway errors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              autoRefresh
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {autoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {autoRefresh ? 'Live Stream (5s)' : 'Stream Paused'}
          </button>

          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Observability Telemetry Stat Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Total Stream Events</div>
            <div className="text-xl font-bold text-white mt-0.5">{logs.length}</div>
          </div>
          <Activity className="w-6 h-6 text-indigo-400" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Active Errors</div>
            <div className="text-xl font-bold text-rose-400 mt-0.5">{errorCount}</div>
          </div>
          <XCircle className="w-6 h-6 text-rose-400" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Warnings / Alerts</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{warnCount}</div>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Telemetry Engine</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">HEALTHY</div>
          </div>
          <Server className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search event messages, service IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>

          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Services</option>
            <option value="API-GATEWAY">API-GATEWAY</option>
            <option value="INVENTORY-SYNC">INVENTORY-SYNC</option>
            <option value="DELIVERY-CONNECTOR">DELIVERY-CONNECTOR</option>
            <option value="DATA-QUALITY">DATA-QUALITY</option>
            <option value="AUDIT">AUDIT</option>
            <option value="AI-SERVICE">AI-SERVICE</option>
          </select>

          {(searchQuery || levelFilter || serviceFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setLevelFilter('');
                setServiceFilter('');
              }}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
            <span className="ml-2 text-slate-300 font-semibold">/var/log/shopsphere/operations.log</span>
          </div>
          <span>Showing {filteredLogs.length} events</span>
        </div>

        <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto divide-y divide-slate-900">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-sans">
              No log events match your filter criteria.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="pt-2 flex items-start gap-3 hover:bg-slate-900/40 p-1 rounded transition">
                <span className="text-slate-500 text-[11px] whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>

                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    log.level === 'ERROR'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : log.level === 'WARN'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                  }`}
                >
                  {log.level}
                </span>

                <span className="text-slate-400 text-[11px] font-semibold shrink-0">
                  [{log.service}]
                </span>

                <span
                  className={`flex-1 break-words ${
                    log.level === 'ERROR'
                      ? 'text-rose-300'
                      : log.level === 'WARN'
                      ? 'text-amber-200'
                      : 'text-slate-300'
                  }`}
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
