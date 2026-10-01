import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, User, Truck, CreditCard,
  RotateCcw, Headphones, Clock, CheckCircle, Shield
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
      setNewStatus(res.data.status);
    } catch (e) {
      console.error('Failed to load order:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === order.status) return;

    setUpdating(true);
    try {
      await api.patch(`/orders/${id}/status`, {
        status: newStatus,
        reason: statusReason || 'Status updated from operations detail console'
      });
      alert(`Order status updated to ${newStatus}. Audit log created.`);
      fetchOrderDetail();
    } catch (err: any) {
      alert('Failed to update status: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading order details...</div>;
  }

  if (!order) {
    return <div className="py-20 text-center text-xs text-slate-400">Order not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </button>

        <span
          className={`text-xs px-3 py-1 rounded-full font-semibold ${
            order.status === 'delayed'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          Status: {order.status.toUpperCase()}
        </span>
      </div>

      {/* Main Order Info Card */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-brand-400 font-semibold">
            Order Reference
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">{order.order_number}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Placed on {new Date(order.order_date).toLocaleString()} via {order.channel.toUpperCase()} channel
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div>
            <div className="text-[10px] uppercase text-slate-400">Fulfillment Hub</div>
            <div className="text-sm font-bold text-amber-400 font-mono">
              {order.warehouse_code} — {order.warehouse_city}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div>
            <div className="text-[10px] uppercase text-slate-400">Total Value</div>
            <div className="text-sm font-bold text-white">₹{parseFloat(order.total_amount).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Grid: Items, Payment, Customer, Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Order Items (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-brand-400" />
              <span>Line Items ({order.items?.length || 0})</span>
            </h3>

            <div className="space-y-3">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div>
                    <span className="font-semibold text-white block">{item.product_name}</span>
                    <span className="text-[11px] font-mono text-cyan-400">
                      Product ID: {item.product_id} | SKU: {item.sku}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">{item.quantity} x ₹{parseFloat(item.unit_price).toLocaleString()}</span>
                    <span className="font-semibold text-white">₹{parseFloat(item.total_price).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Support Tickets on this Order */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center space-x-2">
              <Headphones className="w-4 h-4 text-indigo-400" />
              <span>Related Support Tickets ({order.supportTickets?.length || 0})</span>
            </h3>

            {order.supportTickets?.length === 0 ? (
              <p className="text-xs text-slate-500">No support tickets reported for this order.</p>
            ) : (
              <div className="space-y-3">
                {order.supportTickets?.map((t: any) => (
                  <div key={t.ticket_id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{t.ticket_id} — {t.category}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        {t.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{t.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info & Status Actions */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <User className="w-4 h-4 text-purple-400" />
              <span>Customer Details</span>
            </h3>

            <div className="text-xs space-y-1.5 text-slate-300">
              <div><span className="text-slate-500">Name:</span> {order.customer?.name || 'Customer'}</div>
              <div><span className="text-slate-500">Customer ID:</span> <span className="font-mono text-purple-300">{order.customer_id}</span></div>
              <div><span className="text-slate-500">City:</span> {order.shipping_city}</div>
              <div><span className="text-slate-500">Address:</span> {order.shipping_address}</div>
            </div>

            <button
              onClick={() => navigate(`/customers/${order.customer_id}`)}
              className="w-full mt-2 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-xl text-xs font-medium transition"
            >
              View Customer 360
            </button>
          </div>

          {/* Payment & Returns Card */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Payment Details</span>
            </h3>

            <div className="text-xs space-y-1.5 text-slate-300">
              <div><span className="text-slate-500">Method:</span> {order.payment?.payment_method?.toUpperCase() || 'UPI'}</div>
              <div><span className="text-slate-500">Payment Status:</span> <span className="font-bold text-emerald-400">{order.payment?.status?.toUpperCase() || 'SUCCESS'}</span></div>
              <div><span className="text-slate-500">Amount:</span> ₹{order.total_amount}</div>
            </div>
          </div>

          {/* Status Update & Audit Logging Gate */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Operational Status Update</span>
            </h3>

            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 block">Select Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delayed">Delayed</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <label className="text-[11px] text-slate-400 block pt-1">Reason for Audit Log</label>
              <input
                type="text"
                placeholder="Reason for change..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />

              <button
                onClick={handleUpdateStatus}
                disabled={updating || newStatus === order.status}
                className="w-full py-2 px-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition"
              >
                {updating ? 'Updating...' : 'Update & Log Audit Event'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
