import React, { useState, useEffect } from 'react';
import { Layers, Search, ArrowRightLeft, PlusCircle, RefreshCw, ChevronLeft, ChevronRight, History } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Tabs: 'stock' | 'transfers' | 'events'
  const [activeTab, setActiveTab] = useState<'stock' | 'transfers' | 'events'>('stock');
  const [transfers, setTransfers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    productId: 'P-204',
    fromWarehouseId: 'wh-w02',
    toWarehouseId: 'wh-w03',
    quantity: 50,
    reason: 'Resolve Coimbatore order fulfillment bottleneck'
  });
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stock') {
        const res = await api.get('/inventory', {
          params: {
            page,
            limit: 15,
            status: statusFilter || undefined,
            warehouseId: warehouseFilter || undefined,
            search: search || undefined
          }
        });
        setInventory(res.data.data);
        setTotal(res.data.total);
      } else if (activeTab === 'transfers') {
        const res = await api.get('/inventory/transfers');
        setTransfers(res.data);
      } else if (activeTab === 'events') {
        const res = await api.get('/inventory/events');
        setEvents(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch inventory data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page, statusFilter, warehouseFilter, activeTab]);

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTransfer(true);
    try {
      await api.post('/inventory/transfers', transferData);
      alert(`Transfer of ${transferData.quantity} units of ${transferData.productId} completed successfully. Audit log created.`);
      setIsTransferModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      alert('Transfer failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingTransfer(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Layers className="w-5 h-5 text-brand-400" />
            <span>Omnichannel Inventory Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time stock balance, multi-warehouse allocations, discrepancy detection, and transfer execution.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Create Stock Transfer</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'stock' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Live Stock Levels
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'transfers' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Transfer History
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'events' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Cycle Events & Audits
        </button>
      </div>

      {activeTab === 'stock' && (
        <>
          {/* Filters */}
          <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search product ID, name, SKU (e.g. P-204)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
              <button
                onClick={fetchInventory}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
              >
                Search
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Mismatch">Mismatch (Discrepancy)</option>
                <option value="Critical">Critical Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Healthy">Healthy</option>
              </select>

              <select
                value={warehouseFilter}
                onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">All Warehouses</option>
                <option value="W03">W03 (Coimbatore)</option>
                <option value="W02">W02 (Bengaluru)</option>
                <option value="W01">W01 (Mumbai)</option>
                <option value="W04">W04 (Delhi NCR)</option>
                <option value="W05">W05 (Chennai)</option>
              </select>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Product ID / SKU</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4">Available</th>
                    <th className="py-3 px-4">Reserved</th>
                    <th className="py-3 px-4">Reorder Level</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">Loading inventory...</td>
                    </tr>
                  ) : (
                    inventory.map((inv) => (
                      <tr
                        key={inv.id}
                        className={`hover:bg-slate-800/40 transition ${
                          inv.status === 'Mismatch'
                            ? 'bg-rose-500/10'
                            : inv.status === 'Critical'
                            ? 'bg-amber-500/5'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                          <div>{inv.product_id}</div>
                          <div className="text-[10px] text-slate-500">{inv.sku}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">{inv.product_name}</td>
                        <td className="py-3 px-4 font-mono text-amber-300">
                          {inv.warehouse_code} ({inv.warehouse_name})
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          <span className={inv.available_quantity === 0 ? 'text-rose-400' : ''}>
                            {inv.available_quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">{inv.reserved_quantity}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{inv.reorder_threshold}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                              inv.status === 'Mismatch'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : inv.status === 'Critical'
                                ? 'bg-rose-500/15 text-rose-300'
                                : inv.status === 'Low Stock'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[10px] font-mono">
                          {new Date(inv.last_sync_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40">
              <span>Page {page} of {Math.max(1, Math.ceil(total / 15))}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 15 >= total}
                  className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Transfers Tab */}
      {activeTab === 'transfers' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Transfer Number</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">From Hub</th>
                <th className="py-3 px-4">To Hub</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Executed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">No transfers recorded yet.</td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-brand-300">{t.transfer_number}</td>
                    <td className="py-3 px-4 font-semibold text-white">{t.product_id}</td>
                    <td className="py-3 px-4 font-mono text-amber-400">{t.from_warehouse_code || 'W02'}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">{t.to_warehouse_code || 'W03'}</td>
                    <td className="py-3 px-4 font-bold text-white">{t.quantity} units</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{t.reason}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{t.requested_by}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4">Previous Qty</th>
                <th className="py-3 px-4">New Qty</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono text-slate-400">{e.id}</td>
                  <td className="py-3 px-4 uppercase font-semibold text-brand-400">{e.event_type}</td>
                  <td className="py-3 px-4 font-mono text-white">{e.product_id}</td>
                  <td className="py-3 px-4 font-mono text-amber-300">{e.warehouse_code || 'W03'}</td>
                  <td className="py-3 px-4">{e.previous_qty}</td>
                  <td className="py-3 px-4 font-bold text-white">{e.new_qty}</td>
                  <td className="py-3 px-4 text-slate-300">{e.reason}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">{new Date(e.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Stock Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleExecuteTransfer} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create Inter-Warehouse Stock Transfer</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Product ID</label>
                <input
                  type="text"
                  value={transferData.productId}
                  onChange={(e) => setTransferData({ ...transferData, productId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">From Warehouse</label>
                  <select
                    value={transferData.fromWarehouseId}
                    onChange={(e) => setTransferData({ ...transferData, fromWarehouseId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="wh-w02">W02 - Bengaluru Hub (Surplus)</option>
                    <option value="wh-w01">W01 - Mumbai Hub</option>
                    <option value="wh-w04">W04 - Delhi NCR</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">To Warehouse</label>
                  <select
                    value={transferData.toWarehouseId}
                    onChange={(e) => setTransferData({ ...transferData, toWarehouseId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="wh-w03">W03 - Coimbatore Hub (Depleted)</option>
                    <option value="wh-w05">W05 - Chennai Hub</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Transfer Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={transferData.quantity}
                  onChange={(e) => setTransferData({ ...transferData, quantity: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Operational Justification / Reason</label>
                <input
                  type="text"
                  value={transferData.reason}
                  onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingTransfer}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                {submittingTransfer ? 'Executing Transfer...' : 'Execute Stock Transfer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
