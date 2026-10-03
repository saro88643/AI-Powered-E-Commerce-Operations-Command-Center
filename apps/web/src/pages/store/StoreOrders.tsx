import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Search,
  Truck,
  Building2,
  RefreshCw
} from 'lucide-react';

export const StoreOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    async function loadMyOrders() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/orders?myOrders=true&limit=50');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMyOrders();
  }, []);

  const filteredOrders = orders.filter(o => {
    const matchSearch = !searchQuery || 
      o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.shipping_city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || o.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') {
      return (
        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" /> Delivered
        </span>
      );
    }
    if (s === 'delayed') {
      return (
        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> ⚠ Delivery Delayed
        </span>
      );
    }
    if (s === 'shipped' || s === 'in_transit') {
      return (
        <span className="bg-sky-100 text-sky-800 border border-sky-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Truck className="w-3.5 h-3.5" /> In Transit
        </span>
      );
    }
    return (
      <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" /> Processing
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            <span>My Orders &amp; Consignments</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time shipment milestones, expected delivery dates, and fulfillment status across national hubs.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Order # or City..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="processing">Processing</option>
            <option value="delayed">Delayed</option>
            <option value="shipped">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-mono">Fetching Order History from ShopSphere Database...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No orders found</h3>
          <p className="text-xs text-slate-500">You have no active or historical orders matching your query.</p>
          <Link to="/store/products" className="inline-block bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg">
            Shop Products Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all hover:border-amber-400 space-y-4"
            >
              {/* Order Header Strip */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Order Placed</span>
                    <span className="font-bold text-slate-900">
                      {new Date(ord.order_date || ord.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="h-6 w-px bg-slate-200" />

                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Amount</span>
                    <span className="font-black text-slate-900">₹{parseFloat(ord.total_amount || 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                  <div className="hidden sm:block">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Fulfillment Hub</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-indigo-600" /> {ord.warehouse_code || 'W03'} ({ord.shipping_city || 'Coimbatore'})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(ord.status)}
                  <Link
                    to={`/store/orders/${ord.order_number}`}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <span>View &amp; Track</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Order Body info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-mono font-bold text-slate-900 text-sm">{ord.order_number}</div>
                  <div className="text-slate-500 mt-0.5">
                    Shipping Channel: <span className="font-semibold text-slate-700">{ord.channel || 'WEBSITE'}</span>
                  </div>
                </div>

                {/* Delay Alert Banner for Customer (Section 17) */}
                {ord.status === 'delayed' && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-amber-900 text-xs flex items-center gap-2 max-w-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <div>
                      <span className="font-bold">Shipment Advisory:</span> Your order is delayed. We are actively working to resolve the issue and prioritize delivery.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoreOrders;
