import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  RotateCcw,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  FileText,
  Search,
  ArrowRight,
  ShieldCheck,
  Clock,
  HelpCircle,
  DollarSign
} from 'lucide-react';

export const StoreReturns: React.FC = () => {
  const [searchParams] = useSearchParams();
  const prefilledOrder = searchParams.get('orderNumber') || '';

  const [orderNumber, setOrderNumber] = useState(prefilledOrder);
  const [productId, setProductId] = useState('P-204');
  const [reason, setReason] = useState('Damaged on Arrival');
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');

  // RAG Policy Evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [policyResult, setPolicyResult] = useState<any>(null);

  // Return submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Existing returns list
  const [myReturns, setMyReturns] = useState<any[]>([]);
  const [isLoadingReturns, setIsLoadingReturns] = useState(true);

  useEffect(() => {
    async function loadReturns() {
      setIsLoadingReturns(true);
      try {
        const res = await fetch('/api/returns?myReturns=true');
        if (res.ok) {
          const data = await res.json();
          setMyReturns(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load return requests:', err);
      } finally {
        setIsLoadingReturns(false);
      }
    }
    loadReturns();
  }, [submitResult]);

  // Handle RAG Policy check (Requirement 21)
  const handleCheckPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEvaluating(true);
    setPolicyResult(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/returns/evaluate-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          productId,
          reason,
          category
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPolicyResult(data);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to evaluate return policy.');
      }
    } catch (err: any) {
      setErrorMessage('Error checking policy: ' + err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Submit return request (Requirement 20)
  const handleSubmitReturn = async () => {
    if (!orderNumber || !productId) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          productId,
          reason,
          description,
          refundAmount: 3499.0
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitResult(data);
      } else {
        setErrorMessage(data.error || 'Failed to submit return request.');
      }
    } catch (err: any) {
      setErrorMessage('Error submitting return: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-amber-500" />
          <span>ShopSphere Return &amp; Refund Desk</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Verify return eligibility against official company policies using our AI RAG retriever and request doorstep pickup.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Success Banner after Return Submitted */}
      {submitResult && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-base">Return Request Submitted Successfully!</h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Return Number: <strong className="font-mono">{submitResult.returnRecord?.return_number}</strong> &bull; Doorstep pickup scheduled by {new Date(submitResult.returnRecord?.estimatedPickup).toLocaleDateString('en-IN')}.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & RAG Policy Result */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleCheckPolicy} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <span>1. Check Return Eligibility (RAG Policy Query)</span>
              </h2>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                Vector RAG Policy Engine
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Order Number</label>
                <input
                  type="text"
                  placeholder="e.g. ORD-10291 or ORD-00001"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Product ID or Model</label>
                <input
                  type="text"
                  placeholder="e.g. P-204 or P-512"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-400"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Office & Computing">Office & Computing</option>
                  <option value="Apparel & Fashion">Apparel & Fashion</option>
                  <option value="Fitness & Health">Fitness & Health</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="Grocery">Grocery (Non-Returnable)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Return Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-400"
                >
                  <option value="Damaged on Arrival">Damaged on Arrival</option>
                  <option value="Wrong Product Delivered">Wrong Product Delivered</option>
                  <option value="Missing Item or Accessories">Missing Item or Accessories</option>
                  <option value="Not as Expected / Defective">Not as Expected / Defective</option>
                  <option value="Performance Issue">Performance Issue</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Additional Issue Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the issue with the delivered item..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isEvaluating}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isEvaluating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Searching Return Policy.pdf Vector Documents...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-amber-400" />
                  <span>Evaluate Policy Eligibility &amp; Retrieve Source</span>
                </>
              )}
            </button>
          </form>

          {/* Requirement 21: RAG POLICY RESULT CARD & CITATION */}
          {policyResult && (
            <div className={`rounded-2xl border p-6 space-y-4 shadow-sm transition-all ${
              policyResult.eligible ? 'bg-emerald-50/70 border-emerald-300' : 'bg-rose-50/70 border-rose-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {policyResult.eligible ? (
                    <span className="bg-emerald-600 text-white font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow">
                      <CheckCircle className="w-4 h-4" /> Eligible for Return
                    </span>
                  ) : (
                    <span className="bg-rose-600 text-white font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow">
                      <AlertTriangle className="w-4 h-4" /> Ineligible for Return
                    </span>
                  )}
                  <span className="text-xs font-semibold text-slate-600">
                    Category Window: {policyResult.windowDays} Days
                  </span>
                </div>
              </div>

              <p className="text-xs font-medium text-slate-800 leading-relaxed">
                {policyResult.reasonSummary}
              </p>

              {/* Policy Source Document Chunk (Requirement 21) */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px] pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Policy Source Document: <strong>{policyResult.policySource?.documentName}</strong></span>
                  </div>
                  <span>Page {policyResult.policySource?.page} &bull; Chunk: {policyResult.policySource?.chunkId}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">Section Citation</span>
                  <span className="font-bold text-slate-900">{policyResult.policySource?.section}</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg italic text-slate-600 border border-slate-100 text-[11px]">
                  &ldquo;{policyResult.policySource?.excerpt}&rdquo;
                </div>
              </div>

              {/* Submit Return Button */}
              {policyResult.eligible && !submitResult && (
                <button
                  type="button"
                  onClick={handleSubmitReturn}
                  disabled={isSubmitting}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting Return Request...</span>
                  ) : (
                    <>
                      <span>Submit Doorstep Return Request</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Existing Return Requests List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>My Active Return Requests</span>
              <span className="text-xs text-slate-400 font-normal">{myReturns.length} total</span>
            </h3>

            {isLoadingReturns ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">Loading return history...</div>
            ) : myReturns.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active or past return requests on your customer account.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {myReturns.map((ret) => (
                  <div key={ret.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{ret.return_number || ret.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ret.status === 'refunded'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ret.status === 'approved'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {ret.status}
                      </span>
                    </div>

                    <div className="text-slate-700 font-semibold line-clamp-1">{ret.product_name || ret.product_id}</div>
                    
                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Reason: {ret.reason?.slice(0, 30)}...</span>
                      <span className="font-bold text-slate-900">₹{parseFloat(ret.refund_amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreReturns;
