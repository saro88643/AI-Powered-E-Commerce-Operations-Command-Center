import React, { useState, useEffect } from 'react';
import { RotateCcw, Search, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const Returns: React.FC = () => {
  const { user } = useAuth();
  const [returns, setReturns] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Refund Modal
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/returns', {
        params: {
          page,
          limit: 15,
          status: statusFilter || undefined
        }
      });
      setReturns(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      console.error('Failed to load returns:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [page, statusFilter]);

  const handleApproveRefund = async () => {
    if (!selectedReturn) return;

    setProcessing(true);
    try {
      const res = await api.post(`/returns/${selectedReturn.id}/refund`, {
        reason: refundReason || selectedReturn.reason,
        authorizedAmount: selectedReturn.refund_amount
      });
      alert(`Refund approved successfully! Transaction ID: ${res.data.refundId}. Audit Log ID: ${res.data.auditId}`);
      setSelectedReturn(null);
      fetchReturns();
    } catch (err: any) {
      alert('Refund failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-cyan-400" />
            <span>Reverse Logistics & Returns Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Return authorizations, defective SKU detection, and policy-governed refund settlement.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="requested">Requested</option>
            <option value="approved">Approved</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Total Returns: <span className="text-white font-bold">{total}</span>
        </div>
      </div>

      {/* Returns Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Return Number</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Product ID</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Return Reason</th>
                <th className="py-3 px-4">Refund Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">Loading returns...</td>
                </tr>
              ) : (
                returns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">{r.return_number}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{r.order_number || r.order_id}</td>
                    <td className="py-3 px-4 font-mono text-brand-300">{r.product_id}</td>
                    <td className="py-3 px-4 font-semibold text-white">{r.product_name || 'Item'}</td>
                    <td className="py-3 px-4 text-slate-300">{r.reason}</td>
                    <td className="py-3 px-4 font-bold text-white">₹{parseFloat(r.refund_amount).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                          r.status === 'refunded'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status !== 'refunded' ? (
                        <button
                          onClick={() => {
                            setSelectedReturn(r);
                            setRefundReason(r.reason);
                          }}
                          className="px-2.5 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-semibold transition"
                        >
                          Process Refund
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Settled</span>
                      )}
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

      {/* Refund Approval Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Approve Customer Refund</h3>
            
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div><span className="text-slate-500">Return:</span> <span className="font-mono text-cyan-300">{selectedReturn.return_number}</span></div>
                <div><span className="text-slate-500">Product:</span> <span className="text-white font-semibold">{selectedReturn.product_name}</span></div>
                <div><span className="text-slate-500">Refund Amount:</span> <span className="text-emerald-400 font-bold">₹{selectedReturn.refund_amount}</span></div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Reason for Refund Authorization</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                onClick={() => setSelectedReturn(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveRefund}
                disabled={processing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                {processing ? 'Processing Payment API...' : 'Authorize Refund & Audit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
