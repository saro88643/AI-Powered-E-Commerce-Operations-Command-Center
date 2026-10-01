import React, { useState, useEffect } from 'react';
import { Package, Search, AlertTriangle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/client';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [highReturnOnly, setHighReturnOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: {
          page,
          limit: 15,
          category: categoryFilter || undefined,
          minReturnRate: highReturnOnly ? 0.15 : undefined,
          search: search || undefined
        }
      });
      setProducts(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      console.error('Failed to fetch products:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, highReturnOnly]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Package className="w-5 h-5 text-cyan-400" />
            <span>Product Catalog & Quality Metrics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Omnichannel SKU master, return rate anomalies, reorder thresholds, and supplier linkage.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Total Products: <span className="text-white font-bold">{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search product name, SKU or ID (e.g. P-204, P-512)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={fetchProducts}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
          >
            Search
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Office & Computing">Office & Computing</option>
            <option value="Fitness & Health">Fitness & Health</option>
            <option value="Home & Kitchen">Home & Kitchen</option>
            <option value="Apparel & Fashion">Apparel & Fashion</option>
          </select>

          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
            <input
              type="checkbox"
              checked={highReturnOnly}
              onChange={(e) => { setHighReturnOnly(e.target.checked); setPage(1); }}
              className="rounded bg-slate-800 border-slate-600 text-brand-600 focus:ring-0"
            />
            <span>High Return Rate (&gt;15%)</span>
          </label>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Product ID</th>
                <th className="py-3 px-4">Name / Brand</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Return Rate</th>
                <th className="py-3 px-4">Reorder Level</th>
                <th className="py-3 px-4">Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">Loading product catalog...</td>
                </tr>
              ) : (
                products.map((p) => {
                  const isHighReturn = p.return_rate > 0.15;
                  const isP204 = p.product_id === 'P-204';
                  return (
                    <tr
                      key={p.product_id}
                      className={`hover:bg-slate-800/40 transition ${
                        isP204 ? 'bg-amber-500/5' : isHighReturn ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400 flex items-center space-x-1.5">
                        <span>{p.product_id}</span>
                        {isP204 && (
                          <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-sans">
                            MISMATCH
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white block">{p.name}</span>
                        <span className="text-[10px] text-slate-500">{p.brand}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{p.sku}</td>
                      <td className="py-3 px-4">{p.category}</td>
                      <td className="py-3 px-4 font-semibold text-white">₹{p.price?.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                            isHighReturn
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {(p.return_rate * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{p.reorder_threshold} units</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{p.supplier_id}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40">
          <span>Page {page} of {Math.max(1, Math.ceil(total / 15))}</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 15 >= total}
              className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
