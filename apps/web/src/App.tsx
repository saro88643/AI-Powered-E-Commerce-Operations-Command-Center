import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { useAuth } from './context/AuthContext';

// Page imports
import { Dashboard } from './pages/Dashboard';
import { AICommandCenter } from './pages/AICommandCenter';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { Customers } from './pages/Customers';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { Warehouses } from './pages/Warehouses';
import { Delivery } from './pages/Delivery';
import { Support } from './pages/Support';
import { Returns } from './pages/Returns';
import { Incidents } from './pages/Incidents';
import { Integrations } from './pages/Integrations';
import { OnboardIntegration } from './pages/OnboardIntegration';
import { DataMapping } from './pages/DataMapping';
import { Deployment } from './pages/Deployment';
import { DataQuality } from './pages/DataQuality';
import { AuditLogs } from './pages/AuditLogs';
import { SystemLogs } from './pages/SystemLogs';
import { DemoScenarios } from './pages/DemoScenarios';
import { Login } from './pages/Login';
import { AdminUsers } from './pages/AdminUsers';
import { OrgHierarchy } from './pages/OrgHierarchy';
import { Complaints } from './pages/Complaints';
import { ClientPortal } from './pages/ClientPortal';
import { EmployeeGrievances } from './pages/EmployeeGrievances';

// Customer Storefront Page Imports
import { StoreLayout } from './pages/store/StoreLayout';
import { StoreHome } from './pages/store/StoreHome';
import { StoreProducts } from './pages/store/StoreProducts';
import { StoreProductDetail } from './pages/store/StoreProductDetail';
import { StoreCart } from './pages/store/StoreCart';
import { StoreCheckout } from './pages/store/StoreCheckout';
import { StoreOrders } from './pages/store/StoreOrders';
import { StoreOrderDetail } from './pages/store/StoreOrderDetail';
import { StoreReturns } from './pages/store/StoreReturns';
import { StoreComplaints } from './pages/store/StoreComplaints';
import { StoreNotifications } from './pages/store/StoreNotifications';
import { StoreProfile } from './pages/store/StoreProfile';

// Route guard requiring authenticated user
const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono tracking-widest uppercase text-indigo-400">
          Authenticating Operator Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <AppLayout />;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Customer Storefront Application Routes (Connected to ShopSphere Business Systems) */}
      <Route path="/store" element={<StoreLayout />}>
        <Route index element={<StoreHome />} />
        <Route path="products" element={<StoreProducts />} />
        <Route path="product/:id" element={<StoreProductDetail />} />
        <Route path="search" element={<StoreProducts />} />
        <Route path="cart" element={<StoreCart />} />
        <Route path="checkout" element={<StoreCheckout />} />
        <Route path="orders" element={<StoreOrders />} />
        <Route path="orders/:id" element={<StoreOrderDetail />} />
        <Route path="returns" element={<StoreReturns />} />
        <Route path="complaints" element={<StoreComplaints />} />
        <Route path="notifications" element={<StoreNotifications />} />
        <Route path="profile" element={<StoreProfile />} />
      </Route>

      {/* Protected Command Center Shell Layout */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ai" element={<AICommandCenter />} />
        <Route path="/scenarios" element={<DemoScenarios />} />
        
        {/* Real-World Client Portal */}
        <Route path="/client" element={<ClientPortal />} />

        {/* Complaints Desk & Real-Time Alerts */}
        <Route path="/complaints" element={<Complaints />} />

        {/* Department Hierarchy & Structure (Senior & Manager View) */}
        <Route path="/organization" element={<OrgHierarchy />} />

        {/* Confidential Employee Grievances Desk */}
        <Route path="/my-grievances" element={<EmployeeGrievances />} />

        {/* Orders & Fulfillment */}
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/warehouses" element={<Warehouses />} />
        <Route path="/delivery" element={<Delivery />} />
        
        {/* Catalog, CRM & Support */}
        <Route path="/products" element={<Products />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/support" element={<Support />} />
        <Route path="/returns" element={<Returns />} />
        
        {/* Enterprise FDE & Systems */}
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/integrations/onboard" element={<OnboardIntegration />} />
        <Route path="/integrations/mapping" element={<DataMapping />} />
        <Route path="/deployment" element={<Deployment />} />
        <Route path="/data-quality" element={<DataQuality />} />
        <Route path="/system/data-quality" element={<DataQuality />} />
        <Route path="/audit" element={<AuditLogs />} />
        <Route path="/system/logs" element={<SystemLogs />} />

        {/* Company Admin IAM & User Management */}
        <Route path="/admin/users" element={<AdminUsers />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
export default App;
