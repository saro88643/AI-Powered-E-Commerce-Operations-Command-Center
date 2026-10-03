import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const StoreCart: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartSubtotal,
    cartTax,
    cartTotal
  } = useStore();

  const handleCheckout = () => {
    if (cart.length === 0) return;
    navigate('/store/checkout');
  };

  const deliveryFee = cartSubtotal > 499 || cartSubtotal === 0 ? 0 : 50;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/store" className="hover:text-slate-900">Store</Link>
        <span>&rsaquo;</span>
        <span className="text-slate-900 font-semibold">Shopping Cart</span>
      </nav>

      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-amber-500" />
            <span>Shopping Cart ({cart.reduce((s, i) => s + i.quantity, 0)} Items)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Items are reserved for 15 minutes upon proceeding to checkout.
          </p>
        </div>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Cart
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Your ShopSphere cart is empty</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Explore 2,000+ multi-category products fulfilled across 5 national regional hubs with express delivery.
          </p>
          <Link
            to="/store/products"
            className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl hover:bg-amber-500 transition-colors shadow-sm"
          >
            <span>Start Shopping Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item.product_id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <Link to={`/store/product/${item.product_id}`} className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </Link>
                    <div className="space-y-1">
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                        {item.category || 'Electronics'}
                      </span>
                      <Link to={`/store/product/${item.product_id}`} className="font-bold text-sm text-slate-900 hover:text-amber-600 block line-clamp-1">
                        {item.name}
                      </Link>
                      <div className="text-xs text-slate-500 font-mono">
                        Model: {item.product_id} &bull; SKU: {item.sku || item.product_id}
                      </div>
                      <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> In Stock for immediate regional dispatch
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-none border-slate-100">
                    <div className="flex items-center border border-slate-300 rounded-lg bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="p-1.5 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="p-1.5 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-slate-900">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        ₹{item.price.toLocaleString('en-IN')} each
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Back link */}
            <div className="flex items-center justify-between">
              <Link to="/store/products" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary Box */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-black text-slate-900 tracking-tight pb-3 border-b border-slate-100">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items):</span>
                  <span className="font-bold text-slate-900">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Delivery Fee:</span>
                  <span className="font-bold text-slate-900">
                    {deliveryFee === 0 ? <span className="text-emerald-600">FREE</span> : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (18% GST incl.):</span>
                  <span className="font-bold text-slate-900">₹{cartTax.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {cartSubtotal < 500 && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Add ₹{(500 - cartSubtotal).toLocaleString('en-IN')} more to unlock FREE Express Shipping!</span>
                </div>
              )}

              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Order Value:</span>
                <span className="text-2xl font-black text-slate-900">
                  ₹{cartTotal.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> ShopSphere Checkout Protection
                </div>
                <p>100% Encrypted Transactions &bull; Instant Bank Confirmation &bull; Multi-Hub Warehouse Fulfillment</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreCart;
