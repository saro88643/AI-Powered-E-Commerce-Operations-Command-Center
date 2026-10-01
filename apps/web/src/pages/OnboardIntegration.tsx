import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  PlugZap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Key,
  Globe,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TestResult {
  authentication: boolean;
  endpoints: {
    products: boolean;
    inventory: boolean;
    orders: boolean;
  };
  responseFormatValid: boolean;
  latencyMs: number;
  sampleData?: any;
  error?: string;
}

interface Connection {
  id: string;
  system_name: string;
  base_url: string;
  auth_type: string;
  environment: string;
  status: string;
  endpoints_status: any;
  last_test_at: string;
}

export const OnboardIntegration: React.FC = () => {
  const [systemName, setSystemName] = useState('RetailCorp Global ERP');
  const [baseUrl, setBaseUrl] = useState('http://localhost:4001');
  const [authType, setAuthType] = useState('bearer');
  const [apiKey, setApiKey] = useState('demo-token-fde-secure-9921');
  const [environment, setEnvironment] = useState('production');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [existingConnections, setExistingConnections] = useState<Connection[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const fetchConnections = async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/integrations/mapping');
      if (res.data.connections) {
        setExistingConnections(res.data.connections);
      }
    } catch (e) {
      console.warn('Could not load connections', e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setSaveError(null);
    try {
      const res = await api.post('/integrations/test', {
        baseUrl,
        authType,
        apiKey
      });
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({
        authentication: false,
        endpoints: { products: false, inventory: false, orders: false },
        responseFormatValid: false,
        latencyMs: 0,
        error: err.response?.data?.error || err.message || 'Connection test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testResult?.authentication) {
      alert('Please run a successful connection test before saving.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const res = await api.post('/integrations/onboard', {
        systemName,
        baseUrl,
        authType,
        apiKey,
        environment
      });
      setSaveSuccess(`System "${systemName}" successfully connected with ID: ${res.data.connectionId}`);
      fetchConnections();
    } catch (err: any) {
      setSaveError(err.response?.data?.error || 'Failed to onboard system.');
    } finally {
      setSaving(false);
    }
  };

  const loadPreset = (name: string, url: string, type: string) => {
    setSystemName(name);
    setBaseUrl(url);
    setAuthType(type);
    setTestResult(null);
    setSaveSuccess(null);
    setSaveError(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" /> Forward Deployed Engineer (FDE) Workflow
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Client System Onboarding & Connection Test</h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect external enterprise APIs, validate authentication and schemas, and map into the ShopSphere Canonical Model.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/integrations/mapping"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            Field Mapping Studio
          </Link>
          <Link
            to="/deployment"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg shadow-indigo-600/20 transition"
          >
            Deployment Checklist
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Preset Quick Selectors */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="text-xs font-medium text-slate-400 mb-2">QUICK TEST PRESETS (SIMULATED EXTERNAL SERVICES):</div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadPreset('External Inventory Partner API', 'http://localhost:4001', 'bearer')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-indigo-300 border border-slate-700 transition flex items-center gap-1.5"
          >
            <Server className="w-3.5 h-3.5 text-indigo-400" /> Inventory Gateway (:4001)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('Logistics Carrier Partner API', 'http://localhost:4002', 'bearer')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-blue-300 border border-slate-700 transition flex items-center gap-1.5"
          >
            <Server className="w-3.5 h-3.5 text-blue-400" /> Delivery Carrier (:4002)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('Payment Clearing Switch API', 'http://localhost:4003', 'bearer')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-300 border border-slate-700 transition flex items-center gap-1.5"
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" /> Payment Switch (:4003)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('Omnichannel CRM System API', 'http://localhost:4004', 'bearer')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-amber-300 border border-slate-700 transition flex items-center gap-1.5"
          >
            <Server className="w-3.5 h-3.5 text-amber-400" /> CRM Service (:4004)
          </button>
        </div>
      </div>

      {/* Main Grid: Form + Live Test Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Connection Form */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <PlugZap className="w-5 h-5 text-indigo-400" />
            Client API Configuration
          </h2>

          <form onSubmit={handleOnboardSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Client System Name</label>
              <input
                type="text"
                required
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                placeholder="e.g. Acme Warehouse ERP"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">API Base URL</label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="url"
                  required
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.client.internal:8000"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Auth Type</label>
                <select
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="bearer">Bearer Token (JWT)</option>
                  <option value="apiKey">API Key Header</option>
                  <option value="basic">Basic Auth</option>
                  <option value="none">None (Internal VPC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Environment</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="sandbox">Sandbox / Demo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">API Key / Credentials</label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Bearer token or secret key"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold border border-slate-600 transition disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    Executing HTTP Tests...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 text-indigo-400" />
                    Test Connection
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={saving || !testResult?.authentication}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Save Connection
                  </>
                )}
              </button>
            </div>
          </form>

          {saveSuccess && (
            <div className="mt-4 p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>{saveSuccess}</div>
            </div>
          )}

          {saveError && (
            <div className="mt-4 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-lg text-xs text-rose-300 flex items-start gap-2">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{saveError}</div>
            </div>
          )}
        </div>

        {/* Live HTTP Test Results Window */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Live HTTP Diagnostic Probe
              </h2>
              {testResult && (
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                  {testResult.latencyMs} ms
                </span>
              )}
            </div>

            {!testResult && !testing && (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                <Server className="w-12 h-12 text-slate-700 mb-3" />
                <div className="text-sm font-medium text-slate-300">No Connection Test Run Yet</div>
                <div className="text-xs text-slate-500 max-w-sm mt-1">
                  Click <span className="text-indigo-400">"Test Connection"</span> to dispatch actual HTTP probe requests to the external client base URL.
                </div>
              </div>
            )}

            {testing && (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-slate-800 rounded-xl bg-slate-950/40 space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <div className="text-sm text-slate-300 font-medium">Probing endpoints on {baseUrl}...</div>
                <div className="text-xs text-slate-500 font-mono">
                  [1/4] Auth Handshake &nbsp;→&nbsp; [2/4] Products Schema &nbsp;→&nbsp; [3/4] Inventory Stream &nbsp;→&nbsp; [4/4] Orders Buffer
                </div>
              </div>
            )}

            {testResult && (
              <div className="space-y-3">
                {/* Auth Check */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {testResult.authentication ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    )}
                    <div>
                      <div className="text-xs font-medium text-white">Authentication Protocol</div>
                      <div className="text-[11px] text-slate-400">Handshake & token authorization verification</div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      testResult.authentication
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {testResult.authentication ? 'PASSED' : 'FAILED'}
                  </span>
                </div>

                {/* Products Endpoint Check */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {testResult.endpoints.products ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    )}
                    <div>
                      <div className="text-xs font-medium text-white">Products Catalog Endpoint</div>
                      <div className="text-[11px] text-slate-400 font-mono">GET /products or /catalog</div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      testResult.endpoints.products
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {testResult.endpoints.products ? 'PASSED' : 'UNAVAILABLE'}
                  </span>
                </div>

                {/* Inventory Endpoint Check */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {testResult.endpoints.inventory ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    )}
                    <div>
                      <div className="text-xs font-medium text-white">Inventory Balance Endpoint</div>
                      <div className="text-[11px] text-slate-400 font-mono">GET /inventory/:productId</div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      testResult.endpoints.inventory
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {testResult.endpoints.inventory ? 'PASSED' : 'UNAVAILABLE'}
                  </span>
                </div>

                {/* Orders Endpoint Check */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {testResult.endpoints.orders ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    )}
                    <div>
                      <div className="text-xs font-medium text-white">Orders Fulfillment Endpoint</div>
                      <div className="text-[11px] text-slate-400 font-mono">GET /orders or /fulfillment</div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      testResult.endpoints.orders
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {testResult.endpoints.orders ? 'PASSED' : 'OPTIONAL'}
                  </span>
                </div>

                {/* Response Format Check */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {testResult.responseFormatValid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    )}
                    <div>
                      <div className="text-xs font-medium text-white">Payload Structure & JSON Schema</div>
                      <div className="text-[11px] text-slate-400">Compatible with canonical translation pipeline</div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      testResult.responseFormatValid
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {testResult.responseFormatValid ? 'VALID' : 'INVALID'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {testResult?.sampleData && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>SAMPLE PAYLOAD PREVIEW</span>
                <span className="text-[10px] text-slate-500 font-mono">application/json</span>
              </div>
              <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-36">
                {JSON.stringify(testResult.sampleData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Active Onboarded Client Systems */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-400" />
              Active Onboarded Client Systems
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enterprise integrations connected to ShopSphere through Generic REST & Custom Connectors.
            </p>
          </div>
          <button
            onClick={fetchConnections}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {existingConnections.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">
            No external client connections saved yet. Complete the form above to onboard your first integration.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingConnections.map((conn) => (
              <div
                key={conn.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-sm font-semibold text-white truncate">{conn.system_name}</div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        conn.status === 'connected'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {conn.status}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-400 truncate mb-1">{conn.base_url}</div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                    <span>Env: <span className="text-slate-300">{conn.environment}</span></span>
                    <span>Auth: <span className="text-slate-300">{conn.auth_type}</span></span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Tested: {new Date(conn.last_test_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Link
                    to="/integrations/mapping"
                    className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    Configure Mapping &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
