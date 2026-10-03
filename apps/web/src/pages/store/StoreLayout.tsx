import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  MapPin,
  Bell,
  User,
  Package,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ExternalLink,
  LifeBuoy,
  Tag,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

export const StoreLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, unreadCount, savedAddress } = useStore();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/store/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/store/products');
    }
  };

  const categories = [
    'All Categories',
    'Electronics',
    'Office & Computing',
    'Apparel & Fashion',
    'Fitness & Health',
    'Home & Kitchen',
    'Deals of the Day'
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      {/* Top Banner & Command Center Bridge */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white text-xs py-2 px-4 border-b border-indigo-900/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded text-[11px] border border-amber-500/30">
              ⚡ LIVE STORE
            </span>
            <span className="hidden sm:inline text-slate-300">
              Free Express Delivery on orders above ₹499 across all Indian PIN codes
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              to="/organization"
              className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>Org Hierarchy</span>
            </Link>
            <div className="h-3 w-px bg-slate-700" />
            <Link
              to="/"
              className="group flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-md font-medium text-xs shadow-sm shadow-indigo-900/50 transition-all"
            >
              <span>⚡ Switch to Internal AI Operations Center</span>
              <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main E-Commerce Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4 md:gap-6">
          {/* Logo & Brand */}
          <Link to="/store" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight flex items-center">
                <span className="text-white">Shop</span>
                <span className="text-amber-400">Sphere</span>
              </div>
              <div className="text-[10px] text-slate-400 -mt-1 font-medium tracking-wide">
                .in &bull; Delivered.
              </div>
            </div>
          </Link>

          {/* Location Delivery Selector */}
          <div className="hidden lg:flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-700">
            <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-slate-400 text-[11px] leading-tight">Deliver to Aarav</div>
              <div className="font-bold text-white leading-tight">
                {savedAddress.city} {savedAddress.pincode}
              </div>
            </div>
          </div>

          {/* Search Bar with Category Dropdown */}
          <form onSubmit={handleSearch} className="flex-1 max-w-3xl">
            <div className="flex rounded-lg overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-amber-400 bg-white">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-100 text-slate-700 text-xs px-3 py-2.5 border-r border-slate-300 outline-none cursor-pointer hidden md:block"
              >
                <option value="All">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Office & Computing">Office & Computing</option>
                <option value="Apparel & Fashion">Apparel & Fashion</option>
                <option value="Fitness & Health">Fitness & Health</option>
                <option value="Home & Kitchen">Home & Kitchen</option>
              </select>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, Wireless Keyboard P-204..."
                className="w-full px-4 py-2.5 text-sm text-slate-900 outline-none"
              />
              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-5 flex items-center justify-center transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-slate-900" />
              </button>
            </div>
          </form>

          {/* Navigation Action Links */}
          <div className="flex items-center gap-3 md:gap-5 flex-shrink-0">
            {/* Returns & Orders */}
            <Link
              to="/store/orders"
              className="text-xs hover:text-amber-400 transition-colors hidden sm:block"
            >
              <div className="text-slate-400 text-[11px]">Returns</div>
              <div className="font-bold text-white">&amp; Orders</div>
            </Link>

            {/* Complaints */}
            <Link
              to="/store/complaints"
              className="text-xs hover:text-amber-400 transition-colors hidden md:block"
            >
              <div className="text-slate-400 text-[11px]">Help &amp;</div>
              <div className="font-bold text-white">Complaints</div>
            </Link>

            {/* Returns Center */}
            <Link
              to="/store/returns"
              className="text-xs hover:text-amber-400 transition-colors hidden lg:block"
            >
              <div className="text-slate-400 text-[11px]">RAG Policy</div>
              <div className="font-bold text-white">Returns</div>
            </Link>

            {/* Notifications Bell */}
            <Link
              to="/store/notifications"
              className="relative p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Profile */}
            <Link
              to="/store/profile"
              className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Customer Profile"
            >
              <User className="w-5 h-5 text-amber-400" />
              <span className="hidden xl:inline text-xs font-semibold">Aarav</span>
            </Link>

            {/* Cart Icon & Count */}
            <Link
              to="/store/cart"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 transition-colors group"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[11px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-white hidden sm:inline">Cart</span>
            </Link>
          </div>
        </div>

        {/* Secondary Category Navigation Strip */}
        <div className="bg-slate-800/90 border-t border-slate-700/60 px-4 py-1.5 text-xs text-slate-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-4 scrollbar-none">
            <div className="flex items-center gap-5 whitespace-nowrap">
              <Link
                to="/store/products"
                className="font-bold text-white hover:text-amber-400 flex items-center gap-1"
              >
                <Menu className="w-4 h-4" />
                All Products (2,050+)
              </Link>
              <Link
                to="/store/products?category=Electronics"
                className="hover:text-amber-400 transition-colors"
              >
                Electronics
              </Link>
              <Link
                to="/store/products?category=Office%20%26%20Computing"
                className="hover:text-amber-400 transition-colors"
              >
                Office &amp; Computing
              </Link>
              <Link
                to="/store/products?category=Apparel%20%26%20Fashion"
                className="hover:text-amber-400 transition-colors"
              >
                Apparel &amp; Fashion
              </Link>
              <Link
                to="/store/products?category=Fitness%20%26%20Health"
                className="hover:text-amber-400 transition-colors"
              >
                Fitness &amp; Health
              </Link>
              <Link
                to="/store/products?category=Home%20%26%20Kitchen"
                className="hover:text-amber-400 transition-colors"
              >
                Home &amp; Kitchen
              </Link>
              <Link
                to="/store/products?search=keyboard"
                className="text-amber-300 font-semibold flex items-center gap-1 hover:underline"
              >
                <Tag className="w-3.5 h-3.5" />
                Wireless Keyboard P-204 Spotlight
              </Link>
            </div>

            <div className="flex items-center gap-4 text-slate-400 text-[11px] whitespace-nowrap hidden sm:flex">
              <Link to="/store/orders" className="hover:text-white flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-amber-400" /> Track Consignment
              </Link>
              <Link to="/store/returns" className="hover:text-white flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Easy 10-Day Returns
              </Link>
              <Link to="/store/complaints" className="hover:text-white flex items-center gap-1">
                <LifeBuoy className="w-3.5 h-3.5 text-amber-400" /> 24x7 Customer Care
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Store Viewport */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* E-Commerce Footer */}
      <footer className="bg-slate-900 text-slate-300 text-xs border-t border-slate-800 mt-16">
        {/* Back to top button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-medium transition-colors border-b border-slate-700"
        >
          Back to Top ↑
        </button>

        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-white font-bold mb-3 text-sm">Get to Know Us</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/store" className="hover:underline">About ShopSphere India</Link></li>
              <li><Link to="/organization" className="hover:underline">Company Organization &amp; Leadership</Link></li>
              <li><Link to="/client" className="hover:underline">Enterprise Client Portal</Link></li>
              <li><Link to="/" className="hover:underline">AI Operations Command Center</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 text-sm">Fulfillment &amp; Warehousing</h4>
            <ul className="space-y-2 text-slate-400">
              <li>W01 &bull; Delhi Regional Fulfillment Center</li>
              <li>W02 &bull; Bengaluru Central Logistics Hub</li>
              <li>W03 &bull; Coimbatore Hub &amp; Regional Facility</li>
              <li>W04 &bull; Hyderabad Air Cargo Center</li>
              <li>W05 &bull; Mumbai Western Hub</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 text-sm">Customer Policies</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/store/returns" className="hover:underline">RAG Return Policy Guide</Link></li>
              <li><Link to="/store/orders" className="hover:underline">Shipping SLAs &amp; Tracking</Link></li>
              <li><Link to="/store/complaints" className="hover:underline">Complaints &amp; Officer Escalation</Link></li>
              <li><Link to="/store/notifications" className="hover:underline">SMS &amp; In-App Notifications</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 text-sm">ShopSphere Assurance</h4>
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4" /> 100% Genuine Guaranteed
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Every consignment is verified, barcode-inspected, and tracked across our national hub network.
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-700">
                Helpline: <strong>1800-SHOPSPHERE</strong> (Toll Free)
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 py-6 text-center text-slate-500 text-[11px]">
          &copy; 2026 ShopSphere India Technologies Pvt. Ltd. All rights reserved. Fictional enterprise simulation.
        </div>
      </footer>
    </div>
  );
};
