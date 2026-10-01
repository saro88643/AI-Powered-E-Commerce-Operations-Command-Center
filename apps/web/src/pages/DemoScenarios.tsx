import React from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  CreditCard,
  Truck,
  Package,
  Headphones,
  CheckCircle2,
  Database,
  Layers,
  Cpu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Scenario {
  id: string;
  title: string;
  category: string;
  prompt: string;
  icon: any;
  color: string;
  borderColor: string;
  badgeBg: string;
  dataSources: string[];
  description: string;
  expectedCorrelation: string;
  suggestedAction: string;
}

export const DemoScenarios: React.FC = () => {
  const navigate = useNavigate();

  const scenarios: Scenario[] = [
    {
      id: 'coimbatore-delayed',
      title: 'Delayed Coimbatore Orders Investigation',
      category: 'Logistics SLA & Warehouse Sync',
      prompt: 'Why are customers from Coimbatore receiving orders late?',
      icon: Truck,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-800',
      dataSources: ['PostgreSQL Orders', 'Warehouses (W03)', 'Delivery Partner API', 'MongoDB Tickets'],
      description: 'Customers in Coimbatore report extensive order delays exceeding SLA by 48+ hours.',
      expectedCorrelation: 'Warehouse W03 inventory sync failure caused 31 delayed orders; physical stock is zero while ERP showed stock.',
      suggestedAction: 'Reroute unfulfilled orders to Warehouse W02 and initiate inventory replenishment.'
    },
    {
      id: 'p204-inventory-flagship',
      title: 'Flagship RCA: Product P-204 Root Cause & Auto-Fix',
      category: 'Flagship Multi-System RCA',
      prompt: 'Something is wrong with Product P-204. Find out why.',
      icon: Sparkles,
      color: 'text-indigo-400',
      borderColor: 'border-indigo-500/40',
      badgeBg: 'bg-indigo-950/80 text-indigo-300 border-indigo-800',
      dataSources: ['PostgreSQL Inventory', 'Order Items', 'Delivery API', 'MongoDB Tickets', 'Warehouse SOP.pdf'],
      description: 'Operations noticed widespread customer dissatisfaction and delivery delays on Ergonomic Office Chair P-204.',
      expectedCorrelation: 'Zero physical stock at W03 despite 50 ERP units caused 67 affected orders, 31 delays, and 7 angry support tickets.',
      suggestedAction: 'Propose automated stock transfer of 50 units from Bangalore W02 to Coimbatore W03 with operator safety gate.'
    },
    {
      id: 'high-return-rate',
      title: 'Unusually High Return Rate & Supplier Quality',
      category: 'Merchandising & Supplier Quality',
      prompt: 'Which products have unusually high return rates?',
      icon: RotateCcw,
      color: 'text-rose-400',
      borderColor: 'border-rose-500/30',
      badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-800',
      dataSources: ['PostgreSQL Returns', 'Product Catalog', 'Supplier Agreement.pdf', 'MongoDB Feedback'],
      description: 'Multiple product categories show sudden return spikes, triggering margin leakage.',
      expectedCorrelation: 'Product P-512 (ErgoComfort Mesh Chair) return rate reached 24.5% due to seam tearing defect from supplier SUP-014.',
      suggestedAction: 'Quarantine existing inventory batch and issue formal Supplier Escalation Notice under Section 6.2.'
    },
    {
      id: 'payment-failure-spike',
      title: 'Payment Gateway Clearing Switch Outage',
      category: 'Financial Operations',
      prompt: 'Why did payments fail yesterday?',
      icon: CreditCard,
      color: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-800',
      dataSources: ['PostgreSQL Payments', 'Payment Clearing API (:4003)', 'Incident Log INC-2026-081'],
      description: 'Checkout funnel conversion dropped 18% during evening peak hours due to transaction drops.',
      expectedCorrelation: 'External Payment Clearing Switch timed out on UPI/Card processing, generating 84 failed payments.',
      suggestedAction: 'Failover traffic to secondary backup payment aggregator switch and trigger automatic retry.'
    },
    {
      id: 'delivery-carrier-failure',
      title: 'Logistics Partner Route Congestion',
      category: 'Carrier Performance',
      prompt: 'Find the root cause of the delivery issue.',
      icon: AlertTriangle,
      color: 'text-orange-400',
      borderColor: 'border-orange-500/30',
      badgeBg: 'bg-orange-950/80 text-orange-300 border-orange-800',
      dataSources: ['Delivery API (:4002)', 'PostgreSQL Orders', 'Delivery Escalation Policy.pdf'],
      description: 'Carrier partner SpeedFast Logistics exhibits an abrupt decline in on-time delivery percentages.',
      expectedCorrelation: 'Highway flooding near Salem corridor blocked primary transit trucks, stalling 42 Coimbatore shipments.',
      suggestedAction: 'Invoke Delivery Escalation SOP Section 3.1: reroute transit via BlueDart feeder routes.'
    },
    {
      id: 'restocking-threshold',
      title: 'Critical Inventory Depletion & Restock Alerts',
      category: 'Supply Chain Planning',
      prompt: 'Which products need restocking?',
      icon: Package,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
      dataSources: ['PostgreSQL Inventory', 'Product Reorder Thresholds', 'Supplier Lead Times'],
      description: 'High-velocity SKUs are rapidly approaching safety stock minimums across regional fulfillment centers.',
      expectedCorrelation: '14 SKUs are currently beneath their dynamic reorder threshold, posing imminent stockout risks.',
      suggestedAction: 'Generate batch purchase requisition orders sent to primary suppliers with shortest lead times.'
    },
    {
      id: 'repeat-support-contacts',
      title: 'Repeat Customer Contacts & VIP Frustration',
      category: 'Customer Experience & CRM',
      prompt: 'Find customers who contacted support multiple times.',
      icon: Headphones,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
      badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
      dataSources: ['MongoDB Customers', 'Support Tickets', 'Customer Support SOP.pdf'],
      description: 'Identify customers trapped in repeat contact loops without successful first-contact resolution.',
      expectedCorrelation: 'VIP Customer Arjun Sundaram opened 3 repeat tickets for order ORD-00001 delayed over 5 days.',
      suggestedAction: 'Escalate to Tier-3 VIP concierge desk, issue late delivery compensation credit, and expedite delivery.'
    }
  ];

  const handleLaunch = (prompt: string) => {
    navigate(`/ai?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" /> Real Operational Multi-System Scenarios
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Demo Scenarios</h1>
          <p className="text-sm text-slate-400 mt-1">
            Explore realistic operational failure modes. Each scenario triggers live tool calls, queries PostgreSQL & MongoDB, searches RAG policies, and calculates real correlations.
          </p>
        </div>

        <button
          onClick={() => handleLaunch('Something is wrong with Product P-204. Find out why.')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          Launch Flagship Demo (P-204)
        </button>
      </div>

      {/* Grid of Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          return (
            <div
              key={sc.id}
              className={`bg-slate-900/90 border ${sc.borderColor} rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-600 transition group`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <Icon className={`w-5 h-5 ${sc.color}`} />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${sc.badgeBg}`}>
                    {sc.category}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                  {sc.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {sc.description}
                </p>

                {/* Prompt Box */}
                <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] uppercase font-mono text-slate-500 mb-1">DISPATCH PROMPT</div>
                  <div className="text-xs font-medium text-slate-200 italic">
                    "{sc.prompt}"
                  </div>
                </div>

                {/* Systems involved */}
                <div className="mt-4">
                  <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1.5">DATA SYSTEMS PROBED</div>
                  <div className="flex flex-wrap gap-1.5">
                    {sc.dataSources.map((ds, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60"
                      >
                        {ds}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expected correlation */}
                <div className="mt-3 text-[11px] text-slate-400">
                  <span className="text-slate-500 font-semibold">Root Cause:</span> {sc.expectedCorrelation}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Real-time Execution</span>
                <button
                  onClick={() => handleLaunch(sc.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition group-hover:translate-x-0.5"
                >
                  <span>Launch Investigation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
