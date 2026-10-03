import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import {
  Sparkles,
  Zap,
  TrendingUp,
  Star,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle,
  Tag,
  Clock,
  Layers
} from 'lucide-react';

export const StoreHome: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart, recentViewed } = useStore();

  const [featured, setFeatured] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [featRes, dealsRes, catRes, popRes] = await Promise.all([
          fetch('/api/products/featured').then(r => r.json()),
          fetch('/api/products/deals').then(r => r.json()),
          fetch('/api/products/categories').then(r => r.json()),
          fetch('/api/products?sort=popular&limit=8').then(r => r.json())
        ]);

        setFeatured(featRes.featured || []);
        setDeals(dealsRes.deals || []);
        setCategories(catRes.categories || []);
        setPopular(popRes.data || []);
      } catch (err) {
        console.error('Error loading storefront data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setAddedToast(`Added ${product.name.slice(0, 32)}... to cart!`);
    setTimeout(() => setAddedToast(null), 3000);
  };

  const handleBuyNow = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    navigate('/store/checkout');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Alert */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-amber-500/40 flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-medium">{addedToast}</span>
          <Link to="/store/cart" className="text-xs bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded hover:bg-amber-300">
            View Cart
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white py-12 md:py-16 px-4 overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Pan-India Festive Season &bull; Up to 50% Off Top Tech
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Everything you need. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-200">
                Delivered.
              </span>
            </h1>

            <p className="text-slate-300 text-sm md:text-base max-w-xl leading-relaxed">
              Explore 2,000+ authentic multi-category products fulfilled across 5 national robotic hubs with guaranteed same-day dispatch and 100% verified order tracking.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/store/products"
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2"
              >
                <span>Browse All Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/store/product/P-204"
                className="bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold px-5 py-3 rounded-xl text-sm border border-slate-700 transition-colors flex items-center gap-2"
              >
                <Tag className="w-4 h-4 text-amber-400" />
                <span>Featured: Wireless Keyboard P-204</span>
              </Link>
            </div>

            {/* Quick Guarantees Strip */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Express 24-48h Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Easy 10-Day Returns</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>100% Genuine Brands</span>
              </div>
            </div>
          </div>

          {/* Hero Featured Spotlight Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-slate-800/90 rounded-2xl p-5 border border-slate-700 shadow-2xl backdrop-blur-sm relative group">
              <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[11px] px-3 py-1 rounded-full uppercase tracking-wider shadow">
                FDE Scenario Benchmark
              </div>

              <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-slate-900 border border-slate-700/60 relative">
                <img
                  src="https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80"
                  alt="Wireless Keyboard P-204"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded text-xs text-amber-300 font-semibold border border-amber-500/30">
                  Model: P-204 &bull; In Stock
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                    Electronics &bull; AeroPulse &amp; KeyTech
                  </span>
                  <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>4.4 (482 reviews)</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Wireless Keyboard P-204 &amp; AeroPulse Controller
                </h3>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-2xl font-black text-white">₹3,499</span>
                  <span className="text-xs text-slate-400 line-through">₹4,999</span>
                  <span className="text-xs text-emerald-400 font-bold">30% OFF</span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={(e) => handleAddToCart({
                      product_id: 'P-204',
                      sku: 'AP-FIT-204',
                      name: 'Wireless Keyboard P-204 & AeroPulse Smart Controller',
                      price: 3499.0,
                      original_price: 4999.0,
                      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
                      category: 'Electronics'
                    }, e)}
                    className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" /> Add to Cart
                  </button>
                  <button
                    onClick={(e) => handleBuyNow({
                      product_id: 'P-204',
                      sku: 'AP-FIT-204',
                      name: 'Wireless Keyboard P-204 & AeroPulse Smart Controller',
                      price: 3499.0,
                      original_price: 4999.0,
                      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
                      category: 'Electronics'
                    }, e)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Zap className="w-4 h-4" /> Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Omnichannel Story Bridge Callout */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-indigo-900/40 border border-indigo-500/30 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Full-Stack End-to-End Operational Lifecycle
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Customer places order here &rarr; Stock reserved at Regional Warehouse &rarr; Delivery incident simulated &rarr; Customer files complaint &rarr; AI diagnoses root cause &amp; recommends stock transfer &rarr; Customer receives real-time update!
              </p>
            </div>
          </div>
          <Link
            to="/scenarios"
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow"
          >
            <span>Run 14-Step Demo Scenario</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Category Grid Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Shop by Category</h2>
            <p className="text-xs text-slate-500">Explore authentic products organized across our regional warehouses</p>
          </div>
          <Link to="/store/products" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`/store/products?category=${encodeURIComponent(cat.name)}`}
              className="group bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all hover:border-amber-400 overflow-hidden text-center"
            >
              <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-slate-100">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="font-bold text-xs text-slate-800 group-hover:text-amber-600 transition-colors">
                {cat.name}
              </div>
              <div className="text-[11px] text-slate-400">
                {cat.count} Items
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Flash Deals of the Day */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Zap className="w-5 h-5 fill-rose-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Deals of the Day</span>
                  <span className="text-[11px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                    Limited Period
                  </span>
                </h2>
                <p className="text-xs text-slate-500">Up to 40% off on top-selling inventory</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Ends in 08h : 42m : 15s</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {deals.slice(0, 5).map((prod) => (
              <Link
                key={prod.product_id}
                to={`/store/product/${prod.product_id}`}
                className="group border border-slate-200 rounded-xl p-3 hover:shadow-lg transition-all hover:border-amber-400 bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-2 relative">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                      {prod.discount_percent}% OFF
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    {prod.brand}
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-amber-600 transition-colors mt-0.5">
                    {prod.name}
                  </h4>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-sm text-slate-900">
                      ₹{prod.price?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-400 line-through">
                      ₹{prod.original_price?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleAddToCart(prod, e)}
                    className="w-full mt-2 bg-slate-100 hover:bg-amber-400 text-slate-800 hover:text-slate-950 font-bold text-[11px] py-1.5 rounded transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Catalog Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Featured Products</h2>
            <p className="text-xs text-slate-500">Benchmark consumer goods ready for immediate regional fulfillment</p>
          </div>
          <Link to="/store/products" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {featured.map((prod) => (
            <div
              key={prod.product_id}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all hover:border-amber-400 flex flex-col justify-between group"
            >
              <div>
                <Link to={`/store/product/${prod.product_id}`} className="block aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 mb-3 relative">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {prod.product_id === 'P-204' && (
                    <span className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      Scenario Benchmark
                    </span>
                  )}
                </Link>

                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[11px] font-semibold text-slate-400">{prod.brand}</span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{prod.rating}</span>
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
                  <span className="text-xs text-slate-400 line-through">
                    ₹{prod.original_price?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-emerald-600 font-bold">
                    {prod.discount_percent}% off
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => handleAddToCart(prod, e)}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-2 rounded-lg text-xs transition-colors"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={(e) => handleBuyNow(prod, e)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-xs transition-colors"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Trending Strip */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold">Top Trending Today</h2>
            </div>
            <Link to="/store/products?sort=popular" className="text-xs text-amber-400 hover:underline">
              View All Popular &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popular.slice(0, 4).map((p) => (
              <Link
                key={p.product_id}
                to={`/store/product/${p.product_id}`}
                className="bg-slate-800/80 hover:bg-slate-800 p-3 rounded-xl border border-slate-700 hover:border-amber-400/60 transition-all group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-slate-950 mb-2">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="text-[10px] text-amber-400 font-semibold">{p.category}</div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-300 line-clamp-1">
                  {p.name}
                </h4>
                <div className="text-sm font-black text-white mt-1">
                  ₹{p.price?.toLocaleString('en-IN')}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
