import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import {
  CheckCircle,
  CreditCard,
  Truck,
  MapPin,
  ShieldCheck,
  Zap,
  ArrowRight,
  AlertTriangle,
  Building2,
  Package,
  Clock,
  Check
} from 'lucide-react';

export const StoreCheckout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, cartSubtotal, cartTax, cartTotal, savedAddress, setSavedAddress, clearCart } = useStore();

  const [step, setStep] = useState<number>(1);
  const [addressForm, setAddressForm] = useState(savedAddress);
  const [deliveryMethod, setDeliveryMethod] = useState<'Standard' | 'Express'>('Standard');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'COD' | 'Wallet'>('UPI');
  const [simulateFailure, setSimulateFailure] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const deliveryFee = deliveryMethod === 'Express' ? 150 : (cartSubtotal > 499 ? 0 : 50);
  const finalTotal = cartSubtotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Save current address to context & localstorage
      setSavedAddress(addressForm);

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            sku: item.sku
          })),
          customerName: addressForm.name,
          customerPhone: addressForm.phone,
          shippingAddress: addressForm.address,
          shippingCity: addressForm.city,
          shippingState: addressForm.state,
          shippingPincode: addressForm.pincode,
          deliveryMethod,
          paymentMethod,
          simulatePaymentFailure: simulateFailure,
          channel: 'WEBSITE'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.paymentStatus === 'FAILED') {
          setErrorMessage('PAYMENT SIMULATION FAILURE: Payment declined by gateway. Order was not confirmed.');
        } else {
          setErrorMessage(data.error || 'Failed to place order.');
        }
        setIsProcessing(false);
        return;
      }

      setOrderResult(data);
      clearCart();
      setStep(4); // Step 4: Confirmation screen!
    } catch (err: any) {
      setErrorMessage('Network or server error during checkout: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0 && !orderResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">Add products to your cart before proceeding to checkout.</p>
        <Link to="/store/products" className="inline-block bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs">
          Return to Storefront
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Checkout Progress Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[
            { num: 1, label: 'Shipping Address' },
            { num: 2, label: 'Delivery Method' },
            { num: 3, label: 'Payment Options' },
            { num: 4, label: 'Order Confirmation' }
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    step === s.num
                      ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-100'
                      : step > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-xs font-semibold hidden md:inline ${step === s.num ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                  {s.label}
                </span>
              </div>
              {idx < 3 && <div className={`flex-1 h-0.5 mx-2 ${step > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div className="flex-1 font-semibold">{errorMessage}</div>
        </div>
      )}

      {/* STEP 4: ORDER CONFIRMED SUCCESS SCREEN */}
      {step === 4 && orderResult ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 shadow-sm max-w-3xl mx-auto text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Payment &amp; Order Confirmed
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-2">
              Thank You for Your Order!
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Your order <strong className="text-slate-900 font-bold">{orderResult.order?.order_number}</strong> has been created in PostgreSQL and allocated to fulfillment center.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-left space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Order Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{orderResult.order?.order_number}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Total Paid</span>
                <span className="font-bold text-slate-900 text-sm">₹{orderResult.order?.total_amount?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Allocated Warehouse</span>
                <div className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  {orderResult.order?.warehouse?.name || 'W03 Coimbatore Hub'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Expected Delivery</span>
                <div className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  {new Date(orderResult.order?.expected_delivery).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Shipping Destination</span>
              <div className="font-medium text-slate-800 mt-0.5">{orderResult.order?.shipping_city} Address: {addressForm.address}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to={`/store/orders/${orderResult.order?.order_number}`}
              className="w-full sm:w-auto bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow"
            >
              <Package className="w-4 h-4" /> Track Order Milestone Timeline
            </Link>
            <Link
              to="/store/products"
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      ) : (
        /* CHECKOUT FORM STEPS (1-3) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* STEP 1: ADDRESS */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-500" />
                    <span>Step 1: Delivery Address in India</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={addressForm.name}
                      onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number (+91)</label>
                    <input
                      type="text"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Street Address / House No / Landmark</label>
                    <input
                      type="text"
                      value={addressForm.address}
                      onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">PIN Code (6 Digits)</label>
                    <input
                      type="text"
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <span>Proceed to Delivery Method</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DELIVERY METHOD */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-amber-500" />
                    <span>Step 2: Choose Delivery Method</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setDeliveryMethod('Standard')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      deliveryMethod === 'Standard'
                        ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-300'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">Standard Hub Delivery</span>
                      <span className="text-xs font-bold text-emerald-600">FREE</span>
                    </div>
                    <p className="text-xs text-slate-500">Delivery within 3-4 business days via regular logistics network.</p>
                  </div>

                  <div
                    onClick={() => setDeliveryMethod('Express')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      deliveryMethod === 'Express'
                        ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-300'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900 flex items-center gap-1">
                        <Zap className="w-4 h-4 text-amber-500" /> Express Air Parcel
                      </span>
                      <span className="text-xs font-bold text-slate-900">₹150</span>
                    </div>
                    <p className="text-xs text-slate-500">Guaranteed delivery within 24-48 hours with priority dispatch.</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2"
                  >
                    &larr; Back to Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT METHOD & SIMULATION */}
            {step === 3 && (
              <form onSubmit={handlePlaceOrder} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-500" />
                    <span>Step 3: Payment Options &amp; Verification</span>
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'UPI', label: 'UPI / GooglePay' },
                    { id: 'Card', label: 'Credit / Debit Card' },
                    { id: 'COD', label: 'Cash on Delivery' },
                    { id: 'Wallet', label: 'ShopSphere Wallet' }
                  ].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setPaymentMethod(p.id as any)}
                      className={`p-3 rounded-xl border text-center cursor-pointer text-xs font-bold transition-all ${
                        paymentMethod === p.id
                          ? 'border-amber-400 bg-amber-50 text-amber-950 ring-2 ring-amber-300'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </div>
                  ))}
                </div>

                {/* Demo Payment Failure Simulator Checkbox (Requirement 10) */}
                <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="simFail"
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                      className="w-4 h-4 text-amber-400 rounded cursor-pointer"
                    />
                    <label htmlFor="simFail" className="text-xs font-bold text-amber-300 cursor-pointer">
                      ⚡ Demo Simulator: Force Payment Authorization Failure (PAY-FAILED)
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Check this box to demonstrate requirement #10 (Payment API rejection flow). When enabled, payment fails and order will not be confirmed in PostgreSQL.
                  </p>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2"
                  >
                    &larr; Back to Delivery
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs px-8 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Communicating with Payment Gateway...</span>
                      </>
                    ) : (
                      <>
                        <span>Pay ₹{finalTotal.toLocaleString('en-IN')} &amp; Place Order</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Checkout Summary Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
                Order Review ({cart.length} Items)
              </h3>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded bg-slate-100 object-cover" />
                      <div>
                        <div className="font-bold text-slate-900 line-clamp-1">{item.name}</div>
                        <div className="text-[10px] text-slate-400">Qty: {item.quantity}</div>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping ({deliveryMethod}):</span>
                  <span className="font-bold text-slate-900">
                    {deliveryFee === 0 ? <span className="text-emerald-600">FREE</span> : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax:</span>
                  <span className="font-bold text-slate-900">₹{cartTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm">Total:</span>
                  <span className="text-xl font-black text-slate-900">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreCheckout;
