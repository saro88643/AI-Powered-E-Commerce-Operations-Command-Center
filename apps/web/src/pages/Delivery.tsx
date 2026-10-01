import React, { useState, useEffect } from 'react';
import { Truck, AlertTriangle, Shield, CheckCircle, RefreshCw, Send } from 'lucide-react';
import api from '../api/client';

export const Delivery: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [delayedOrders, setDelayedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Escalation Modal
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [escalateData, setEscalateData] = useState({
    orderId: 'ORD-00001',
    reason: 'Fulfillment stalled > 72h. Rerouting via priority air carrier.',
    priority: 'urgent',
    alternatePartner: 'BlueDart Express'
  });

  const fetchDeliveryData = async () => {
    setLoading(true);
    try {
      const [mRes, dRes] = await Promise.all([
        api.get('/delivery/metrics'),
        api.get('/delivery/delayed')
      ]);
      setMetrics(mRes.data);
      setDelayedOrders(dRes.data.delayedOrders || []);
    } catch (e) {
      console.error('Failed to load delivery data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryData();
  }, []);

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/delivery/escalate', escalateData);
      alert(`Delivery for order ${escalateData.orderId} escalated to ${escalateData.alternatePartner}. Audit log created.`);
      setEscalateModalOpen(false);
      fetchDeliveryData();
    } catch (err: any) {
      alert('Escalation failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            <span>Delivery & Logistics Operations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Omnichannel logistics telemetry, courier SLA benchmarks, corridor congestion, and escalation workflows.
          </p>
        </div>
        <button
          onClick={() => setEscalateModalOpen(true)}
          className="flex items-center space-x-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
        >
          <AlertTriangle className="w-4 h-4 text-amber-300" />
          <span>Escalate Delayed Order</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl">
          <span className="text-xs text-slate-400">Total Consignments</span>
          <div className="text-2xl font-bold text-white mt-1">
            {metrics?.totalDeliveries?.toLocaleString() || '15,000'}
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">Live telemetry across 5 carriers</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <span className="text-xs text-slate-400">Network On-Time Rate</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {metrics?.onTimePercentage || '89.7'}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">SLA threshold: 85%</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-rose-500/30">
          <span className="text-xs text-slate-400">Delayed Deliveries</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">
            {delayedOrders.length} Orders
          </div>
          <span className="text-[11px] text-rose-300 mt-1 block">Bottleneck in South corridor (Salem / Coimbatore)</span>
        </div>
      </div>

      {/* Carrier Benchmark Performance */}
      <div className="glass-panel p-5 rounded-2xl">
        <h3 className="text-sm font-semibold text-white mb-3">Carrier Partner Performance Scorecards</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {metrics?.partnerStats?.map((p: any) => (
            <div key={p.partner} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
              <div className="font-bold text-white text-sm">{p.partner}</div>
              <div className="text-slate-400 text-[11px]">Volume: {p.totalVolume?.toLocaleString()}</div>
              <div className="text-[11px]">Avg Transit: <span className="font-mono text-slate-300">{p.avgTransitDays}d</span></div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  p.onTimeRate < 85 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {p.onTimeRate}% SLA
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delayed Orders Queue */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Active Delayed Consignments Queue ({delayedOrders.length})</h3>
          <span className="text-xs text-slate-400">Focus Region: Coimbatore (W03 Origin Hub)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Order / Tracking Number</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Carrier</th>
                <th className="py-3 px-4">Delay Reason</th>
                <th className="py-3 px-4">Expected SLA</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {delayedOrders.map((d: any) => (
                <tr key={d.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    <div>{d.order_id || d.order_number}</div>
                    <div className="text-[10px] text-brand-400">{d.tracking_number}</div>
                  </td>
                  <td className="py-3 px-4">{d.destination_city}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{d.partner || 'SpeedFast'}</td>
                  <td className="py-3 px-4 text-rose-300 font-medium">
                    {d.delay_reason || 'Origin facility stock fulfillment delayed'}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {d.estimated_delivery ? new Date(d.estimated_delivery).toLocaleDateString() : 'Overdue'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setEscalateData({
                          ...escalateData,
                          orderId: d.order_id || d.order_number
                        });
                        setEscalateModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] transition"
                    >
                      Escalate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Escalation Modal */}
      {escalateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleEscalate} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Escalate Delayed Consignment</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Order Reference ID</label>
                <input
                  type="text"
                  value={escalateData.orderId}
                  onChange={(e) => setEscalateData({ ...escalateData, orderId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Re-route to Priority Carrier</label>
                <select
                  value={escalateData.alternatePartner}
                  onChange={(e) => setEscalateData({ ...escalateData, alternatePartner: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="BlueDart Express">BlueDart Express (Air Priority)</option>
                  <option value="Delhivery Express">Delhivery Express</option>
                  <option value="LocalHub Dedicated">LocalHub Dedicated Courier</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Escalation Reason</label>
                <input
                  type="text"
                  value={escalateData.reason}
                  onChange={(e) => setEscalateData({ ...escalateData, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setEscalateModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Confirm Escalation & Audit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
