import React, { useState, useEffect } from 'react';
import {
  Bot, Send, CheckCircle2, AlertTriangle, ArrowRight,
  Shield, Layers, FileText, ChevronRight, ChevronDown,
  Sparkles, ExternalLink, RefreshCw, CheckCircle, Database
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

interface InvestigationStep {
  id: string;
  title: string;
  status: 'running' | 'completed' | 'failed';
  tool: string;
  summary: string;
}

interface EvidenceCard {
  id: string;
  title: string;
  type: string;
  metric: string;
  description: string;
  linkId?: string;
  linkRoute?: string;
}

interface Citation {
  documentId: string;
  documentName: string;
  section: string;
  page: number;
  content: string;
}

interface ActionPreview {
  actionType: string;
  actionTitle: string;
  reason: string;
  affectedRecordsCount: number;
  affectedRecordsSummary: string;
  expectedImpact: string;
  parameters: Record<string, any>;
  requiresConfirmation: boolean;
}

interface AIResponse {
  summary: string;
  findings: string[];
  evidence: EvidenceCard[];
  dataSources: string[];
  citations?: Citation[];
  rootCauseAnalysis?: {
    observedSymptoms: string[];
    evidenceSummary: string;
    possibleCauses: string[];
    correlations: string[];
    rootCause: string;
    businessImpact: string;
    confidence: string;
  };
  recommendedAction?: ActionPreview;
  investigationSteps: InvestigationStep[];
  lineage: {
    question: string;
    dataSources: string[];
    toolsExecuted: string[];
    recordsAnalyzedCount: number;
    conclusion: string;
  };
}

export const AICommandCenter: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  
  // Action Execution State
  const [executingAction, setExecutingAction] = useState(false);
  const [resolutionResult, setResolutionResult] = useState<any>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt) {
      setInputQuery(prompt);
      handleRunInvestigation(prompt);
    }
  }, [searchParams]);

  const samplePrompts = [
    'Why are customers from Coimbatore receiving orders late?',
    'Something is wrong with Product P-204. Find out why.',
    'Can order ORD-00001 be refunded?',
    'Which products have unusually high return rates?'
  ];

  const handleRunInvestigation = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    setLoading(true);
    setResolutionResult(null);
    try {
      const res = await api.post('/ai/investigate', { question: q });
      setResponse(res.data);
      // Automatically expand primary steps
      const expanded: Record<string, boolean> = {};
      (res.data.investigationSteps || []).forEach((s: any) => { expanded[s.id] = true; });
      setExpandedSteps(expanded);
    } catch (err: any) {
      console.error('AI Investigation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!response?.recommendedAction) return;

    setExecutingAction(true);
    try {
      const res = await api.post('/ai/action/confirm', {
        actionType: response.recommendedAction.actionType,
        parameters: response.recommendedAction.parameters,
        reason: response.recommendedAction.reason
      });
      setResolutionResult(res.data);
      setIsConfirmModalOpen(false);
    } catch (err: any) {
      alert('Action execution failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setExecutingAction(false);
    }
  };

  const toggleStep = (id: string) => {
    setExpandedSteps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between px-2 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Bot className="w-5 h-5 text-brand-400" />
            <span>AI Operations Command Console</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono">
              OBSERVE → INVESTIGATE → DECIDE → ACT → AUDIT
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tool-calling operational agent grounded in PostgreSQL, MongoDB, live REST microservices, and RAG policies.
          </p>
        </div>
      </div>

      {/* 3-Column Enterprise Operations Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
        
        {/* LEFT COLUMN: Conversation & Inquiries (3 cols) */}
        <div className="lg:col-span-3 flex flex-col glass-panel rounded-2xl p-4 overflow-hidden">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Operational Inquiries
          </div>

          {/* Quick Prompts */}
          <div className="space-y-2 mb-4">
            <span className="text-[11px] text-slate-400 font-medium">Standard Incident Scenarios:</span>
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setInputQuery(p);
                  handleRunInvestigation(p);
                }}
                className="w-full text-left p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-brand-500/40 hover:bg-brand-500/10 transition text-xs text-slate-300 hover:text-white leading-relaxed flex items-start space-x-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                <span>{p}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Conversation Notes or History */}
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300 block mb-1">Investigation Protocol:</span>
              The agent interrogates actual databases before formulating root-cause hypotheses. No operational numbers are hallucinated or pre-scripted.
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunInvestigation();
            }}
            className="mt-3 pt-3 border-t border-slate-800"
          >
            <div className="relative">
              <textarea
                rows={2}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask an operational question (e.g. Why is P-204 delayed?)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
              />
              <button
                type="submit"
                disabled={loading || !inputQuery.trim()}
                className="absolute right-2.5 bottom-2.5 p-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white transition shadow-md"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
        </div>

        {/* CENTER COLUMN: AI Investigation & Root Cause Analysis (5 cols) */}
        <div className="lg:col-span-5 flex flex-col glass-panel rounded-2xl p-4 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <span>Investigation Timeline & Analysis</span>
            </div>
            {response && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                {response.investigationSteps?.length || 0} Steps Executed
              </span>
            )}
          </div>

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
              <p className="text-xs font-semibold text-slate-200">Executing Multi-System Investigation...</p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Querying PostgreSQL orders, verifying inventory levels, retrieving MongoDB support tickets, and running RAG vector search.
              </p>
            </div>
          )}

          {!loading && !response && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-3 text-slate-500">
              <Bot className="w-10 h-10 text-slate-600" />
              <p className="text-xs">Select a scenario or enter an operational inquiry to begin automated investigation.</p>
            </div>
          )}

          {!loading && response && (
            <>
              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400 mb-1.5 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Executive Findings</span>
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {response.summary}
                </p>
              </div>

              {/* Tool Execution Timeline */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400">Execution Timeline</div>
                {response.investigationSteps?.map((step) => {
                  const isExpanded = expandedSteps[step.id];
                  return (
                    <div key={step.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                      <div
                        onClick={() => toggleStep(step.id)}
                        className="flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-semibold text-slate-200">{step.title}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-slate-400">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-400">
                            {step.tool}
                          </span>
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-300 leading-relaxed pl-5">
                          {step.summary}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Root Cause Analysis (RCA) Box */}
              {response.rootCauseAnalysis && (
                <div className="p-4 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-brand-500/30 glow-border space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Root Cause Analysis</span>
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono">
                      Confidence: {response.rootCauseAnalysis.confidence}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Root Cause: </span>
                      <span className="text-white font-semibold">{response.rootCauseAnalysis.rootCause}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium">Correlations:</span>
                      <ul className="list-disc list-inside text-slate-300 text-[11px] mt-1 space-y-0.5">
                        {response.rootCauseAnalysis.correlations.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium">Business Impact: </span>
                      <span className="text-rose-300">{response.rootCauseAnalysis.businessImpact}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Lineage */}
              {response.lineage && (
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] space-y-1 text-slate-400">
                  <div className="font-semibold text-slate-300 flex items-center space-x-1">
                    <Database className="w-3 h-3 text-brand-400" />
                    <span>Data Lineage & Traceability</span>
                  </div>
                  <div><span className="text-slate-500">Sources:</span> {response.lineage.dataSources.join(', ')}</div>
                  <div><span className="text-slate-500">Records Analyzed:</span> {response.lineage.recordsAnalyzedCount}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Evidence, Citations & Action Execution (4 cols) */}
        <div className="lg:col-span-4 flex flex-col glass-panel rounded-2xl p-4 overflow-y-auto space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-3">
            Evidence & Verified Action
          </div>

          {!response && !loading && (
            <div className="py-12 text-center text-xs text-slate-500">
              Evidence cards and action remediation previews will display here.
            </div>
          )}

          {response && (
            <>
              {/* Evidence Cards */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Grounding Evidence ({response.evidence?.length})</span>
                <div className="space-y-2">
                  {response.evidence?.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => ev.linkRoute && navigate(ev.linkRoute)}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition text-xs group"
                    >
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-400">
                          {ev.type}
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-white transition" />
                      </div>
                      <div className="font-semibold text-white">{ev.title}</div>
                      <div className="text-indigo-300 font-mono text-[11px] mt-0.5">{ev.metric}</div>
                      <div className="text-slate-400 text-[11px] mt-1">{ev.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RAG Policy Citations */}
              {response.citations && response.citations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Company Policy Citations</span>
                  </span>
                  <div className="space-y-2">
                    {response.citations.map((c, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-900/70 border border-cyan-500/20 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-cyan-300">{c.documentName}</span>
                          <span className="text-slate-400 font-mono">Page {c.page}</span>
                        </div>
                        <div className="text-slate-400 text-[10px] font-medium">{c.section}</div>
                        <p className="text-slate-300 text-[11px] italic leading-relaxed pt-1 border-t border-slate-800">
                          "{c.content}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Action / Action Execution Gate */}
              {response.recommendedAction && !resolutionResult && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/40 glow-border space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-300 flex items-center space-x-1.5">
                      <Shield className="w-3.5 h-3.5 text-brand-400" />
                      <span>Recommended Action</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      Requires Confirmation
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white">{response.recommendedAction.actionTitle}</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      {response.recommendedAction.reason}
                    </p>
                  </div>

                  <div className="text-[11px] bg-slate-950/60 p-2.5 rounded-lg space-y-1 border border-slate-800">
                    <div className="text-slate-400">
                      <span className="text-slate-500">Affected:</span> {response.recommendedAction.affectedRecordsSummary}
                    </div>
                    <div className="text-emerald-300 font-medium">
                      <span className="text-slate-500">Expected Impact:</span> {response.recommendedAction.expectedImpact}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/25 transition flex items-center justify-center space-x-2"
                  >
                    <span>Execute Action</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Post-Execution Verification / Issue Resolution Screen */}
              {resolutionResult && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <h3 className="text-sm font-bold text-white">{resolutionResult.resolutionTitle}</h3>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed">
                    {resolutionResult.actionExecuted}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-emerald-500/20 text-xs">
                    {resolutionResult.stepsCompleted?.map((step: string, i: number) => (
                      <div key={i} className="text-emerald-300 font-medium flex items-center space-x-1.5">
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                    <div>Audit Log ID: {resolutionResult.verificationDetails?.auditLogId}</div>
                    <div>Incident: {resolutionResult.verificationDetails?.incidentStatus}</div>
                    <div>Orders Re-evaluated: {resolutionResult.verificationDetails?.ordersReEvaluated}</div>
                  </div>

                  <button
                    onClick={() => navigate('/orders')}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    View Re-evaluated Orders
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal (Requirement 15 & 36) */}
      {isConfirmModalOpen && response?.recommendedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Write Operation</h3>
                <p className="text-xs text-slate-400">Operational safety verification required before execution</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
              <div><span className="text-slate-400 font-medium">Action:</span> <span className="text-white font-bold">{response.recommendedAction.actionTitle}</span></div>
              <div><span className="text-slate-400 font-medium">Reason:</span> <span className="text-slate-200">{response.recommendedAction.reason}</span></div>
              <div><span className="text-slate-400 font-medium">Affected Records:</span> <span className="text-brand-300 font-semibold">{response.recommendedAction.affectedRecordsSummary}</span></div>
              <div><span className="text-slate-400 font-medium">Expected Impact:</span> <span className="text-emerald-300">{response.recommendedAction.expectedImpact}</span></div>
              <div><span className="text-slate-400 font-medium">Authorized Role:</span> <span className="text-slate-300 font-mono">{user?.role}</span></div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={executingAction}
                className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/25 transition flex items-center space-x-1.5"
              >
                {executingAction ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : null}
                <span>Confirm & Execute Action</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
