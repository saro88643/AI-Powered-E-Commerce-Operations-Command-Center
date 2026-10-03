import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Package,
  RotateCcw,
  Sparkles,
  Zap,
  Check
} from 'lucide-react';

export const StoreNotifications: React.FC = () => {
  const { notifications, unreadCount, markNotificationRead, refreshNotifications } = useStore();

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'ORDER_PLACED':
        return <Package className="w-5 h-5 text-indigo-500" />;
      case 'DELIVERY_DELAYED':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'AI_REMEDIATION_RESOLVED':
        return <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />;
      case 'RETURN_REQUESTED':
        return <RotateCcw className="w-5 h-5 text-sky-500" />;
      default:
        return <Bell className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" />
            <span>Customer Notifications Inbox</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time delivery advisories, payment confirmations, and AI operational updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow">
            {unreadCount} Unread
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          No notifications in your inbox.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                !n.read
                  ? 'bg-amber-50/60 border-amber-300 shadow-sm'
                  : 'bg-white border-slate-200 opacity-90'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm flex-shrink-0">
                {getNotifIcon(n.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(n.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>

                {n.order_number && (
                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      to={`/store/orders/${n.order_number}`}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      Track Consignment #{n.order_number} &rarr;
                    </Link>
                  </div>
                )}
              </div>

              {!n.read && (
                <button
                  onClick={() => markNotificationRead(n.id)}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoreNotifications;
