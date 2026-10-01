import React, { useState, useEffect } from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle, Shield, PlusCircle, Clock, RefreshCw } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const Incidents: React.FC = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Status Update Modal
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [resolutionText, setResolutionText] = useState('');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/incidents', {
        params: { status: statusFilter || undefined }
      });
      setIncidents(res.data);
    } catch (e) {
      console.error('Failed to load incidents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter]);

  const handleUpdateIncident = async () => {
    if (!selectedIncident) return;

    try {
      await api.patch(`/incidents/${selectedIncident.id}`, {
        status: newStatus,
        resolution: resolutionText || selectedIncident.resolution
      });
      alert(`Incident ${selectedIncident.incident_number} updated to ${newStatus}. Audit log created.`);
      setSelectedIncident(null);
      fetchIncidents();
    } catch (err: any) {
      alert('Failed to update incident: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            <span>Operational Incident Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated operational failure detection, blast radius tracking, and remediation workflows.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="">All Statuses (Open, Investigating, Mitigated, Resolved)</option>
          <option value="Open">Open</option>
          <option value="Investigating">Investigating</option>
          <option value="Mitigated">Mitigated</option>
          <option value="Resolved">Resolved</option>
        </select>
        <span className="text-xs font-mono text-slate-400">
          Total Incidents: <span className="text-white font-bold">{incidents.length}</span>
        </span>
      </div>

      {/* Incident Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading incidents...</div>
        ) : (
          incidents.map((inc) => {
            const isCrit = inc.severity === 'high' || inc.severity === 'critical';
            return (
              <div
                key={inc.id}
                className={`glass-panel p-5 rounded-2xl border transition space-y-3 ${
                  inc.status !== 'Resolved'
                    ? isCrit
                      ? 'border-rose-500/50 bg-rose-500/5'
                      : 'border-amber-500/50 bg-amber-500/5'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-bold text-white">{inc.incident_number}</span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase ${
                        isCrit ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {inc.severity} Severity
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Service: {inc.service}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase font-mono ${
                        inc.status === 'Open'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : inc.status === 'Mitigated'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : inc.status === 'Resolved'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {inc.status}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedIncident(inc);
                        setNewStatus(inc.status);
                        setResolutionText(inc.resolution || '');
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                    >
                      Update
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{inc.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{inc.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                  <div>
                    <span className="font-semibold text-slate-300 block">Root Cause:</span>
                    <span className="text-[11px] text-slate-300">{inc.root_cause || 'Under investigation by AI agent'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-300 block">Remediation / Resolution:</span>
                    <span className="text-[11px] text-slate-300">{inc.resolution || 'Pending execution of proposed action'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span>Affected Records: {inc.affected_records_count} orders/SKUs</span>
                  <span>Reported: {new Date(inc.created_at).toLocaleString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Incident Status Update Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Update Incident Status & Resolution</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Open">Open</option>
                  <option value="Investigating">Investigating</option>
                  <option value="Mitigated">Mitigated</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Remediation Details</label>
                <textarea
                  rows={3}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none"
                  placeholder="Steps taken to mitigate or resolve..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateIncident}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Save & Record Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
