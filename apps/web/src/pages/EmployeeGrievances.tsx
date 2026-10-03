import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  ShieldCheck,
  AlertCircle,
  Clock,
  Send,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  Plus,
  HelpCircle,
  X
} from 'lucide-react';

export const EmployeeGrievances: React.FC = () => {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'WORKPLACE_EQUIPMENT',
    severity: 'MEDIUM'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchGrievances = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints', {
        params: { type: 'EMPLOYEE_GRIEVANCE' }
      });
      setGrievances(res.data.complaints || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/complaints', {
        type: 'EMPLOYEE_GRIEVANCE',
        ...form,
        departmentId: user?.departmentId || 'dept-deliv'
      });
      setIsModalOpen(false);
      setForm({
        title: '',
        description: '',
        category: 'WORKPLACE_EQUIPMENT',
        severity: 'MEDIUM'
      });
      fetchGrievances();
      alert('Your internal grievance has been registered. Only your assigned Team Lead and Department Manager will have access.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit grievance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Employee Grievances & Workplace Desk
              </h1>
              <p className="text-xs text-slate-400">
                Safe, confidential reporting channel for operations staff, drivers, and warehouse employees
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center space-x-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Internal Grievance</span>
        </button>
      </div>

      {/* Strict Privacy Guarantee Box */}
      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 flex items-start space-x-3.5">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-300">
          <p className="font-bold text-white">🔒 Scoped Chain-of-Command Confidentiality Rule</p>
          <p className="text-slate-300 leading-relaxed">
            By system policy, all grievances submitted by employees are strictly routed and visible <strong className="text-indigo-300">ONLY to your designated Team Lead</strong> and <strong className="text-indigo-300">Department Manager</strong>. Other operators and peer leads cannot inspect or access your submissions.
          </p>
        </div>
      </div>

      {/* Grievance History List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">My Submitted Grievances</h3>
          <button
            onClick={fetchGrievances}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading && (
          <div className="p-8 text-center text-slate-400 font-mono text-xs">
            Loading your grievance records...
          </div>
        )}

        {!loading && grievances.length === 0 && (
          <div className="p-10 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-2">
            <p className="text-xs text-slate-400">You have no active grievances recorded.</p>
            <p className="text-[11px] text-slate-400">
              Need assistance with shift scheduling, equipment failure, or workplace concerns? Click "Raise Internal Grievance".
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {grievances.map((g) => (
            <div
              key={g.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-purple-400">{g.ticket_number}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/20">
                      {g.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      g.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {g.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{g.title}</h4>
                </div>

                <span className="text-[11px] text-slate-400 font-mono self-start sm:self-auto">
                  Filed: {new Date(g.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{g.description}</p>

              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-400">
                  Assigned Supervisor: <strong className="text-amber-300">{g.assigned_officer_name || 'Your Team Lead'}</strong>
                </span>
                {g.resolution_notes ? (
                  <span className="text-emerald-300 font-semibold">
                    Resolution: {g.resolution_notes}
                  </span>
                ) : (
                  <span className="text-amber-400/80 italic font-mono text-[10px]">
                    Under review by your Team Lead & Manager
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: SUBMIT GRIEVANCE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" /> Raise Confidential Internal Grievance
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Issue Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="WORKPLACE_EQUIPMENT">Equipment Failure (Scanners, Conveyor, Pallet Jack)</option>
                  <option value="SHIFT_SCHEDULE">Shift Roster / Overtime Allocation</option>
                  <option value="LOGISTICS_ROUTE">Route Dispatch / Vehicle Condition</option>
                  <option value="TEAM_INTERACTION">Peer / Supervisor Escalation</option>
                  <option value="SAFETY_POLICY">Warehouse Safety / Ergonomics</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Subject / Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scanners on Aisle 4 constantly losing signal"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Detailed Explanation *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe what occurred, timing, and how it impacts your operations..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-[10px] text-purple-300">
                🔒 Protected Submission: Only your Team Lead and Department Manager will receive this notification.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                >
                  {submitting ? 'Submitting...' : 'Submit Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeGrievances;
