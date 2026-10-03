import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Building2,
  CreditCard,
  Truck,
  RotateCcw,
  LifeBuoy,
  ArrowLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const StoreOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTracking() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/orders/track/${id}`);
        if (res.ok) {
          const data = await res.json();
          setTrackingData(data);
        }
      } catch (err) {
        console.error('Failed to load tracking data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) fetchTracking();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-mono">Fetching Consignment Status &amp; Real-Time Milestones...</p>
      </div>
    );
  }

  if (!trackingData || !trackingData.order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-xs text-slate-500">Order #{id} could not be retrieved from the ShopSphere registry.</p>
        <Link to="/store/orders" className="inline-block bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs">
          Return to Orders
        </Link>
      </div>
    );
  }

  const { order, milestones = [], courier = {} } = trackingData;
  const isDelayed = order.status === 'delayed';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/store" className="hover:text-slate-900">Store</Link>
        <span>&rsaquo;</span>
        <Link to="/store/orders" className="hover:text-slate-900">Orders</Link>
        <span>&rsaquo;</span>
        <span className="text-slate-900 font-semibold">{order.order_number}</span>
      </nav>

      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {order.order_number}
            </h1>
            {isDelayed ? (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> ⚠ DELAYED
              </span>
            ) : order.status === 'delivered' ? (
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> DELIVERED
              </span>
            ) : (
              <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> IN PROGRESS
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Placed on {new Date(order.order_date || order.created_at).toLocaleString('en-IN')} &bull; Channel: {order.channel || 'WEBSITE'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            to={`/store/complaints?orderNumber=${order.order_number}`}
            className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <LifeBuoy className="w-4 h-4 text-rose-600" /> Lodge Complaint
          </Link>

          <Link
            to={`/store/returns?orderNumber=${order.order_number}`}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" /> Return / Refund Policy
          </Link>
        </div>
      </div>

      {/* Requirement 17: CUSTOMER DELIVERY DELAY ALERT BANNER */}
      {isDelayed && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold flex-shrink-0 shadow">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                ⚠ Your order is delayed. We are working to resolve the issue.
              </h3>
              <p className="text-xs text-slate-700 font-medium mt-0.5">
                Expected Delivery Date was: <strong className="text-slate-900">{new Date(order.expected_delivery).toLocaleDateString('en-IN')}</strong>. Current updated estimate is being prioritized by our regional logistics team.
              </p>
            </div>
          </div>
          <div className="text-[11px] text-slate-600 pt-2 border-t border-amber-300/60 flex items-center justify-between">
            <span>If you require immediate assistance or compensation eligibility check, contact our support team or file a complaint.</span>
            <Link to={`/store/complaints?orderNumber=${order.order_number}`} className="font-bold text-amber-900 hover:underline">
              Raise Complaint &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Requirement 14: ORDER TRACKING MILESTONE TIMELINE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
        <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Truck className="w-5 h-5 text-amber-500" />
          <span>Real-Time Consignment Tracking Timeline</span>
        </h3>

        <div className="relative pl-6 border-l-2 border-slate-200 space-y-8 my-4">
          {milestones.map((m: any, idx: number) => {
            const isDone = m.completed;
            const isInProg = m.inProgress;

            return (
              <div key={idx} className="relative group">
                {/* Milestone Node */}
                <div
                  className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                    isDone
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : isInProg
                      ? 'bg-amber-400 border-amber-500 text-slate-950 animate-bounce'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isDone ? '✓' : idx + 1}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${isDone ? 'text-slate-900' : isInProg ? 'text-amber-800' : 'text-slate-400'}`}>
                      {m.label}
                    </span>
                    {m.timestamp && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(m.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Location: <span className="font-semibold text-slate-700">{m.location}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Grid: Items, Shipping, Payment, Courier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ordered Products */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
            Items in Order ({order.items?.length || 0})
          </h3>

          <div className="divide-y divide-slate-100">
            {order.items?.map((item: any) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <Link to={`/store/product/${item.product_id}`} className="font-bold text-slate-900 hover:text-amber-600 block">
                    {item.product_name || item.product_id}
                  </Link>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Product ID: {item.product_id} &bull; SKU: {item.sku}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">₹{parseFloat(item.total_price || 0).toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-slate-400">Qty: {item.quantity} &times; ₹{parseFloat(item.unit_price || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline text-xs">
            <span className="font-bold text-slate-700">Total Order Value:</span>
            <span className="text-xl font-black text-slate-900">₹{parseFloat(order.total_amount || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Fulfillment & Courier Meta Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm text-xs">
            <h3 className="font-black text-slate-900 pb-2 border-b border-slate-100">
              Logistics &amp; Courier Info
            </h3>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Origin Warehouse</span>
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                {order.warehouse_name || 'W03 Coimbatore Hub'}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assigned Delivery Fleet</span>
              <div className="font-bold text-slate-900 mt-0.5">{courier.provider || 'ShopSphere Express Logistics'}</div>
              <div className="text-[11px] text-slate-500 font-mono">Waybill: {courier.waybillNumber}</div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Shipping Destination</span>
              <div className="font-medium text-slate-800 mt-0.5 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>{order.shipping_address || `${order.shipping_city}, Tamil Nadu`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreOrderDetail;
