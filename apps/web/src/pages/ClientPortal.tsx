import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Truck,
  Package,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Shield,
  Phone,
  Mail,
  User,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Send,
  RefreshCw,
  Plus,
  X,
  MapPin,
  FileText
} from 'lucide-react';

interface CompanyInfo {
  profile: {
    company_name: string;
    tagline: string;
    description: string;
    email: string;
    phone: string;
    headquarters: string;
    gstin: string;
    support_hotline: string;
    total_warehouses: number;
    active_fleet: number;
    sla_guarantee: string;
  };
  operationalStats: {
    total_warehouses: number;
    total_orders_handled: number;
    total_departments: number;
    resolved_complaints: number;
    active_commercial_clients: number;
  };
  departments: Array<{
    name: string;
    code: string;
    head_officer_name: string;
    head_officer_email: string;
    sla_hours: number;
  }>;
}

export const ClientPortal: React.FC = () => {
  const { user, registerClient, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'company' | 'track' | 'complaint' | 'my-complaints'>('track');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderNum, setSelectedOrderNum] = useState('');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [myComplaints, setMyComplaints] = useState<any[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);

  // Client Register Modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    password: '',
    companyName: '',
    phone: ''
  });

  // Complaint Submission Form
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    description: '',
    category: 'DELIVERY_DELAY',
    severity: 'HIGH',
    orderNumber: ''
  });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState<any>(null);

  // Pre-seeded client accounts for quick demo switching
  const demoClients = [
    { name: 'Rajesh Kumar', email: 'client.reliance@enterprise.in', company: 'Reliance Retail Ltd', id: 'CLI-8801' },
    { name: 'Meera Nambiar', email: 'client.titan@enterprise.in', company: 'Titan Enterprise Co', id: 'CLI-8802' },
    { name: 'Sunil Grover', email: 'client.zomato@hyperlocal.in', company: 'Zomato Commerce Ltd', id: 'CLI-8803' }
  ];

  // Fetch company profile
  const fetchCompany = async () => {
    try {
      const res = await api.get('/company');
      setCompanyInfo(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch recent orders
  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders', { params: { limit: 10 } });
      setOrders(res.data.data || []);
      if (res.data.data?.length > 0 && !selectedOrderNum) {
        setSelectedOrderNum(res.data.data[0].order_number);
        handleTrackOrder(res.data.data[0].order_number);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch client's filed complaints
  const fetchMyComplaints = async () => {
    setComplaintsLoading(true);
    try {
      const res = await api.get('/complaints', { params: { type: 'CLIENT_COMPLAINT' } });
      setMyComplaints(res.data.complaints || []);
    } catch (e) {
      console.error(e);
    } finally {
      setComplaintsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
    fetchOrders();
    fetchMyComplaints();
  }, [user]);

  const handleTrackOrder = async (ordNum: string) => {
    if (!ordNum.trim()) return;
    setTrackingLoading(true);
    try {
      const res = await api.get(`/orders/track/${ordNum.trim()}`);
      setTrackingData(res.data);
    } catch (e: any) {
      alert(e.response?.data?.error || `Order ${ordNum} not found`);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerClient(regForm);
      setIsRegisterOpen(false);
      alert(`Welcome ${regForm.fullName}! Your client account for ${regForm.companyName} is ready.`);
      fetchMyComplaints();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingComplaint(true);
    setComplaintSuccess(null);
    try {
      const res = await api.post('/complaints', {
        type: 'CLIENT_COMPLAINT',
        ...complaintForm,
        clientId: user?.clientId || 'CLI-8801'
      });
      setComplaintSuccess(res.data.complaint);
      setComplaintForm({
        title: '',
        description: '',
        category: 'DELIVERY_DELAY',
        severity: 'HIGH',
        orderNumber: ''
      });
      fetchMyComplaints();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit complaint');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Real-World Client Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-800/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30">
                Commercial Client Operations Portal
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Live Enterprise SLA Desk
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {companyInfo?.profile.company_name || 'ShopSphere Operations'}
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {companyInfo?.profile.tagline || 'Autonomous Multichannel Fulfillment & Nationwide Delivery Network'}
            </p>
          </div>

          {/* Client Identity & Account Switcher */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 shrink-0 min-w-[280px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Active Client Persona</span>
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="text-[10px] text-brand-400 hover:text-brand-300 font-semibold underline"
              >
                + Create Client Account
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
                {user?.companyName ? user.companyName.slice(0, 2).toUpperCase() : 'RR'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  {user?.companyName || 'Reliance Retail Ltd'}
                </p>
                <p className="text-[10px] text-brand-300 font-mono">
                  ID: {user?.clientId || 'CLI-8801'} • {user?.fullName || 'Rajesh Kumar'}
                </p>
              </div>
            </div>

            {/* Quick switcher buttons */}
            <div className="pt-1 flex items-center gap-1.5 overflow-x-auto text-[9px] font-mono">
              <span className="text-slate-400">Switch:</span>
              {demoClients.map(c => (
                <button
                  key={c.id}
                  onClick={() => switchRole('Client')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap"
                >
                  {c.company.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 mt-6 pt-2 gap-2 overflow-x-auto">
          {[
            { id: 'track', label: 'Order Telemetry & Live Tracking', icon: Truck },
            { id: 'complaint', label: 'File Live Complaint (Instant Alert)', icon: AlertTriangle },
            { id: 'my-complaints', label: `Complaint History (${myComplaints.length})`, icon: Clock },
            { id: 'company', label: 'About Company & Operations Footprint', icon: Building2 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-brand-500 text-white bg-slate-900/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: ORDER TELEMETRY & LIVE TRACKING */}
      {activeTab === 'track' && (
        <div className="space-y-6">
          {/* Tracking Search & Quick Picker */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 flex gap-2 w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter Order Number to track (e.g. ORD-2026-9041)..."
                  value={selectedOrderNum}
                  onChange={(e) => setSelectedOrderNum(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrackOrder(selectedOrderNum)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white uppercase font-mono placeholder:normal-case placeholder-slate-400"
                />
              </div>
              <button
                onClick={() => handleTrackOrder(selectedOrderNum)}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-lg shadow-brand-500/20"
              >
                Track Live
              </button>
            </div>

            {/* Quick recent orders chip selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Recent:</span>
              {orders.slice(0, 4).map(o => (
                <button
                  key={o.id}
                  onClick={() => {
                    setSelectedOrderNum(o.order_number);
                    handleTrackOrder(o.order_number);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition ${
                    selectedOrderNum === o.order_number
                      ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 font-bold'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {o.order_number}
                </button>
              ))}
            </div>
          </div>

          {trackingLoading && (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Polling live logistics telemetry & courier GPS coordinates...
            </div>
          )}

          {/* Active Order Telemetry Card */}
          {trackingData && !trackingLoading && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-white font-mono">
                        {trackingData.order.order_number}
                      </h3>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase font-mono ${
                        trackingData.order.status === 'delivered'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : trackingData.order.status === 'delayed'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {trackingData.order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Destined for: <strong className="text-slate-200">{trackingData.order.shipping_city}</strong> • Origin Hub: {trackingData.order.warehouse_name} ({trackingData.order.warehouse_code})
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setComplaintForm({
                          ...complaintForm,
                          orderNumber: trackingData.order.order_number,
                          title: `Issue with Order ${trackingData.order.order_number}`
                        });
                        setActiveTab('complaint');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Report Issue with Consignment</span>
                    </button>
                  </div>
                </div>

                {/* 6-Stage Delivery Pipeline */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                    Real-World Delivery Progress Pipeline:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {trackingData.milestones.map((ms: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border space-y-1.5 ${
                          ms.completed
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                            : ms.inProgress
                            ? 'bg-amber-950/30 border-amber-500/50 text-amber-200 animate-pulse'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold">
                            Stage {idx + 1}
                          </span>
                          {ms.completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          {ms.inProgress && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <p className="text-xs font-semibold leading-snug">{ms.label}</p>
                        <span className="text-[9px] text-slate-400 block font-mono">
                          {ms.location}
                        </span>
                        {ms.timestamp && (
                          <span className="text-[9px] text-slate-400 font-mono block">
                            {new Date(ms.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Courier Fleet Details Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Logistics Courier Partner</span>
                    <p className="font-bold text-slate-200 mt-0.5">{trackingData.courier.provider}</p>
                    <p className="text-[10px] text-brand-400 font-mono">Waybill: {trackingData.courier.waybillNumber}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Assigned Fleet Vehicle & Driver</span>
                    <p className="font-bold text-slate-200 mt-0.5">{trackingData.courier.driverName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Vehicle: {trackingData.courier.assignedVehicle} • Tel: {trackingData.courier.driverPhone}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Expected Delivery Target</span>
                    <p className="font-bold text-emerald-400 mt-0.5">
                      {new Date(trackingData.courier.estimatedArrival).toLocaleDateString()} at{' '}
                      {new Date(trackingData.courier.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">Covered under 99.2% SLA guarantee</p>
                  </div>
                </div>

                {/* Order Items Table */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                    Consignment Manifest Items ({trackingData.order.items?.length || 0}):
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono">
                        <tr>
                          <th className="py-2.5 px-3">SKU / Item</th>
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3">Quantity</th>
                          <th className="py-2.5 px-3">Unit Price</th>
                          <th className="py-2.5 px-3 text-right">Total Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {trackingData.order.items?.map((it: any) => (
                          <tr key={it.id} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-200">{it.sku || it.product_id}</td>
                            <td className="py-2.5 px-3 text-slate-300">{it.product_name}</td>
                            <td className="py-2.5 px-3 font-mono">{it.quantity}</td>
                            <td className="py-2.5 px-3 font-mono">₹{it.unit_price}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-right text-slate-100">₹{it.total_price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FILE LIVE COMPLAINT (IMMEDIATE OFFICER ALERT) */}
      {activeTab === 'complaint' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 max-w-3xl mx-auto shadow-xl">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              Immediate Escalation Channel
            </span>
            <h2 className="text-xl font-bold text-white mt-1">Lodge Operational Complaint / Grievance</h2>
            <p className="text-xs text-slate-400 mt-1">
              Your issue will be automatically detected, prioritized, and broadcasted in real-time to the designated Department Officer!
            </p>
          </div>

          {complaintSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2 animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm">Complaint Registered Successfully!</h4>
              </div>
              <p className="text-xs">
                Ticket Number: <strong className="font-mono text-white">{complaintSuccess.ticketNumber}</strong>
              </p>
              <p className="text-xs">
                Routed to: <strong className="text-white">{complaintSuccess.departmentName}</strong> • Designated Officer Alerted: <strong className="text-amber-300">{complaintSuccess.assignedOfficerName}</strong>
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">
                An immediate notification chime and alert banner has appeared on the officer's command console.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmitComplaint} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Issue Category *</label>
                <select
                  value={complaintForm.category}
                  onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="DELIVERY_DELAY">Delivery Delay / Transit Delay (Alerts Delivery Officer)</option>
                  <option value="DAMAGED_PRODUCT">Damaged Packaging / Broken Product (Alerts Product QA)</option>
                  <option value="WRONG_ITEM">Wrong SKU / Incorrect Items (Alerts Warehousing Lead)</option>
                  <option value="BILLING_DISPUTE">Invoice / GST Discrepancy (Alerts Finance Lead)</option>
                  <option value="GENERAL_SERVICE">General Service Quality Issue</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Order # (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ORD-2026-9041"
                  value={complaintForm.orderNumber}
                  onChange={(e) => setComplaintForm({ ...complaintForm, orderNumber: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white uppercase font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Subject / Summary *</label>
              <input
                type="text"
                required
                placeholder="e.g. Consignment delayed by 48 hours in regional hub"
                value={complaintForm.title}
                onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Detailed Description of Problem *</label>
              <textarea
                rows={4}
                required
                placeholder="Provide complete details including batch numbers, recipient location, or invoice reference..."
                value={complaintForm.description}
                onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            {/* Smart Detection Preview Card */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-800/40 text-xs text-indigo-300 flex items-start space-x-3">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Immediate Officer Alert Routing Guarantee</span>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Submitting will create an immutable audit record and dispatch an urgent high-priority alert directly to the department team lead and supervisor.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submittingComplaint}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 flex items-center space-x-2 transition"
              >
                <Send className="w-4 h-4" />
                <span>{submittingComplaint ? 'Dispatching Alert...' : 'Submit & Alert Officer Immediately'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: MY FILED COMPLAINTS & RESOLUTION TRACKING */}
      {activeTab === 'my-complaints' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Your Commercial Complaint History</h2>
            <button
              onClick={fetchMyComplaints}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono">
                <tr>
                  <th className="py-3 px-4">Ticket #</th>
                  <th className="py-3 px-4">Issue Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Assigned Officer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Filed On</th>
                  <th className="py-3 px-4">Resolution Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {myComplaints.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No complaints lodged yet. You can file a ticket anytime using the "File Live Complaint" tab.
                    </td>
                  </tr>
                )}

                {myComplaints.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-brand-300">{c.ticket_number}</td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-slate-200 truncate">{c.title}</p>
                      {c.order_number && (
                        <span className="text-[10px] font-mono text-slate-400">Order: {c.order_number}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{c.department_name}</td>
                    <td className="py-3 px-4 text-amber-300 font-mono">{c.assigned_officer_name || 'Designated Lead'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs text-[11px]">
                      {c.resolution_notes || (
                        <span className="text-amber-400/80 italic font-mono text-[10px]">
                          Officer investigating root cause...
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: COMPANY PROFILE & OPERATIONS FOOTPRINT */}
      {activeTab === 'company' && companyInfo && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-[10px] font-mono uppercase text-brand-400 font-bold">
                Operational Guarantee & SLA
              </span>
              <p className="text-sm font-semibold text-white">{companyInfo.profile.sla_guarantee}</p>
              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                <p>• 99.2% On-time Metro Delivery Guarantee</p>
                <p>• 2-Hour Grievance Detection SLA</p>
                <p>• Automated Root-Cause Remediation</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold">
                Corporate Infrastructure
              </span>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Headquarters</span>
                  <span className="font-semibold text-white">{companyInfo.profile.headquarters}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">GSTIN Registration</span>
                  <span className="font-mono text-slate-200">{companyInfo.profile.gstin}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Commercial Support Hotline</span>
                  <span className="font-bold text-emerald-400">{companyInfo.profile.support_hotline}</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-[10px] font-mono uppercase text-purple-400 font-bold">
                Live Fulfillment Scale
              </span>
              <div className="grid grid-cols-2 gap-2 text-center pt-2">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xl font-bold text-white">{companyInfo.operationalStats?.total_warehouses || 20}</span>
                  <span className="block text-[10px] text-slate-400">National Hubs</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xl font-bold text-brand-400">{companyInfo.profile.active_fleet || 450}+</span>
                  <span className="block text-[10px] text-slate-400">EV Fleet</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xl font-bold text-emerald-400">{companyInfo.operationalStats?.total_departments || 6}</span>
                  <span className="block text-[10px] text-slate-400">Departments</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xl font-bold text-amber-400">{companyInfo.operationalStats?.active_commercial_clients || 3}</span>
                  <span className="block text-[10px] text-slate-400">Enterprise Clients</span>
                </div>
              </div>
            </div>
          </div>

          {/* Department Contact Directory */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-400" /> Department Leadership Directory & Escalation Matrix
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {companyInfo.departments?.map((d) => (
                <div key={d.code} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{d.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {d.code}
                    </span>
                  </div>
                  <p className="text-xs text-amber-300 font-medium">Head: {d.head_officer_name || 'Designated Lead'}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{d.head_officer_email}</p>
                  <span className="text-[10px] text-slate-400 block pt-1 border-t border-slate-900 font-mono">
                    Target SLA: {d.sla_hours} hours
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REGISTER CLIENT ACCOUNT MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-brand-400" /> Register Commercial Client Account
              </h3>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterClient} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Company / Enterprise Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Retail Logistics Ltd"
                  value={regForm.companyName}
                  onChange={(e) => setRegForm({ ...regForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Representative Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Nair"
                  value={regForm.fullName}
                  onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Business Email (Login ID) *</label>
                <input
                  type="email"
                  required
                  placeholder="rohan@tataretail.in"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters..."
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91-98765-12345"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                >
                  Create Client Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
