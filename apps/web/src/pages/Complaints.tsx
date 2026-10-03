import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Send,
  Eye,
  UserCheck,
  Building2,
  Phone,
  Mail,
  ChevronRight,
  ExternalLink,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

interface ComplaintItem {
  id: string;
  ticket_number: string;
  type: string;
  title: string;
  description: string;
  department_id: string;
  department_name: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  submitted_by_name: string;
  submitted_by_email: string;
  submitted_by_role: string;
  employee_id?: string;
  team_lead_id?: string;
  manager_id?: string;
  client_id?: string;
  order_id?: string;
  order_number?: string;
  product_id?: string;
  assigned_officer_name?: string;
  assigned_officer_email?: string;
  alert_sent: boolean;
  alert_time?: string;
  resolution_notes?: string;
  resolution_action?: string;
  resolved_at?: string;
  created_at: string;
}

interface TimelineItem {
  id: string;
  complaint_id: string;
  action: string;
  message: string;
  actor_name: string;
  actor_role: string;
  timestamp: string;
}

// Play audio alert chime using Web Audio API
function playAlertChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    
    // Two-tone bell
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.15); // D5
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // Audio context may require user gesture
  }
}

export const Complaints: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Action on selected complaint
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionAction, setResolutionAction] = useState('OFFICER_REMEDIATION_CONFIRMED');
  const [timelineNote, setTimelineNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // New Complaint Form
  const [newForm, setNewForm] = useState({
    type: 'CLIENT_COMPLAINT',
    title: '',
    description: '',
    category: 'DELIVERY_DELAY',
    severity: 'HIGH',
    orderNumber: '',
    departmentId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes, alertsRes] = await Promise.all([
        api.get('/complaints', {
          params: {
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            departmentId: deptFilter !== 'ALL' ? deptFilter : undefined,
            severity: severityFilter !== 'ALL' ? severityFilter : undefined,
            type: typeFilter !== 'ALL' ? typeFilter : undefined,
            search: search || undefined
          }
        }),
        api.get('/complaints/stats'),
        api.get('/complaints/live-alerts')
      ]);

      setComplaints(listRes.data.complaints || []);
      setStats(statsRes.data);
      setLiveAlerts(alertsRes.data.alerts || []);

      if (alertsRes.data.alerts?.length > 0 && soundEnabled) {
        playAlertChime();
      }
    } catch (err: any) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 12000); // Polling every 12 seconds
    return () => clearInterval(interval);
  }, [statusFilter, deptFilter, severityFilter, typeFilter, search]);

  const openDetail = async (c: ComplaintItem) => {
    setSelectedComplaint(c);
    setNewStatus(c.status);
    setResolutionNotes(c.resolution_notes || '');
    setIsDetailOpen(true);
    try {
      const res = await api.get(`/complaints/${c.id}`);
      setSelectedComplaint(res.data.complaint);
      setTimeline(res.data.timeline || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedComplaint) return;
    setActionLoading(true);
    try {
      await api.put(`/complaints/${selectedComplaint.id}/status`, {
        status: newStatus,
        resolutionNotes,
        resolutionAction: newStatus === 'RESOLVED' ? resolutionAction : undefined
      });
      await openDetail(selectedComplaint);
      fetchData();
      alert(`Complaint ${selectedComplaint.ticket_number} updated to ${newStatus}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddTimelineNote = async () => {
    if (!selectedComplaint || !timelineNote.trim()) return;
    try {
      await api.post(`/complaints/${selectedComplaint.id}/timeline`, {
        message: timelineNote
      });
      setTimelineNote('');
      const res = await api.get(`/complaints/${selectedComplaint.id}`);
      setTimeline(res.data.timeline || []);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add note');
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/complaints', newForm);
      setIsNewModalOpen(false);
      setNewForm({
        type: 'CLIENT_COMPLAINT',
        title: '',
        description: '',
        category: 'DELIVERY_DELAY',
        severity: 'HIGH',
        orderNumber: '',
        departmentId: ''
      });
      fetchData();
      if (soundEnabled) playAlertChime();
      alert(`Complaint Registered! Alert dispatched immediately to: ${res.data.complaint?.assignedOfficerName}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to file complaint');
    }
  };

  const severityColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default: return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  const statusColor = (st: string) => {
    switch (st) {
      case 'RESOLVED': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'OFFICER_ALERTED': return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      case 'INVESTIGATING': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'IN_PROGRESS': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Recharts Chart Colors
  const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#8b5cf6'];

  const statusData = stats?.statusCounts ? [
    { name: 'Officer Alerted', value: parseInt(stats.statusCounts.alerted) || 0, color: '#f43f5e' },
    { name: 'Investigating', value: parseInt(stats.statusCounts.investigating) || 0, color: '#6366f1' },
    { name: 'In Progress', value: parseInt(stats.statusCounts.in_progress) || 0, color: '#f59e0b' },
    { name: 'Resolved', value: parseInt(stats.statusCounts.resolved) || 0, color: '#10b981' }
  ] : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* REAL-TIME OFFICER ALERT BANNER */}
      {liveAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/60 border border-rose-500/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 animate-bounce">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 font-bold uppercase tracking-wider">
                  ⚠️ Live Officer Alert Detected
                </span>
                <span className="text-xs text-rose-300 font-mono">
                  ({liveAlerts.length} urgent ticket{liveAlerts.length > 1 ? 's' : ''})
                </span>
              </div>
              <p className="text-sm font-semibold text-white mt-0.5">
                {liveAlerts[0]?.title}
              </p>
              <p className="text-xs text-slate-300">
                Routed to: <span className="font-bold text-amber-300">{liveAlerts[0]?.assigned_officer_name || liveAlerts[0]?.department_name}</span> • Dispatched {new Date(liveAlerts[0]?.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              onClick={() => {
                const target = complaints.find(c => c.id === liveAlerts[0]?.id);
                if (target) openDetail(target);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition flex items-center gap-1.5"
            >
              <span>Acknowledge & Investigate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Alert Chime' : 'Unmute Alert Chime'}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-brand-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Operational Complaints & Grievance Desk
              </h1>
              <p className="text-sm text-slate-400">
                Live multi-department ticket routing, immediate officer alerts, scoped privacy, and senior analytics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh Complaints"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Lodge Complaint / Grievance</span>
          </button>
        </div>
      </div>

      {/* SENIOR MANAGEMENT ANALYTICS CHARTS */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Department Breakdown Bar Chart */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-brand-400" /> Department Complaint Load & Resolution
                </h3>
                <p className="text-xs text-slate-400">Comparison of total complaints vs resolved tickets per department</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-300">
                Senior Executive View
              </span>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.departmentBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="department_code" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="total_complaints" name="Total Tickets" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved_complaints" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="critical_count" name="Critical" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Breakdown Donut Chart */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> Status Pipeline Distribution
              </h3>
              <p className="text-xs text-slate-400">Real-time status of all active and closed tickets</p>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* FILTERS & SEARCH ROW */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket #, order ID, customer name, keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Types</option>
            <option value="CLIENT_COMPLAINT">Client Complaints</option>
            <option value="EMPLOYEE_GRIEVANCE">Employee Grievances</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Departments</option>
            <option value="dept-deliv">Delivery & Logistics</option>
            <option value="dept-prod">Product & Catalog</option>
            <option value="dept-supp">Support & Customer</option>
            <option value="dept-wh">Warehousing</option>
            <option value="dept-fin">Payments & Billing</option>
            <option value="dept-hr">Human Resources</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OFFICER_ALERTED">Officer Alerted</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>
        </div>
      </div>

      {/* COMPLAINTS HISTORY TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-white">Department Complaint History</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {complaints.length} records
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Active User Scope: <strong className="text-brand-300">{user?.role}</strong> ({user?.fullName})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Ticket / Type</th>
                <th className="py-3 px-4">Subject & Description</th>
                <th className="py-3 px-4">Department & Officer</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Loading scoped complaint history...
                  </td>
                </tr>
              )}

              {!loading && complaints.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No complaints found matching the current criteria or user permissions.
                  </td>
                </tr>
              )}

              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono">
                    <p className="font-bold text-white">{c.ticket_number}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                      c.type === 'CLIENT_COMPLAINT' ? 'bg-indigo-500/10 text-indigo-300' : 'bg-purple-500/10 text-purple-300'
                    }`}>
                      {c.type === 'CLIENT_COMPLAINT' ? 'Commercial Client' : 'Internal Grievance'}
                    </span>
                  </td>

                  <td className="py-3 px-4 max-w-xs">
                    <p className="font-semibold text-slate-200 truncate">{c.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{c.description}</p>
                    {c.order_number && (
                      <span className="text-[9px] font-mono text-brand-400 block mt-0.5">
                        Order: {c.order_number}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-200">{c.department_name}</p>
                    <p className="text-[10px] text-amber-300 font-mono truncate">
                      {c.assigned_officer_name || 'Designated Lead'}
                    </p>
                  </td>

                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityColor(c.severity)}`}>
                      {c.severity}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-200">{c.submitted_by_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{c.submitted_by_role}</p>
                  </td>

                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(c.created_at).toLocaleDateString()}
                    <span className="block text-[10px] text-slate-400">
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openDetail(c)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                    >
                      Inspect & Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPLAINT INVESTIGATION & RESOLUTION MODAL */}
      {isDetailOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-brand-400">
                      {selectedComplaint.ticket_number}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${severityColor(selectedComplaint.severity)}`}>
                      {selectedComplaint.severity}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusColor(selectedComplaint.status)}`}>
                      {selectedComplaint.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{selectedComplaint.title}</h3>
                </div>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Officer Alert & Detection Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-brand-400 uppercase tracking-wider block font-bold">
                  Officer Detection & Alert Status:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Assigned Officer</span>
                    <span className="font-bold text-amber-300">{selectedComplaint.assigned_officer_name || 'Designated Lead'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Department</span>
                    <span className="font-bold text-slate-200">{selectedComplaint.department_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Alert Broadcast</span>
                    <span className="font-mono text-emerald-400 font-bold">DISPATCHED</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Linked Order</span>
                    <span className="font-mono text-slate-200">{selectedComplaint.order_number || 'N/A'}</span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-300 border-t border-slate-900">
                  <p className="font-semibold text-slate-400 text-[10px] uppercase font-mono">Original Issue Description:</p>
                  <p className="mt-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">{selectedComplaint.description}</p>
                </div>
              </div>

              {/* TIMELINE OF EVENTS */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-400" /> Investigation & Action Timeline:
                </h4>

                <div className="space-y-2 relative pl-4 border-l-2 border-slate-800 ml-2">
                  {timeline.map((item) => (
                    <div key={item.id} className="relative group">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-500 absolute -left-[21px] top-1.5 ring-4 ring-slate-900" />
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-brand-300">
                            {item.action}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200">{item.message}</p>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          By: {item.actor_name} ({item.actor_role})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Timeline Note */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add an officer note or investigation update..."
                    value={timelineNote}
                    onChange={(e) => setTimelineNote(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                  <button
                    onClick={handleAddTimelineNote}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Note</span>
                  </button>
                </div>
              </div>

              {/* OFFICER RESOLUTION ACTIONS */}
              <div className="p-4 rounded-xl bg-slate-950 border border-brand-900/40 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-400 font-bold block">
                  Officer Remediation & Resolution Controls:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Update Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    >
                      <option value="OFFICER_ALERTED">Officer Alerted</option>
                      <option value="INVESTIGATING">Under Investigation</option>
                      <option value="IN_PROGRESS">Remediation In Progress</option>
                      <option value="RESOLVED">Mark as Resolved & Close</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Remediation Action Type</label>
                    <select
                      value={resolutionAction}
                      onChange={(e) => setResolutionAction(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    >
                      <option value="EXPRESS_REROUTE_DISPATCH">Express Courier Reroute from Hub</option>
                      <option value="INVENTORY_REALLOCATION">Cross-Warehouse Stock Reallocation</option>
                      <option value="CUSTOMER_GOODWILL_CREDIT">Customer Goodwill Credit / Refund</option>
                      <option value="HARDWARE_REPLACEMENT">Warehouse Hardware Replacement</option>
                      <option value="PROCESS_CORRECTED">Operational Process Corrected</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Resolution Summary / Root Cause Finding</label>
                  <textarea
                    rows={2}
                    placeholder="Document root-cause findings and corrective actions taken for audit trail..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleUpdateStatus}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20"
                  >
                    {actionLoading ? 'Saving...' : 'Apply Status & Commit Resolution'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LODGE COMPLAINT MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-400" /> Lodge Operational Complaint / Grievance
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Complaint Type *</label>
                <select
                  value={newForm.type}
                  onChange={(e) => setNewForm({ ...newForm, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="CLIENT_COMPLAINT">Commercial Client Complaint (Order/Service)</option>
                  <option value="EMPLOYEE_GRIEVANCE">Internal Employee Grievance (Workplace/Tooling)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Issue Category *</label>
                <select
                  value={newForm.category}
                  onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="DELIVERY_DELAY">Delivery & Transit Delay (Routes to Delivery Dept)</option>
                  <option value="DAMAGED_PRODUCT">Damaged / Broken Product (Routes to Product Dept)</option>
                  <option value="WRONG_ITEM">Wrong SKU / Item Shipped (Routes to Warehousing)</option>
                  <option value="BILLING_DISPUTE">Billing or GST Invoice Discrepancy (Routes to Finance)</option>
                  <option value="WORKPLACE_EQUIPMENT">Workplace Equipment / System Failure (Routes to TL & Mgr)</option>
                  <option value="GENERAL_SERVICE">General Operational Grievance</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Complaint Subject / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Consignment delayed by 48 hours in Coimbatore Hub"
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Severity *</label>
                  <select
                    value={newForm.severity}
                    onChange={(e) => setNewForm({ ...newForm, severity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="CRITICAL">Critical (Immediate Alert)</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Order # (If applicable)</label>
                  <input
                    type="text"
                    placeholder="e.g. ORD-2026-9041"
                    value={newForm.orderNumber}
                    onChange={(e) => setNewForm({ ...newForm, orderNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the issue, affected items, and impact..."
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-[10px] text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>
                  The system will automatically detect the affected department and trigger an immediate live alert to the designated Officer!
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                >
                  Submit & Alert Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
