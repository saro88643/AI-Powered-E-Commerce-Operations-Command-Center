import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  LifeBuoy,
  PlusCircle,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Building2,
  ChevronRight,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

export const StoreComplaints: React.FC = () => {
  const [searchParams] = useSearchParams();
  const prefilledOrder = searchParams.get('orderNumber') || searchParams.get('orderId') || '';

  const [activeTab, setActiveTab] = useState<'create' | 'tickets'>('create');
  const [orderNumber, setOrderNumber] = useState(prefilledOrder);
  const [category, setCategory] = useState('delivery_delay');
  const [priority, setPriority] = useState('urgent');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tickets list state
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (prefilledOrder) {
      setTitle(`Delivery Delay Issue for Order #${prefilledOrder}`);
      setDescription(`My order ${prefilledOrder} is experiencing delivery delays in Coimbatore. Need immediate dispatch status.`);
    }
  }, [prefilledOrder]);

  const loadTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const res = await fetch('/api/complaints');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [ticketResult]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CLIENT_COMPLAINT',
          title,
          description,
          category,
          severity: priority.toUpperCase(),
          orderNumber
        })
      });

      const data = await res.json();
      if (res.ok) {
        setTicketResult(data);
        setActiveTab('tickets');
      } else {
        setErrorMessage(data.error || 'Failed to file ticket.');
      }
    } catch (err: any) {
      setErrorMessage('Error registering complaint: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      const res = await fetch(`/api/complaints/${selectedTicket.id}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage.trim(),
          action: 'CUSTOMER_FOLLOWUP'
        })
      });

      if (res.ok) {
        setNewMessage('');
        // Reload ticket details
        const detailRes = await fetch(`/api/complaints/${selectedTicket.id}`);
        if (detailRes.ok) {
          const updated = await detailRes.json();
          setSelectedTicket(updated);
        }
      }
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  };

  const openTicketDetail = async (ticket: any) => {
    try {
      const res = await fetch(`/api/complaints/${ticket.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data);
      } else {
        setSelectedTicket({ complaint: ticket, timeline: [] });
      }
    } catch (e) {
      setSelectedTicket({ complaint: ticket, timeline: [] });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-amber-500" />
            <span>24x7 Customer Help &amp; Complaints Desk</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Lodge delivery grievances, track real-time resolution timeline, and escalate directly to department officers.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'create'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lodge New Ticket
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'tickets'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Complaints ({tickets.length})
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* TAB 1: CREATE COMPLAINT FORM (Requirement 18) */}
      {activeTab === 'create' && (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-500" />
              <span>Raise Support Ticket &amp; Delivery Grievance</span>
            </h2>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded">
              MongoDB Ticket Collection
            </span>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Order Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ORD-10291 or ORD-00001"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-400 font-semibold"
                >
                  <option value="delivery_delay">Delivery Delay / Consignment Stuck</option>
                  <option value="damaged_product">Damaged Product on Delivery</option>
                  <option value="missing_item">Missing Item or Package Parts</option>
                  <option value="wrong_product">Wrong Product Received</option>
                  <option value="payment_issue">Payment or Gateway Issue</option>
                  <option value="refund_status">Refund Status Follow-up</option>
                  <option value="other">Other Operational Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority Severity</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-400 font-semibold"
                >
                  <option value="low font-normal">Low - General Question</option>
                  <option value="medium">Medium - Standard Tracking Inquiry</option>
                  <option value="high">High - Delayed Delivery (&gt; 48h)</option>
                  <option value="urgent">Urgent - Critical Health/Enterprise Parcel</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Complaint Title</label>
                <input
                  type="text"
                  placeholder="e.g. Order ORD-10291 for Wireless Keyboard P-204 is delayed in Coimbatore"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-bold focus:border-amber-400 text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Detailed Description &amp; Incident Context</label>
                <textarea
                  rows={4}
                  placeholder="Provide complete details including expected delivery date, tracking status, or physical condition..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> Automatic Department Officer Dispatch
              </span>
              <p>
                Submitting this complaint will auto-detect the responsible department (Delivery &amp; Logistics, Warehousing, or Product) and trigger an immediate officer alert notification!
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Registering Complaint Ticket...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Register Ticket &amp; Alert Department Officer</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: TICKETS DASHBOARD & DETAIL VIEW (Requirement 19) */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Tickets List */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-200">
              Registered Support Tickets ({tickets.length})
            </h3>

            {isLoadingTickets ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">Loading tickets from MongoDB...</div>
            ) : tickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                No tickets lodged yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {tickets.map((t) => (
                  <div
                    key={t.id || t.ticket_id || t.ticket_number}
                    onClick={() => openTicketDetail(t)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 text-xs ${
                      selectedTicket?.complaint?.id === t.id
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{t.ticket_number || t.ticket_id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.status === 'RESOLVED' || t.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'OFFICER_ALERTED'
                          ? 'bg-amber-100 text-amber-900 animate-pulse'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 line-clamp-1">{t.title || t.message?.slice(0, 40)}</h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Dept: <strong>{t.department_name || 'Delivery'}</strong></span>
                      <span>{new Date(t.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Detail & Timeline Panel */}
          <div className="lg:col-span-7">
            {selectedTicket ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm">{selectedTicket.complaint?.ticket_number || selectedTicket.complaint?.ticket_id}</span>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                      {selectedTicket.complaint?.title}
                    </h2>
                  </div>
                  <span className="bg-amber-100 text-amber-900 font-bold text-xs px-3 py-1 rounded-full uppercase">
                    {selectedTicket.complaint?.status}
                  </span>
                </div>

                {/* Complaint Details Card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-slate-400 font-semibold">Assigned Department:</span> <strong className="text-slate-900">{selectedTicket.complaint?.department_name || 'Delivery & Logistics'}</strong></div>
                    <div><span className="text-slate-400 font-semibold">Officer in Charge:</span> <strong className="text-slate-900">{selectedTicket.complaint?.assigned_officer_name || 'Kavita Nair'}</strong></div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 text-slate-700 leading-relaxed">
                    {selectedTicket.complaint?.description || selectedTicket.complaint?.message}
                  </div>
                </div>

                {/* Resolution Notes if resolved */}
                {selectedTicket.complaint?.resolution_notes && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-emerald-900 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Resolution Action Applied
                    </span>
                    <p className="text-emerald-800">{selectedTicket.complaint?.resolution_notes}</p>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Communication &amp; Audit Timeline</h3>
                  <div className="space-y-2">
                    {selectedTicket.timeline?.map((entry: any) => (
                      <div key={entry.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-slate-900 font-bold">{entry.actor_name || 'System'} ({entry.actor_role})</span>
                          <span className="text-slate-400">{new Date(entry.timestamp).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-slate-600">{entry.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Send Customer Reply */}
                <form onSubmit={handleAddMessage} className="pt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type follow-up response to assigned officer..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-amber-400"
                  />
                  <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 rounded-xl flex items-center gap-1">
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
                Select a ticket from the left column to view status timeline and officer response.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreComplaints;
