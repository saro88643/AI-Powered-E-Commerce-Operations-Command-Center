import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, ArrowRight, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders', {
        params: {
          page,
          limit: 15,
          status: statusFilter || undefined,
          city: cityFilter || undefined,
          search: search || undefined
        }
      });
      setOrders(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, cityFilter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-brand-400" />
            <span>Order Management & Fulfillment</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Querying PostgreSQL transactional orders with real-time status and warehouse routing.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Total Records: <span className="text-white font-bold">{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order number or customer ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
          >
            Search
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="delayed">Delayed (Alert)</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Cities</option>
            <option value="Coimbatore">Coimbatore (Hub W03)</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Chennai">Chennai</option>
          </select>

          <button
            onClick={() => { setStatusFilter(''); setCityFilter(''); setSearch(''); setPage(1); }}
            className="text-xs text-slate-400 hover:text-white transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Order Number</th>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-400" />
                    <span>Loading orders...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No orders match the selected filters.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/orders/${o.id}`)}
                    className="hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    <td className="py-3 px-4 font-semibold text-white group-hover:text-brand-400 transition">
                      {o.order_number}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{o.customer_id}</td>
                    <td className="py-3 px-4">{o.shipping_city}</td>
                    <td className="py-3 px-4 font-mono">
                      <span className="text-amber-400 font-semibold">{o.warehouse_code || 'W03'}</span>
                      <span className="text-[10px] text-slate-500 ml-1">({o.warehouse_name || 'Hub'})</span>
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-mono text-slate-400">{o.channel}</td>
                    <td className="py-3 px-4 font-semibold text-white">₹{parseFloat(o.total_amount).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                          o.status === 'delayed'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : o.status === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-indigo-500/20 text-indigo-400'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40">
          <span>Page {page} of {Math.max(1, Math.ceil(total / 15))}</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 15 >= total}
              className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
