import React, { useState, useEffect } from 'react';
import { Search, X, Package, Users, Tag, Warehouse, AlertTriangle, Headphones, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data.results);
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (route: string) => {
    navigate(route);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search orders (ORD-00001), customers, products (P-204), tickets, warehouses..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:text-white text-slate-400 mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">ESC</span>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {loading && (
            <div className="py-8 text-center text-sm text-slate-400">Searching operations database...</div>
          )}

          {!loading && !results && (
            <div className="py-6 text-center text-xs text-slate-500">
              Try searching: <span className="text-indigo-400 cursor-pointer" onClick={() => setQuery('ORD-00001')}>ORD-00001</span>, <span className="text-indigo-400 cursor-pointer" onClick={() => setQuery('P-204')}>P-204</span>, <span className="text-indigo-400 cursor-pointer" onClick={() => setQuery('Coimbatore')}>Coimbatore</span>, or <span className="text-indigo-400 cursor-pointer" onClick={() => setQuery('W03')}>W03</span>
            </div>
          )}

          {results && (
            <>
              {/* Orders */}
              {results.orders?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center">
                    <Package className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Orders ({results.orders.length})
                  </div>
                  <div className="space-y-1">
                    {results.orders.map((o: any) => (
                      <div
                        key={o.id}
                        onClick={() => handleSelect(`/orders/${o.id}`)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/70 cursor-pointer transition text-sm"
                      >
                        <div>
                          <span className="font-semibold text-white">{o.order_number}</span>
                          <span className="text-xs text-slate-400 ml-2">{o.shipping_city}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === 'delayed' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {o.status}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {results.products?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center">
                    <Tag className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Products ({results.products.length})
                  </div>
                  <div className="space-y-1">
                    {results.products.map((p: any) => (
                      <div
                        key={p.product_id}
                        onClick={() => handleSelect(`/products`)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/70 cursor-pointer transition text-sm"
                      >
                        <div>
                          <span className="font-semibold text-cyan-300">{p.product_id}</span>
                          <span className="text-xs text-slate-300 ml-2">{p.product_name}</span>
                        </div>
                        <span className="text-xs text-slate-400">{p.sku}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warehouses */}
              {results.warehouses?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center">
                    <Warehouse className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Warehouses ({results.warehouses.length})
                  </div>
                  <div className="space-y-1">
                    {results.warehouses.map((w: any) => (
                      <div
                        key={w.id}
                        onClick={() => handleSelect(`/warehouses`)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/70 cursor-pointer transition text-sm"
                      >
                        <div>
                          <span className="font-semibold text-amber-300">{w.code}</span>
                          <span className="text-xs text-slate-300 ml-2">{w.name} ({w.city})</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${w.api_status === 'sync_error' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {w.api_status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers */}
              {results.customers?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1.5 text-purple-400" /> Customers ({results.customers.length})
                  </div>
                  <div className="space-y-1">
                    {results.customers.map((c: any) => (
                      <div
                        key={c.customer_id}
                        onClick={() => handleSelect(`/customers/${c.customer_id}`)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/70 cursor-pointer transition text-sm"
                      >
                        <div>
                          <span className="font-semibold text-white">{c.name}</span>
                          <span className="text-xs text-slate-400 ml-2">({c.customer_id}) - {c.city}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">{c.segment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
