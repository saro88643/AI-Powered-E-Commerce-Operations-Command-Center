import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

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

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Main Command Center Shell Layout */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ai" element={<AICommandCenter />} />
        <Route path="/scenarios" element={<DemoScenarios />} />
        
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
export default App;
