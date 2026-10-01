import React, { useState, useEffect } from 'react';
import { Users, Search, ChevronLeft, ChevronRight, User, ShoppingCart, Headphones, ArrowRight } from 'lucide-react';
import api from '../api/client';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [segmentFilter, setSegmentFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Selected Customer 360 Modal
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [custLoading, setCustLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', {
        params: {
          page,
          limit: 15,
          segment: segmentFilter || undefined,
          search: search || undefined
        }
      });
      setCustomers(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      console.error('Failed to fetch customers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, segmentFilter]);

  const openCustomer360 = async (customerId: string) => {
    setCustLoading(true);
    try {
      const res = await api.get(`/customers/${customerId}`);
      setSelectedCust(res.data);
    } catch (e) {
      console.error('Failed to load customer 360:', e);
    } finally {
      setCustLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span>Customer 360 Operations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Querying MongoDB customer profiles, repeat contact signals, and cross-channel lifetime value.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Total Customers: <span className="text-white font-bold">{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, phone, or ID (e.g. CUST-1042)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            onClick={fetchCustomers}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
          >
            Search
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={segmentFilter}
            onChange={(e) => { setSegmentFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Segments</option>
            <option value="Enterprise">Enterprise</option>
            <option value="VIP">VIP</option>
            <option value="Regular">Regular</option>
            <option value="Occasional">Occasional</option>
          </select>
        </div>
      </div>

      {/* Customer Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Segment</th>
                <th className="py-3 px-4">Lifetime Value</th>
                <th className="py-3 px-4 text-right">360 View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">Loading customers...</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.customer_id}
                    onClick={() => openCustomer360(c.customer_id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-purple-400">{c.customer_id}</td>
                    <td className="py-3 px-4 font-semibold text-white group-hover:text-purple-300 transition">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      <div>{c.email}</div>
                      <div className="text-[10px] text-slate-500">{c.phone}</div>
                    </td>
                    <td className="py-3 px-4">{c.city}, {c.state}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                        c.segment === 'VIP'
                          ? 'bg-amber-500/20 text-amber-300'
                          : c.segment === 'Enterprise'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {c.segment}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      ₹{c.lifetime_value ? c.lifetime_value.toLocaleString() : '12,500'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition">
                        View 360
                      </button>
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

      {/* Customer 360 Modal */}
      {selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-purple-400 font-semibold">
                  Customer 360 View
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">{selectedCust.profile?.name}</h3>
                <p className="text-xs text-slate-400">
                  {selectedCust.profile?.customer_id} | {selectedCust.profile?.city}, {selectedCust.profile?.state}
                </p>
              </div>
              <button
                onClick={() => setSelectedCust(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Total Orders</span>
                <span className="text-base font-bold text-white">{selectedCust.metrics?.totalOrders || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Delayed Orders</span>
                <span className="text-base font-bold text-rose-400">{selectedCust.metrics?.delayedOrdersCount || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Open Tickets</span>
                <span className="text-base font-bold text-amber-400">{selectedCust.metrics?.openTicketsCount || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Lifetime Spend</span>
                <span className="text-base font-bold text-emerald-400">₹{Math.round(selectedCust.metrics?.totalSpend || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Support Tickets Section */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Headphones className="w-3.5 h-3.5 text-indigo-400" />
                <span>Support Tickets ({selectedCust.supportTickets?.length || 0})</span>
              </h4>
              <div className="space-y-2">
                {selectedCust.supportTickets?.map((t: any) => (
                  <div key={t.ticket_id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{t.ticket_id} — {t.category}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        {t.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{t.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Orders Section */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-brand-400" />
                <span>Order History ({selectedCust.orders?.length || 0})</span>
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedCust.orders?.map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                    <div>
                      <span className="font-semibold text-white">{o.order_number}</span>
                      <span className="text-slate-400 text-[11px] ml-2">₹{o.total_amount}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${o.status === 'delayed' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {o.status}
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
