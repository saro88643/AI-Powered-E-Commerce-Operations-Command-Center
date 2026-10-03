import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import {
  Search,
  Filter,
  Star,
  ShoppingCart,
  Zap,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';

export const StoreProducts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useStore();

  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter states initialized from URL params
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const sortParam = searchParams.get('sort') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const minRatingParam = searchParams.get('minRating') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(searchQuery);

  const categories = [
    'All Categories',
    'Electronics',
    'Office & Computing',
    'Apparel & Fashion',
    'Fitness & Health',
    'Home & Kitchen'
  ];

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (searchQuery) queryParams.set('search', searchQuery);
        if (categoryParam && categoryParam !== 'All Categories') queryParams.set('category', categoryParam);
        if (sortParam) queryParams.set('sort', sortParam);
        if (minPriceParam) queryParams.set('minPrice', minPriceParam);
        if (maxPriceParam) queryParams.set('maxPrice', maxPriceParam);
        if (minRatingParam) queryParams.set('minRating', minRatingParam);
        queryParams.set('page', pageParam.toString());
        queryParams.set('limit', '20');

        const res = await fetch(`/api/products?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.data || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, [searchQuery, categoryParam, sortParam, minPriceParam, maxPriceParam, minRatingParam, pageParam]);

  const updateFilter = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams);
    if (!val || val === 'All Categories') {
      next.delete(key);
    } else {
      next.set(key, val);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('search', searchInput.trim());
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setToastMessage(`Added "${product.name.slice(0, 30)}..." to your cart!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBuyNow = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    navigate('/store/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-amber-500/40 flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <Link to="/store/cart" className="text-xs bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded hover:bg-amber-300">
            View Cart
          </Link>
        </div>
      )}

      {/* Header & Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>ShopSphere Product Catalog</span>
            {searchQuery && (
              <span className="text-sm font-normal text-slate-500">
                &bull; Results for &ldquo;<strong>{searchQuery}</strong>&rdquo;
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Showing {products.length} of {total.toLocaleString('en-IN')} verified products with live regional warehouse stock
          </p>
        </div>

        {/* Sort & Quick Filter Bar */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Sort By:
          </label>
          <select
            value={sortParam}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">Featured Relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Highest Customer Rating</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters */}
        <aside className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Filter className="w-4 h-4 text-amber-500" />
              <span>Filters</span>
            </div>
            {(searchQuery || categoryParam || sortParam || minPriceParam || maxPriceParam || minRatingParam) && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Inline Search */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Search Catalog</label>
            <form onSubmit={handleSearchSubmit} className="flex gap-1.5">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="e.g. keyboard, P-204"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-3 rounded-lg flex items-center justify-center"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Categories</label>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => updateFilter('category', cat)}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                    (categoryParam === cat || (!categoryParam && cat === 'All Categories'))
                      ? 'bg-amber-50 text-amber-900 font-bold border border-amber-300'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat}</span>
                  {categoryParam === cat && <span className="text-amber-600 text-xs">&bull;</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Price Range (₹)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPriceParam}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPriceParam}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* Customer Rating Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Customer Rating</label>
            <div className="space-y-1.5">
              {[4, 3, 2].map((stars) => (
                <button
                  key={stars}
                  onClick={() => updateFilter('minRating', stars.toString())}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 ${
                    minRatingParam === stars.toString()
                      ? 'bg-amber-50 text-amber-900 font-bold border border-amber-300'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex text-amber-400">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <span>&amp; above</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fast Shortcut Callout */}
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs space-y-1">
            <span className="font-bold text-indigo-900">Demo Scenario Shortcut:</span>
            <p className="text-slate-600 text-[11px]">
              Search for <strong>&ldquo;keyboard&rdquo;</strong> or product <strong>P-204</strong> to proceed with the end-to-end incident demo!
            </p>
            <button
              onClick={() => {
                setSearchInput('keyboard');
                updateFilter('search', 'keyboard');
              }}
              className="text-xs text-indigo-600 font-bold hover:underline block pt-1"
            >
              Filter to P-204 &rarr;
            </button>
          </div>
        </aside>

        {/* Product Catalog Grid */}
        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-mono">Querying ShopSphere National Catalog...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No products found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No products matched your search or filters. Try adjusting your query or resetting all filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="bg-amber-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-amber-500"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((prod) => (
                <div
                  key={prod.product_id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-all hover:border-amber-400 flex flex-col justify-between group"
                >
                  <div>
                    <Link
                      to={`/store/product/${prod.product_id}`}
                      className="block aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 mb-3 relative"
                    >
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {prod.product_id === 'P-204' && (
                        <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                          Benchmark P-204
                        </span>
                      )}
                      <span className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                        {prod.category}
                      </span>
                    </Link>

                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {prod.brand}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{prod.rating}</span>
                        <span className="text-slate-400 font-normal">({prod.review_count})</span>
                      </div>
                    </div>

                    <Link
                      to={`/store/product/${prod.product_id}`}
                      className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2"
                    >
                      {prod.name}
                    </Link>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {prod.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-3">
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg font-black text-slate-900">
                        ₹{prod.price?.toLocaleString('en-IN')}
                      </span>
                      {prod.original_price && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{prod.original_price?.toLocaleString('en-IN')}
                        </span>
                      )}
                      {prod.discount_percent && (
                        <span className="text-xs text-emerald-600 font-bold">
                          {prod.discount_percent}% off
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => handleAddToCart(prod, e)}
                        className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Add
                      </button>
                      <button
                        onClick={(e) => handleBuyNow(prod, e)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5" /> Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={pageParam <= 1}
                onClick={() => updateFilter('page', (pageParam - 1).toString())}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold text-slate-700 px-3">
                Page {pageParam} of {totalPages}
              </span>

              <button
                disabled={pageParam >= totalPages}
                onClick={() => updateFilter('page', (pageParam + 1).toString())}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
