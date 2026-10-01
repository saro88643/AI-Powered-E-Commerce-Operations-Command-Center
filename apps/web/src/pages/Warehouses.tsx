import React, { useState, useEffect } from 'react';
import { Warehouse as WarehouseIcon, AlertTriangle, CheckCircle, RefreshCw, Layers, ShoppingCart } from 'lucide-react';
import api from '../api/client';

export const Warehouses: React.FC = () => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWh, setSelectedWh] = useState<any>(null);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data);
    } catch (e) {
      console.error('Failed to load warehouses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const openWarehouseDetail = async (whId: string) => {
    try {
      const res = await api.get(`/warehouses/${whId}`);
      setSelectedWh(res.data);
    } catch (e) {
      console.error('Failed to load warehouse details:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <WarehouseIcon className="w-5 h-5 text-amber-400" />
            <span>Fulfillment Warehouses & Regional Hubs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Distributed facility monitoring across 20 regional nodes, capacity utilization, and edge sync health.
          </p>
        </div>
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {warehouses.map((w) => {
          const isSyncError = w.api_status === 'sync_error';
          return (
            <div
              key={w.id}
              onClick={() => openWarehouseDetail(w.id)}
              className={`glass-panel p-4 rounded-2xl cursor-pointer hover:border-slate-600 transition flex flex-col justify-between ${
                isSyncError ? 'border-rose-500/50 bg-rose-500/5 glow-border' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400 text-sm">{w.code}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isSyncError
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {isSyncError ? 'SYNC ERROR' : 'HEALTHY'}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white mt-1.5">{w.name}</h3>
                <p className="text-xs text-slate-400">{w.city}, {w.state}</p>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Available Stock</span>
                    <span className="font-bold text-white mt-0.5 block">{w.inventoryCount?.toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Delayed Orders</span>
                    <span className={`font-bold mt-0.5 block ${w.delayedOrders > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {w.delayedOrders || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Utilization Meter */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Capacity Utilization</span>
                  <span className="text-white font-mono">{w.current_utilization}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isSyncError ? 'bg-rose-500' : w.current_utilization > 85 ? 'bg-amber-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${w.current_utilization}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warehouse Detail Drawer / Modal */}
      {selectedWh && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-semibold">
                  Facility Audit
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedWh.name} ({selectedWh.code})</h3>
                <p className="text-xs text-slate-400">{selectedWh.address}</p>
              </div>
              <button
                onClick={() => setSelectedWh(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
              >
                Close
              </button>
            </div>

            {/* Live Inventory Samples */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Facility Inventory ({selectedWh.inventory?.length || 0})</span>
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedWh.inventory?.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <div>
                      <span className="font-semibold text-white">{inv.product_name}</span>
                      <span className="text-slate-400 text-[10px] ml-2 font-mono">({inv.product_id})</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-white">{inv.available_quantity} available</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        inv.status === 'Mismatch' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders Routed */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-brand-400" />
                <span>Recent Routed Orders</span>
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {selectedWh.recentOrders?.map((ord: any) => (
                  <div key={ord.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                    <span className="font-semibold text-white">{ord.order_number} ({ord.shipping_city})</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      ord.status === 'delayed' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {ord.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
