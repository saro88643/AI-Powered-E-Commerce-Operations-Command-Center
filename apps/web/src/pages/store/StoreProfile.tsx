import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  MapPin,
  Package,
  RotateCcw,
  LifeBuoy,
  Bell,
  ShieldCheck,
  Building2,
  ExternalLink,
  LogOut
} from 'lucide-react';

export const StoreProfile: React.FC = () => {
  const { savedAddress, notifications, unreadCount } = useStore();
  const { user, logout } = useAuth();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg">
            {savedAddress.name ? savedAddress.name[0] : 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                {savedAddress.name || 'Aarav Sharma'}
              </h1>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/30">
                VIP CUSTOMER
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer ID: CUST-1042 &bull; Coimbatore Corridor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/organization"
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl border border-slate-700 transition-colors"
          >
            Org Hierarchy
          </Link>
          <button
            onClick={logout}
            className="text-xs bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 px-4 py-2 rounded-xl transition-colors flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/store/orders" className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all hover:border-amber-400 group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Orders &amp; History</span>
            <Package className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">12</div>
          <div className="text-[11px] text-slate-400 mt-0.5">View all consignments &rarr;</div>
        </Link>

        <Link to="/store/returns" className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all hover:border-amber-400 group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Returns &amp; RAG Policy</span>
            <RotateCcw className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">2</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Check eligibility &rarr;</div>
        </Link>

        <Link to="/store/complaints" className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all hover:border-amber-400 group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Support Tickets</span>
            <LifeBuoy className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">3</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Track resolution &rarr;</div>
        </Link>

        <Link to="/store/notifications" className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all hover:border-amber-400 group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Notifications</span>
            <Bell className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{notifications.length}</div>
          <div className="text-[11px] text-amber-600 font-bold mt-0.5">{unreadCount} unread messages &rarr;</div>
        </Link>
      </div>

      {/* Saved Address Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" />
            <span>Default Delivery Address in India</span>
          </h3>
          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
            Primary Hub: W03 Coimbatore
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="font-bold text-slate-900 text-sm">{savedAddress.name}</div>
          <div className="text-slate-700">{savedAddress.address}</div>
          <div className="text-slate-700">{savedAddress.city}, {savedAddress.state} - {savedAddress.pincode}</div>
          <div className="text-slate-500 font-mono pt-1">Phone: {savedAddress.phone}</div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfile;
