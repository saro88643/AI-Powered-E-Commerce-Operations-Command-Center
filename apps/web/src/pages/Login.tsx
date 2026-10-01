import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Cpu,
  UserCheck,
  Eye,
  EyeOff,
  Shield,
  KeyRound
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials or backend unreachable.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (presetEmail: string, roleName: string) => {
    setEmail(presetEmail);
    setPassword('password123');
    setLoading(true);
    setError(null);
    try {
      await login(presetEmail, 'password123');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(`Failed to sign in as ${roleName}: ` + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient glow backgrounds */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            Shop<span className="text-indigo-400">Sphere</span>
          </span>
        </div>
        <h2 className="mt-3 text-center text-sm font-semibold uppercase tracking-widest text-indigo-400">
          AI Operations Command Center
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Enterprise Multi-Channel Operations, Real-Time Investigation & FDE Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl py-8 px-6 sm:px-10 shadow-2xl backdrop-blur-xl">
          {/* Company Policy Notice */}
          <div className="mb-6 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
            <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-400 leading-relaxed">
              <span className="text-white font-semibold">Company Admin Governance:</span> Public self-registration is disabled. All operator accounts, Gmail IDs, assigned roles, and password credentials are provisioned exclusively by the <span className="text-purple-300 font-semibold">Company Admin</span> via the internal Administration page.
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address or Gmail ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@shopsphere.com or your.name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your assigned password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating Session...' : 'Authenticate & Enter Command Center'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Role Login Presets */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> Demo Role Presets (1-Click Login)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Password: password123</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('admin@shopsphere.com', 'Admin')}
                className="p-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-purple-800/60 text-left transition group"
              >
                <div className="text-xs font-bold text-purple-300 group-hover:text-purple-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Company Admin
                </div>
                <div className="text-[10px] text-slate-400">Full System & Users</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('ops@shopsphere.com', 'Operations Manager')}
                className="p-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-left transition group"
              >
                <div className="text-xs font-bold text-white group-hover:text-indigo-300">Ops Manager</div>
                <div className="text-[10px] text-slate-400">Transfers & Orders</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('warehouse@shopsphere.com', 'Warehouse Manager')}
                className="p-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-left transition group"
              >
                <div className="text-xs font-bold text-white group-hover:text-indigo-300">Warehouse Lead</div>
                <div className="text-[10px] text-slate-400">Inventory & Restock</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('support@shopsphere.com', 'Support Agent')}
                className="p-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-left transition group"
              >
                <div className="text-xs font-bold text-white group-hover:text-indigo-300">Support Agent</div>
                <div className="text-[10px] text-slate-400">Tickets & Refunds</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('analyst@shopsphere.com', 'Analyst')}
                className="p-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-left transition group"
              >
                <div className="text-xs font-bold text-white group-hover:text-indigo-300">Analyst</div>
                <div className="text-[10px] text-slate-400">RCA & BI Reports</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('viewer@shopsphere.com', 'Viewer')}
                className="p-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-left transition group"
              >
                <div className="text-xs font-bold text-white group-hover:text-indigo-300">Viewer</div>
                <div className="text-[10px] text-slate-400">Read-Only Audit</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
