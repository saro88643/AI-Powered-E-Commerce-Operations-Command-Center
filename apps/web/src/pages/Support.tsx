import React, { useState, useEffect } from 'react';
import { Headphones, Search, AlertCircle, CheckCircle, Clock, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export const Support: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Repeat contacts state
  const [activeTab, setActiveTab] = useState<'tickets' | 'repeats'>('tickets');
  const [repeatContacts, setRepeatContacts] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchTickets = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tickets') {
        const res = await api.get('/support/tickets', {
          params: {
            page,
            limit: 15,
            category: categoryFilter || undefined,
            priority: priorityFilter || undefined,
            status: statusFilter || undefined,
            search: search || undefined
          }
        });
        setTickets(res.data.data);
        setTotal(res.data.total);
      } else {
        const res = await api.get('/support/repeat-contacts');
        setRepeatContacts(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load tickets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, categoryFilter, priorityFilter, statusFilter, activeTab]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Headphones className="w-5 h-5 text-indigo-400" />
            <span>Support Operations & SLA Escalations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Querying MongoDB support tickets, repeat contact detection, and sentiment monitoring.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'tickets' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Tickets Queue
        </button>
        <button
          onClick={() => setActiveTab('repeats')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
            activeTab === 'repeats' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Repeated Customer Contacts</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white">Alert</span>
        </button>
      </div>

      {activeTab === 'tickets' ? (
        <>
          {/* Filters Bar */}
          <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ticket ID, order ID or customer ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                onClick={fetchTickets}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
              >
                Search
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="delivery_delay">Delivery Delay</option>
                <option value="inventory_issue">Inventory Issue</option>
                <option value="product_quality">Product Quality</option>
                <option value="refund_status">Refund Status</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Order Ref</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Message Summary</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">Loading tickets...</td>
                    </tr>
                  ) : (
                    tickets.map((t) => (
                      <tr key={t.ticket_id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-400">{t.ticket_id}</td>
                        <td className="py-3 px-4 font-mono text-purple-300">{t.customer_id}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{t.order_id || 'N/A'}</td>
                        <td className="py-3 px-4 font-medium text-slate-200">{t.category}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold font-mono ${
                              t.priority === 'urgent'
                                ? 'bg-rose-500/20 text-rose-400'
                                : t.priority === 'high'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-md truncate">{t.message}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                              t.status === 'open'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : t.status === 'escalated'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {t.status}
                          </span>
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
      ) : (
        /* Repeated Customer Contacts Table (Customer SLA Alert) */
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Repeat Customer Escalation Protocol</h3>
            <p className="text-xs text-slate-400">Customers contacting support &ge; 3 times flagged per Customer Support SOP Section 2.4</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Total Contacts</th>
                  <th className="py-3 px-4">Open Tickets</th>
                  <th className="py-3 px-4">Urgent Count</th>
                  <th className="py-3 px-4">Primary Category</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {repeatContacts.map((rc) => (
                  <tr key={rc.customerId} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-purple-300">{rc.customerId}</td>
                    <td className="py-3 px-4 font-bold text-rose-400">{rc.ticketCount} Contacts</td>
                    <td className="py-3 px-4 text-amber-300">{rc.openCount} Open</td>
                    <td className="py-3 px-4 font-mono">{rc.urgentCount} Urgent</td>
                    <td className="py-3 px-4 font-medium text-slate-200">{rc.primaryCategory}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/customers/${rc.customerId}`)}
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition"
                      >
                        Open Customer 360
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
