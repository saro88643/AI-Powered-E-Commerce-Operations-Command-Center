import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  GitFork,
  Users,
  Shield,
  Layers,
  Building2,
  ChevronDown,
  ChevronRight,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  UserPlus,
  RefreshCw,
  Phone,
  Mail,
  UserCheck,
  Briefcase,
  X
} from 'lucide-react';

interface EmployeeNode {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone?: string;
  status: string;
  pending_tickets?: number;
}

interface TeamLeadNode extends EmployeeNode {
  employees: EmployeeNode[];
}

interface DepartmentNode {
  id: string;
  name: string;
  code: string;
  description: string;
  head_officer_name: string;
  head_officer_email: string;
  sla_hours: number;
  status: string;
  active_complaints: number;
  manager: EmployeeNode;
  hrs: EmployeeNode[];
  teamLeads: TeamLeadNode[];
  unassignedEmployees: EmployeeNode[];
  totalStaff: number;
}

interface OrgChartData {
  id: string;
  companyName: string;
  executives: EmployeeNode[];
  departments: DepartmentNode[];
  totalEmployees: number;
  totalDepartments: number;
}

export const OrgHierarchy: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<OrgChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});

  // Modals
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Forms
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    description: '',
    headOfficerName: '',
    headOfficerEmail: '',
    slaHours: 12
  });

  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    password: 'password123',
    role: 'Employee',
    departmentId: '',
    departmentName: '',
    managerId: '',
    teamLeadId: '',
    phone: ''
  });

  const [hierarchyOptions, setHierarchyOptions] = useState<{
    managers: any[];
    teamLeads: any[];
    departments: any[];
  }>({ managers: [], teamLeads: [], departments: [] });

  const fetchOrgChart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/departments/org-chart');
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load organization hierarchy');
    } finally {
      setLoading(false);
    }
  };

  const fetchHierarchyOptions = async () => {
    try {
      const res = await api.get('/auth/hierarchy-users');
      setHierarchyOptions(res.data);
      if (res.data.departments.length > 0 && !userForm.departmentId) {
        setUserForm(prev => ({
          ...prev,
          departmentId: res.data.departments[0].id,
          departmentName: res.data.departments[0].name
        }));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchOrgChart();
    fetchHierarchyOptions();
  }, []);

  const toggleDept = (deptId: string) => {
    setCollapsedDepts(prev => ({ ...prev, [deptId]: !prev[deptId] }));
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/departments', deptForm);
      setIsDeptModalOpen(false);
      setDeptForm({ name: '', code: '', description: '', headOfficerName: '', headOfficerEmail: '', slaHours: 12 });
      fetchOrgChart();
      fetchHierarchyOptions();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create department');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/users', userForm);
      setIsUserModalOpen(false);
      setUserForm({
        fullName: '',
        email: '',
        password: 'password123',
        role: 'Employee',
        departmentId: hierarchyOptions.departments[0]?.id || '',
        departmentName: hierarchyOptions.departments[0]?.name || '',
        managerId: '',
        teamLeadId: '',
        phone: ''
      });
      fetchOrgChart();
      fetchHierarchyOptions();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create employee');
    }
  };

  const filteredDepartments = (data?.departments || []).filter(dept => {
    if (selectedDeptFilter !== 'ALL' && dept.id !== selectedDeptFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchDept = dept.name.toLowerCase().includes(q) || dept.code.toLowerCase().includes(q);
    const matchMgr = dept.manager?.full_name?.toLowerCase().includes(q);
    const matchStaff = dept.teamLeads.some(tl =>
      tl.full_name.toLowerCase().includes(q) || tl.employees.some(e => e.full_name.toLowerCase().includes(q))
    );
    return matchDept || matchMgr || matchStaff;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/20">
              <GitFork className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Organizational Hierarchy & Structure
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-mono">
                  Manager & Senior View
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Multi-stage enterprise reporting tree: Overall Leadership → Departments → Department Managers → HR & Team Leads → Employees
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons for Admin */}
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOrgChart}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh Structure"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {(user?.role === 'Admin' || user?.role === 'Overall Manager') && (
            <>
              <button
                onClick={() => setIsDeptModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition"
              >
                <Building2 className="w-4 h-4 text-brand-400" />
                <span>Add Department</span>
              </button>
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-brand-500/20 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Staff Member</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-brand-400" /> Total Departments
          </p>
          <p className="text-2xl font-bold text-white mt-1">{data?.totalDepartments || 6}</p>
          <span className="text-[11px] text-slate-400">All functional operational units</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" /> Total Active Staff
          </p>
          <p className="text-2xl font-bold text-white mt-1">{data?.totalEmployees || 18}</p>
          <span className="text-[11px] text-slate-400">Managers, Leads, HR & Employees</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Active Department Alerts
          </p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {(data?.departments || []).reduce((acc, d) => acc + (parseInt(d.active_complaints as any) || 0), 0)}
          </p>
          <span className="text-[11px] text-slate-400">Under investigation by officers</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" /> Scoped Privacy Gate
          </p>
          <p className="text-xs font-bold text-emerald-400 mt-2">TL & Manager Scoped</p>
          <span className="text-[11px] text-slate-400">Employee grievances strictly protected</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by department name, manager, team lead, or employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <select
          value={selectedDeptFilter}
          onChange={(e) => setSelectedDeptFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
        >
          <option value="ALL">All Departments ({data?.departments.length || 0})</option>
          {data?.departments.map(d => (
            <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="p-12 text-center text-slate-400 font-mono text-xs">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Mapping Company Hierarchy & Operational Lines...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* STAGE 1: EXECUTIVE & OVERALL MANAGEMENT ROOT */}
      {data && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/40 border border-indigo-800/40 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-indigo-900/40 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                    Executive Operational Leadership
                  </span>
                  <h2 className="text-lg font-bold text-white">Overall VP Operations & Command</h2>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 self-start sm:self-auto">
                Level 1: Overall Manager Authority
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {data.executives.map(exec => (
                <div
                  key={exec.id}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-900/50 flex items-center space-x-3 hover:border-indigo-600 transition"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-brand-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {exec.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">{exec.full_name}</p>
                    <p className="text-[10px] text-indigo-300 font-medium truncate">{exec.role}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{exec.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CONNECTOR LINE */}
          <div className="flex justify-center -my-3">
            <div className="w-0.5 h-6 bg-indigo-500/40" />
          </div>

          {/* STAGE 2: FUNCTIONAL DEPARTMENTS & SQUADS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-400" />
                Company Operational Departments & Squads
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Showing {filteredDepartments.length} of {data.departments.length} units
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {filteredDepartments.map((dept) => {
                const isCollapsed = collapsedDepts[dept.id];
                const hasAlerts = (parseInt(dept.active_complaints as any) || 0) > 0;

                return (
                  <div
                    key={dept.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      hasAlerts
                        ? 'bg-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-950/10'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Department Header Card */}
                    <div
                      onClick={() => toggleDept(dept.id)}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition select-none"
                    >
                      <div className="flex items-start space-x-3.5">
                        <div className="mt-1">
                          {isCollapsed ? (
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-brand-400" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2.5">
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-semibold">
                              {dept.code}
                            </span>
                            <h3 className="text-base font-bold text-white">{dept.name}</h3>
                            {hasAlerts && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {dept.active_complaints} Active Alert
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 max-w-2xl">{dept.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 pl-8 md:pl-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-mono block">SLA Target</span>
                          <span className="text-xs font-bold text-slate-200 flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3 text-brand-400" /> {dept.sla_hours}h Turnaround
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-mono block">Team Size</span>
                          <span className="text-xs font-bold text-slate-200">
                            {dept.totalStaff} Members
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Department Inner Tree (Managers -> Leads -> Employees) */}
                    {!isCollapsed && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-800/70 bg-slate-950/40 space-y-4">
                        {/* Level 2: Department Manager & HR */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          {/* Manager Card */}
                          <div className="p-3.5 rounded-xl bg-slate-900 border border-brand-900/40 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-300 font-bold text-xs">
                                MGR
                              </div>
                              <div>
                                <span className="text-[9px] font-mono uppercase tracking-wider text-brand-400 block font-bold">
                                  Department Manager
                                </span>
                                <p className="text-xs font-bold text-white">{dept.manager?.full_name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{dept.manager?.email}</p>
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 font-mono">
                              Escalation Officer
                            </span>
                          </div>

                          {/* HR Partner Card */}
                          <div className="p-3.5 rounded-xl bg-slate-900 border border-purple-900/40 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                                HR
                              </div>
                              <div>
                                <span className="text-[9px] font-mono uppercase tracking-wider text-purple-400 block font-bold">
                                  Human Resources Partner
                                </span>
                                <p className="text-xs font-bold text-white">
                                  {dept.hrs.length > 0 ? dept.hrs[0].full_name : 'Elena Rostova (Central HR)'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {dept.hrs.length > 0 ? dept.hrs[0].email : 'hr.lead@shopsphere.com'}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono">
                              Welfare & Ethics
                            </span>
                          </div>
                        </div>

                        {/* Level 3: Team Leads and Their Respective Employees */}
                        <div className="space-y-3 pt-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                            Operational Squads & Assigned Employees:
                          </span>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {dept.teamLeads.map((tl) => (
                              <div
                                key={tl.id}
                                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3"
                              >
                                {/* Team Lead Header */}
                                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                                  <div className="flex items-center space-x-2.5">
                                    <div className="w-7 h-7 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-xs">
                                      TL
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-white">{tl.full_name}</p>
                                      <p className="text-[10px] text-amber-400/90 font-mono">{tl.email}</p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                                    Team Lead
                                  </span>
                                </div>

                                {/* Employees assigned under this TL */}
                                <div className="space-y-1.5 pl-2 border-l-2 border-indigo-500/30">
                                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                                    Assigned Employees ({tl.employees.length}):
                                  </span>

                                  {tl.employees.length === 0 ? (
                                    <p className="text-[11px] text-slate-400 italic">No employees assigned to this lead yet.</p>
                                  ) : (
                                    tl.employees.map((emp) => (
                                      <div
                                        key={emp.id}
                                        className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center justify-between hover:border-slate-700 transition"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <div className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold text-slate-300">
                                            {emp.full_name.charAt(0)}
                                          </div>
                                          <div>
                                            <p className="text-[11px] font-semibold text-slate-200">{emp.full_name}</p>
                                            <p className="text-[9px] text-slate-400 font-mono">{emp.email}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                            Grievances scoped to TL & Mgr
                                          </span>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            ))}

                            {dept.teamLeads.length === 0 && (
                              <div className="p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center col-span-2 text-xs text-slate-400">
                                No team leads configured for this department yet. Admins can assign leads using the "Add Staff Member" button.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CREATE DEPARTMENT MODAL */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-400" /> Create New Department
              </h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDept} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quality Assurance & Returns"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. QA"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white uppercase"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Target SLA (Hours) *</label>
                  <input
                    type="number"
                    min="1"
                    max="72"
                    required
                    value={deptForm.slaHours}
                    onChange={(e) => setDeptForm({ ...deptForm, slaHours: parseInt(e.target.value) || 12 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Designated Head Officer Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={deptForm.headOfficerName}
                  onChange={(e) => setDeptForm({ ...deptForm, headOfficerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Officer Email</label>
                <input
                  type="email"
                  placeholder="e.g. officer@shopsphere.com"
                  value={deptForm.headOfficerEmail}
                  onChange={(e) => setDeptForm({ ...deptForm, headOfficerEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of department scope and responsibilities..."
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EMPLOYEE & HIERARCHY ASSIGNMENT MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand-400" /> Provision Staff Member into Hierarchy
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={userForm.fullName}
                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Email / Login ID *</label>
                  <input
                    type="email"
                    required
                    placeholder="priya@shopsphere.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Role *</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="Department Manager">Department Manager</option>
                    <option value="HR">HR Officer</option>
                    <option value="Team Lead">Team Lead</option>
                    <option value="Employee">Employee (Operator)</option>
                    <option value="Overall Manager">Overall Manager</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Department *</label>
                  <select
                    value={userForm.departmentId}
                    onChange={(e) => {
                      const d = hierarchyOptions.departments.find(dept => dept.id === e.target.value);
                      setUserForm({ ...userForm, departmentId: e.target.value, departmentName: d ? d.name : '' });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    {hierarchyOptions.departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reporting Lines */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block font-bold">
                  Reporting Hierarchy & Scoping Lines:
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Reporting Manager</label>
                    <select
                      value={userForm.managerId}
                      onChange={(e) => setUserForm({ ...userForm, managerId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    >
                      <option value="">None (Self-governing)</option>
                      {hierarchyOptions.managers.map(m => (
                        <option key={m.id} value={m.id}>{m.full_name} ({m.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Assigned Team Lead</label>
                    <select
                      value={userForm.teamLeadId}
                      onChange={(e) => setUserForm({ ...userForm, teamLeadId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    >
                      <option value="">None / Direct to Manager</option>
                      {hierarchyOptions.teamLeads.map(tl => (
                        <option key={tl.id} value={tl.id}>{tl.full_name} ({tl.department_name || 'Team Lead'})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Note: If this staff member files an internal grievance, it will be visible exclusively to their designated Team Lead and Manager.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                >
                  Provision Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgHierarchy;
