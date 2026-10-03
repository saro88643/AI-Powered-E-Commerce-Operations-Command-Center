import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import {
  Star,
  ShoppingCart,
  Zap,
  Truck,
  RotateCcw,
  ShieldCheck,
  MapPin,
  Building2,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Share2,
  Heart,
  HelpCircle
} from 'lucide-react';

export const StoreProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, savedAddress, addRecentViewed } = useStore();

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedPincode, setSelectedPincode] = useState(savedAddress.pincode || '641012');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          addRecentViewed(data);
        }
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) fetchDetail();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    setToastMessage(`Added ${quantity} unit(s) of ${product.name.slice(0, 30)}... to cart!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity);
    navigate('/store/checkout');
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-mono">Querying Warehouse Inventory &amp; Specifications...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-xs text-slate-500">The requested product #{id} does not exist in the catalog.</p>
        <Link to="/store/products" className="inline-block bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs">
          Back to Store
        </Link>
      </div>
    );
  }

  const isLowStock = product.totalStock > 0 && product.totalStock < 50;
  const isOutOfStock = product.totalStock === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-amber-500/40 flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <Link to="/store/cart" className="text-xs bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded hover:bg-amber-300">
            View Cart
          </Link>
        </div>
      )}

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/store" className="hover:text-slate-900">Home</Link>
        <span>&rsaquo;</span>
        <Link to={`/store/products?category=${encodeURIComponent(product.category)}`} className="hover:text-slate-900">
          {product.category}
        </Link>
        <span>&rsaquo;</span>
        <span className="text-slate-900 font-semibold truncate max-w-md">{product.name}</span>
      </nav>

      {/* Main Product Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Showcase */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 relative group">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {product.product_id === 'P-204' && (
              <span className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                FDE Scenario Benchmark P-204
              </span>
            )}
            <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow hover:bg-white text-slate-600 hover:text-rose-500 transition-colors">
              <Heart className="w-4 h-4" />
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-slate-600 pt-2">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1">
              <Truck className="w-4 h-4 text-amber-500" />
              <span className="font-semibold">Pan-India Express</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1">
              <RotateCcw className="w-4 h-4 text-amber-500" />
              <span className="font-semibold">10-Day Return SLA</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span className="font-semibold">Genuine Warranty</span>
            </div>
          </div>
        </div>

        {/* Center Column: Product Details & Specs */}
        <div className="lg:col-span-4 space-y-5">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              <span>{product.brand}</span>
              <span>SKU: {product.sku}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Ratings */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                <span>{product.rating}</span>
                <Star className="w-3 h-3 fill-white" />
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {product.review_count} ratings &amp; customer reviews
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">
                ₹{product.price?.toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-slate-400 line-through">
                ₹{product.original_price?.toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-emerald-600 font-bold">
                {product.discount_percent}% off
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Inclusive of all taxes &bull; 18% GST invoice provided for business purchase
            </p>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Overview</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Specifications Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Specifications</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {product.specifications?.map((spec: any, idx: number) => (
                <div key={idx} className="grid grid-cols-2 p-2.5">
                  <span className="text-slate-500 font-medium">{spec.key}</span>
                  <span className="text-slate-900 font-bold">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Buy Box & Live Warehouse Stock */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            {/* Stock Availability Indicator (Section 7) */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                {isOutOfStock ? (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Only {product.totalStock} left in stock - order soon!
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> In Stock ({product.totalStock} units available)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Live availability queried directly from PostgreSQL inventory registry
              </p>
            </div>

            {/* Pincode & Delivery Estimate */}
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                Delivery to Coimbatore
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={selectedPincode}
                  onChange={(e) => setSelectedPincode(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none"
                  placeholder="Enter PIN code"
                />
                <button className="text-xs bg-slate-200 hover:bg-slate-300 font-bold px-3 py-1.5 rounded-lg text-slate-800">
                  Check
                </button>
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold">
                ✓ Free Delivery by Tomorrow 5:00 PM if ordered within 3 hrs
              </p>
            </div>

            {/* Quantity Picker */}
            {!isOutOfStock && (
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Quantity:</span>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                  className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white font-bold text-slate-800"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}

            {/* CTA Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>
              <button
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4 text-amber-400" /> Buy Now
              </button>
            </div>
          </div>

          {/* Live Warehouse Distribution Card (Prompt Section 7 & 12) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Regional Warehouse Stock</span>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                Live ERP
              </span>
            </div>

            <div className="space-y-2">
              {product.inventory?.map((wh: any) => (
                <div key={wh.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-none">
                  <div>
                    <div className="font-semibold text-slate-800">{wh.warehouse_name || wh.warehouse_code}</div>
                    <div className="text-[10px] text-slate-400">{wh.warehouse_city}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{wh.available_quantity} units</span>
                    <div className="text-[10px] text-emerald-600 font-medium">Ready to dispatch</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
              Order routing allocates closest facility (e.g. Coimbatore W03) to minimize transit delay.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
