import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth, UserRole } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Lock,
  Mail,
  UserCheck,
  RefreshCw,
  X,
  ShieldAlert,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

interface CompanyUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Operations Manager' as UserRole
  });
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [newRole, setNewRole] = useState<UserRole>('Operations Manager');
  const [roleLoading, setRoleLoading] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const roleDefinitions: { role: UserRole; label: string; desc: string; color: string }[] = [
    {
      role: 'Admin',
      label: 'Company Admin',
      desc: 'Full administrative access, user provisioning, credential management, safety override.',
      color: 'bg-purple-950/80 text-purple-300 border-purple-800'
    },
    {
      role: 'Operations Manager',
      label: 'Operations Manager',
      desc: 'Order lifecycle management, cross-warehouse inventory transfers, incident mitigation.',
      color: 'bg-indigo-950/80 text-indigo-300 border-indigo-800'
    },
    {
      role: 'Warehouse Manager',
      label: 'Warehouse Manager',
      desc: 'Inventory reallocations, stock adjustments, fulfillment center intake and dispatch.',
      color: 'bg-amber-950/80 text-amber-300 border-amber-800'
    },
    {
      role: 'Support Agent',
      label: 'Support Lead / Agent',
      desc: 'Customer CRM access, support ticket resolutions, customer refund authorizations.',
      color: 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
    },
    {
      role: 'Analyst',
      label: 'Operations Analyst',
      desc: 'Full read visibility, AI operational RCA queries, analytics & business intelligence.',
      color: 'bg-blue-950/80 text-blue-300 border-blue-800'
    },
    {
      role: 'Viewer',
      label: 'Auditor / Viewer',
      desc: 'Strict read-only access for compliance and financial auditing; write actions blocked.',
      color: 'bg-slate-900 text-slate-400 border-slate-700'
    }
  ];

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.users || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load company user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'Admin') {
      fetchUsers();
    }
  }, [currentUser]);

  const showBanner = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  // Handlers
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/users', createForm);
      showBanner(`✓ Successfully provisioned account for ${res.data.user.email} (${res.data.user.role})`);
      setIsCreateModalOpen(false);
      setCreateForm({ fullName: '', email: '', password: '', role: 'Operations Manager' });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user account.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setPasswordLoading(true);
    setError(null);
    try {
      await api.put(`/auth/users/${selectedUser.id}/password`, { newPassword });
      showBanner(`✓ Password updated successfully for ${selectedUser.email}`);
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setRoleLoading(true);
    setError(null);
    try {
      await api.put(`/auth/users/${selectedUser.id}/role`, { role: newRole });
      showBanner(`✓ Role changed to ${newRole} for ${selectedUser.email}`);
      setIsRoleModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change role.');
    } finally {
      setRoleLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await api.delete(`/auth/users/${selectedUser.id}`);
      showBanner(`✓ User account ${selectedUser.email} has been deleted.`);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // If not admin, block with security screen
  if (currentUser?.role !== 'Admin') {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-8 bg-slate-900 border border-rose-900/60 rounded-2xl shadow-2xl text-center">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">Access Restricted — Company Admin Only</h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          The User Management portal is restricted to authorized Company Administrators. Public self-registration is disabled per corporate governance.
        </p>
        <div className="mt-6 p-3 bg-slate-950 rounded-lg text-xs font-mono text-slate-500">
          Your current session role: <span className="text-amber-400 font-semibold">{currentUser?.role || 'Unauthenticated'}</span>
        </div>
      </div>
    );
  }

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" /> Company Administration & Identity
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Operator Accounts & Access Control</h1>
          <p className="text-sm text-slate-400 mt-1">
            Company Admin exclusive portal: Provision new Gmail/company accounts, assign operational roles, and manage passwords.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            Provision New User
          </button>
        </div>
      </div>

      {/* Corporate Policy Notice */}
      <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-start gap-3">
        <Shield className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div className="text-xs text-purple-200 leading-relaxed">
          <span className="font-semibold text-white">Centralized Access Policy Enforced:</span> Public sign-ups are disabled. All operator credentials (Gmail IDs or corporate mail), role entitlements, and password updates are issued solely through this Administration page. Every credential modification generates an immutable audit record in the system log.
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-950/70 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="text-slate-400 text-xs">Total Provisioned Accounts</div>
          <div className="text-2xl font-bold text-white mt-1">{users.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active command center operators</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="text-slate-400 text-xs">Administrators</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">
            {users.filter((u) => u.role === 'Admin').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Privileged company governance</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="text-slate-400 text-xs">Operations & Warehousing</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">
            {users.filter((u) => u.role === 'Operations Manager' || u.role === 'Warehouse Manager').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Fulfillment & stock management</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="text-slate-400 text-xs">Support & Analysts</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">
            {users.filter((u) => u.role === 'Support Agent' || u.role === 'Analyst' || u.role === 'Viewer').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">CRM, analytics & audit</div>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email or Gmail ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500 transition"
            >
              <option value="ALL">All Roles ({users.length})</option>
              <option value="Admin">Admin</option>
              <option value="Operations Manager">Operations Manager</option>
              <option value="Warehouse Manager">Warehouse Manager</option>
              <option value="Support Agent">Support Agent</option>
              <option value="Analyst">Analyst</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Operator Name</th>
                <th className="px-4 py-3">Email / Gmail ID</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Permissions Scope</th>
                <th className="px-4 py-3">Provisioned Date</th>
                <th className="px-5 py-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No operator accounts match the specified criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleDef = roleDefinitions.find((r) => r.role === u.role);
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-purple-300">
                            {u.full_name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              {u.full_name}
                              {isCurrent && (
                                <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">{u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          {u.email}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            roleDef?.color || 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 max-w-xs truncate">
                        {roleDef?.desc || 'Operational rights'}
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Baseline'}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Change Role Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setNewRole(u.role);
                              setIsRoleModalOpen(true);
                            }}
                            title="Change Role"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Password Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setNewPassword('');
                              setIsPasswordModalOpen(true);
                            }}
                            title="Reset Password"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          {/* Delete User Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setIsDeleteModalOpen(true);
                            }}
                            disabled={isCurrent}
                            title={isCurrent ? 'Cannot delete self' : 'Delete Account'}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: PROVISION NEW USER                                    */}
      {/* ============================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-900/60 border border-purple-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Provision New Operator</h3>
                  <p className="text-xs text-slate-400">Issue corporate credentials and assign RBAC role</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Adams"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Email Address or Gmail ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. rachel.adams@gmail.com or ops@shopsphere.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Initial Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-9 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assign Operational Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition"
                >
                  {roleDefinitions.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.role} — {r.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {roleDefinitions.find((r) => r.role === createForm.role)?.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {createLoading ? 'Provisioning...' : 'Provision User Account'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: RESET / CHANGE PASSWORD                               */}
      {/* ============================================================== */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reset Account Password</h3>
                  <p className="text-xs text-slate-400">Admin override for {selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>User: <span className="text-white font-semibold">{selectedUser.full_name}</span></div>
                <div>Email: <span className="text-purple-300 font-mono">{selectedUser.email}</span></div>
                <div>Role: <span className="text-indigo-300 font-semibold">{selectedUser.role}</span></div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Enter New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-9 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition disabled:opacity-50"
                >
                  {passwordLoading ? 'Resetting Password...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: CHANGE ROLE                                           */}
      {/* ============================================================== */}
      {isRoleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-700 flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Change Account Role</h3>
                  <p className="text-xs text-slate-400">Modify authorization permissions</p>
                </div>
              </div>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangeRole} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>User: <span className="text-white font-semibold">{selectedUser.full_name}</span></div>
                <div>Email: <span className="text-purple-300 font-mono">{selectedUser.email}</span></div>
                <div>Current Role: <span className="text-indigo-400 font-bold">{selectedUser.role}</span></div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Select New Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  {roleDefinitions.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.role} — {r.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {roleDefinitions.find((r) => r.role === newRole)?.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition disabled:opacity-50"
                >
                  {roleLoading ? 'Updating Role...' : 'Save Role Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: DELETE CONFIRMATION                                   */}
      {/* ============================================================== */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-900/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-950/80 border border-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Operator Account</h3>
                <p className="text-xs text-rose-300 mt-0.5">This action permanently revokes all access.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg text-xs text-slate-300 space-y-1">
              <div>Are you sure you want to delete the account for:</div>
              <div className="font-semibold text-white">{selectedUser.full_name}</div>
              <div className="font-mono text-purple-300">{selectedUser.email}</div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Account Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminUsers;
