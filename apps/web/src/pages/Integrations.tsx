import React, { useState, useEffect } from 'react';
import { Cable, Activity, RefreshCw, AlertTriangle, CheckCircle, Shield, ArrowRight, Play, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export const Integrations: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchIntegrationsStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/integrations/status');
      setServices(res.data);
    } catch (e) {
      console.error('Failed to load integration status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrationsStatus();
  }, []);

  const handleToggleFailure = async (serviceId: string, currentEnabled: boolean) => {
    try {
      await api.post('/integrations/simulator/toggle', {
        service: serviceId,
        mode: currentEnabled ? 'none' : 'degraded'
      });
      fetchIntegrationsStatus();
    } catch (e) {
      console.error('Failed to toggle simulator:', e);
    }
  };

  const handleTestConnection = async (svc: any) => {
    setTestingId(svc.id);
    try {
      const res = await api.post('/integrations/test', {
        baseUrl: svc.url,
        authType: 'bearer'
      });
      alert(`Connection Test for ${svc.name}:\n` +
        `✓ Authentication: ${res.data.authentication ? 'PASS' : 'FAIL'}\n` +
        `✓ Products Endpoint: ${res.data.productsEndpoint ? 'PASS' : 'FAIL'}\n` +
        `✓ Inventory Endpoint: ${res.data.inventoryEndpoint ? 'PASS' : 'FAIL'}\n` +
        `✓ Latency: ${res.data.durationMs}ms`);
    } catch (err: any) {
      alert('Connection test failed: ' + err.message);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Cable className="w-5 h-5 text-indigo-400" />
            <span>External Services & Integrations Monitor</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Live telemetry for external microservices, fallback cache status, and failure simulation controls.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/integrations/onboard')}
            className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
          >
            <span>Onboard Client System (FDE)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={fetchIntegrationsStatus}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {services.map((svc) => {
          const isHealthy = svc.status === 'healthy';
          const isDegraded = svc.status === 'degraded';
          const isSimEnabled = svc.simulator?.enabled;

          return (
            <div
              key={svc.id}
              className={`glass-panel p-5 rounded-2xl border transition space-y-4 ${
                !isHealthy ? 'border-amber-500/40 bg-amber-500/5' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-base">{svc.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Port {svc.port}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono mt-0.5 block">{svc.url}</span>
                </div>

                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase font-mono ${
                    isHealthy
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isDegraded
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {svc.status}
                </span>
              </div>

              {/* Telemetry Metrics */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Response Time</span>
                  <span className="font-mono font-bold text-white mt-0.5 block">{svc.responseTime}ms</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Error Rate</span>
                  <span className={`font-mono font-bold mt-0.5 block ${svc.errorRate > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {svc.errorRate}%
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Last Sync</span>
                  <span className="font-mono text-slate-300 text-[11px] mt-0.5 block truncate">
                    {new Date(svc.lastSuccessfulSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Degradation / Error Alert */}
              {svc.error && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                  <div className="font-semibold flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Resilience Fallback Engaged</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{svc.error}</p>
                </div>
              )}

              {/* Action Buttons & Simulator Toggle */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => handleTestConnection(svc)}
                  disabled={testingId === svc.id}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium transition"
                >
                  {testingId === svc.id ? 'Testing...' : 'Test Connection'}
                </button>

                {/* Failure Simulator Toggle Button (Requirement 9) */}
                <button
                  onClick={() => handleToggleFailure(svc.id, isSimEnabled)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    isSimEnabled
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <span>Failure Simulator: {isSimEnabled ? 'ACTIVE' : 'OFF'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
