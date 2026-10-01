import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Bot, ShoppingCart, Users, Package,
  Layers, Warehouse, Truck, Headphones, RotateCcw,
  AlertOctagon, Cable, GitFork, Rocket, ShieldCheck,
  FileText, Activity, PlayCircle, Search, Bell,
  ChevronDown, Shield, LogOut, Check
} from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { SearchModal } from './SearchModal';
import { NotificationsDrawer } from './NotificationsDrawer';

export const AppLayout: React.FC = () => {
  const { user, switchRole, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'AI Command Center', path: '/ai', icon: Bot, highlight: true },
    { label: 'Demo Scenarios', path: '/scenarios', icon: PlayCircle, badge: 'Scenarios' },
    { divider: true, section: 'Fulfillment & Inventory' },
    { label: 'Orders', path: '/orders', icon: ShoppingCart },
    { label: 'Inventory', path: '/inventory', icon: Layers },
    { label: 'Warehouses', path: '/warehouses', icon: Warehouse },
    { label: 'Delivery Operations', path: '/delivery', icon: Truck },
    { divider: true, section: 'Catalog & Customer' },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Customers 360', path: '/customers', icon: Users },
    { label: 'Support Operations', path: '/support', icon: Headphones },
    { label: 'Returns & Refunds', path: '/returns', icon: RotateCcw },
    { divider: true, section: 'Enterprise & FDE' },
    { label: 'Incidents', path: '/incidents', icon: AlertOctagon },
    { label: 'Integrations & APIs', path: '/integrations', icon: Cable },
    { label: 'Data Mapping', path: '/integrations/mapping', icon: GitFork },
    { label: 'FDE Deployment', path: '/deployment', icon: Rocket },
    { label: 'Data Quality Engine', path: '/data-quality', icon: ShieldCheck },
    { label: 'Audit Logs', path: '/audit', icon: FileText },
    { label: 'System Health & Logs', path: '/system/logs', icon: Activity },
    { divider: true, section: 'Company Administration' },
    { label: 'User Management', path: '/admin/users', icon: Users, badge: 'Admin' },
  ];

  const availableRoles: UserRole[] = [
    'Admin',
    'Operations Manager',
    'Warehouse Manager',
    'Support Agent',
    'Analyst',
    'Viewer'
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800/80 justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                ShopSphere
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-brand-400 font-semibold font-mono">
                AI Ops Center
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item, idx) => {
            if (item.divider) {
              return (
                <div key={idx} className="pt-3 pb-1 px-3 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {item.section}
                </div>
              );
            }

            const Icon = item.icon!;
            const isHighlight = item.highlight;

            return (
              <NavLink
                key={item.path}
                to={item.path!}
                className={({ isActive }) => `
                  flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition duration-150
                  ${isActive
                    ? isHighlight
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/20'
                      : 'bg-slate-800 text-white'
                    : isHighlight
                    ? 'text-brand-300 hover:bg-brand-500/10 hover:text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }
                `}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isHighlight ? 'text-brand-400' : ''}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-semibold font-mono">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-brand-300 shrink-0">
                {user?.fullName?.slice(0, 2).toUpperCase() || 'OP'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.fullName || 'Alex Vance'}</p>
                <p className="text-[10px] text-brand-400 font-medium truncate flex items-center">
                  <Shield className="w-2.5 h-2.5 mr-1 inline" /> {user?.role || 'Admin'}
                </p>
              </div>
            </div>
            <button onClick={logout} title="Sign Out" className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-lg">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-6 shrink-0 z-10">
          {/* Global Search Bar */}
          <div
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center w-80 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-1.5 cursor-pointer hover:border-slate-600 transition group text-xs text-slate-400"
          >
            <Search className="w-4 h-4 mr-2 text-slate-500 group-hover:text-slate-300 transition" />
            <span>Search orders, P-204, tickets...</span>
            <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 font-mono">
              Ctrl+K
            </kbd>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center space-x-4">
            {/* Live Operational Health Indicator */}
            <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All Systems Operational</span>
            </div>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-medium hover:bg-slate-800 transition"
              >
                <Shield className="w-3.5 h-3.5 text-brand-400" />
                <span>Role: {user?.role}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 z-30 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-slate-400 border-b border-slate-800">
                    Switch Active RBAC Role
                  </div>
                  {availableRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        switchRole(role);
                        setIsRoleDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 text-slate-200 transition"
                    >
                      <span>{role}</span>
                      {user?.role === role && <Check className="w-3.5 h-3.5 text-brand-400" />}
                    </button>
                  ))}
                  {user?.role === 'Admin' && (
                    <NavLink
                      to="/admin/users"
                      onClick={() => setIsRoleDropdownOpen(false)}
                      className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-purple-950/60 text-purple-300 border-t border-slate-800 transition"
                    >
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>Manage Users (Admin)</span>
                    </NavLink>
                  )}
                </div>
              )}
            </div>

            {/* Notifications Button */}
            <button
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <Outlet />
        </main>
      </div>

      {/* Global Search and Notifications */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <NotificationsDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </div>
  );
};
