import React, { useState, useEffect } from 'react';
import { X, AlertCircle, AlertTriangle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      api.get('/system/notifications').then((res) => {
        setNotifications(res.data);
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-semibold text-white">Operational Alerts</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono">
              {notifications.length} Active
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.map((n) => {
            const isCrit = n.type === 'critical';
            const isWarn = n.type === 'warning';
            return (
              <div
                key={n.id}
                className={`p-3 rounded-xl border transition ${
                  isCrit
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : isWarn
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-800/40 border-slate-700/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {isCrit ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    ) : isWarn ? (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Info className="w-4 h-4 text-indigo-400" />
                    )}
                    <h4 className="text-sm font-semibold text-white">{n.title}</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Just now</span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{n.message}</p>
                {n.actionRoute && (
                  <button
                    onClick={() => {
                      navigate(n.actionRoute);
                      onClose();
                    }}
                    className="mt-3 text-xs flex items-center font-medium text-brand-400 hover:text-brand-300 transition"
                  >
                    <span>{n.actionLabel || 'Investigate Record'}</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
