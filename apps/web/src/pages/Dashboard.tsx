import React, { useEffect, useState } from 'react';
import {
  TrendingUp, ShoppingCart, Users, AlertTriangle,
  RotateCcw, Layers, Truck, Headphones, RefreshCw,
  ArrowUpRight, ArrowDownRight, ArrowRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, chartsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts')
      ]);
      setStats(statsRes.data);
      setCharts(chartsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Operations Command Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-channel orchestration, inventory reconciliation, and AI remediation.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/ai')}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-500/25 transition"
          >
            <span>Launch AI Investigation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={fetchDashboardData}
            title="Refresh Live Metrics"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary KPI Cards (Live from Databases) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div onClick={() => navigate('/orders')} className="glass-panel p-4 rounded-2xl cursor-pointer hover:border-slate-700 transition group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Orders</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats?.totalOrders ? stats.totalOrders.toLocaleString() : '...'}
            </span>
            <div className="flex items-center text-[11px] text-emerald-400 font-medium mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>+12.4% vs last week</span>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="glass-panel p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Net Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{stats?.totalRevenue ? (stats.totalRevenue / 10000000).toFixed(2) + ' Cr' : '...'}
            </span>
            <div className="flex items-center text-[11px] text-emerald-400 font-medium mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>Healthy gross margins</span>
            </div>
          </div>
        </div>

        {/* Delayed Deliveries Alert */}
        <div onClick={() => navigate('/delivery')} className="glass-panel p-4 rounded-2xl cursor-pointer hover:border-rose-500/40 transition group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Delayed Deliveries</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-rose-400 tracking-tight">
              {stats?.delayedOrders !== undefined ? stats.delayedOrders : '...'}
            </span>
            <div className="flex items-center text-[11px] text-rose-400 font-medium mt-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              <span>31 in Coimbatore W03 Hub</span>
            </div>
          </div>
        </div>

        {/* Inventory Health */}
        <div onClick={() => navigate('/inventory')} className="glass-panel p-4 rounded-2xl cursor-pointer hover:border-slate-700 transition group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Inventory Health</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats?.inventoryHealthPct !== undefined ? `${stats.inventoryHealthPct}%` : '...'}
            </span>
            <div className="flex items-center text-[11px] text-amber-400 font-medium mt-1">
              <span>{stats?.mismatchCount || 1} Mismatch (P-204 at W03)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div onClick={() => navigate('/customers')} className="glass-panel-subtle p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-800/40">
          <div>
            <div className="text-[11px] text-slate-400">Total Customers</div>
            <div className="text-lg font-bold text-white mt-0.5">{stats?.totalCustomers?.toLocaleString() || '...'}</div>
          </div>
          <Users className="w-5 h-5 text-purple-400" />
        </div>

        <div onClick={() => navigate('/support')} className="glass-panel-subtle p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-800/40">
          <div>
            <div className="text-[11px] text-slate-400">Open Tickets</div>
            <div className="text-lg font-bold text-white mt-0.5">{stats?.openTickets?.toLocaleString() || '...'}</div>
          </div>
          <Headphones className="w-5 h-5 text-indigo-400" />
        </div>

        <div onClick={() => navigate('/returns')} className="glass-panel-subtle p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-800/40">
          <div>
            <div className="text-[11px] text-slate-400">Returns Processed</div>
            <div className="text-lg font-bold text-white mt-0.5">{stats?.totalReturns || '...'}</div>
          </div>
          <RotateCcw className="w-5 h-5 text-cyan-400" />
        </div>

        <div onClick={() => navigate('/incidents')} className="glass-panel-subtle p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-800/40">
          <div>
            <div className="text-[11px] text-slate-400">Active Incidents</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5">{stats?.activeIncidents || 0} Open</div>
          </div>
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
      </div>

      {/* Operational Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Orders Trend Chart */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Daily Order Volume & Revenue</h3>
              <p className="text-[11px] text-slate-400">Aggregated live from PostgreSQL transactional orders</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono">
              Last 14 Days
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.revenueTrends || []}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="order_count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" name="Orders" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Warehouse Fulfillment Performance */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Warehouse Capacity</h3>
              <p className="text-[11px] text-slate-400">Current utilization & bottleneck flags</p>
            </div>
            <button onClick={() => navigate('/warehouses')} className="text-xs text-brand-400 hover:text-brand-300 font-medium">
              View All
            </button>
          </div>
          <div className="flex-1 space-y-3">
            {charts?.warehousePerformance?.slice(0, 5).map((wh: any) => (
              <div key={wh.code} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    {wh.code} — {wh.city}
                  </span>
                  <span className={wh.api_status === 'sync_error' ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                    {wh.current_utilization}% ({wh.api_status === 'sync_error' ? 'SYNC ERROR' : 'OK'})
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      wh.api_status === 'sync_error'
                        ? 'bg-rose-500'
                        : wh.current_utilization > 85
                        ? 'bg-amber-500'
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${wh.current_utilization}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carrier Logistics & Return Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Partner SLAs */}
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-white mb-1">Carrier Partner SLAs</h3>
          <p className="text-[11px] text-slate-400 mb-4">On-time transit rates across logistics carriers</p>
          <div className="space-y-3">
            {charts?.deliveryPerformance?.map((p: any) => (
              <div key={p.partner} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <span className="font-medium text-slate-200">{p.partner}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400">{p.delayedCount} Delayed</span>
                  <span className={`px-2 py-0.5 rounded font-mono font-semibold ${
                    p.onTimeRate < 85 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {p.onTimeRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Product Return Categories */}
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-white mb-1">Returns by Category</h3>
          <p className="text-[11px] text-slate-400 mb-4">Reverse logistics distribution across catalog</p>
          <div className="space-y-3">
            {charts?.returnsByCategory?.slice(0, 4).map((c: any) => (
              <div key={c.category} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <span className="font-medium text-slate-200">{c.category}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-brand-300 font-mono font-semibold">
                  {c.return_count} Returns
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
