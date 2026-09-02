import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { PrototypeControlBar } from './components/PrototypeControlBar';
import { UserRole } from './types';

// Customer Pages
import CustomerLayout from './pages/customer/CustomerLayout';
import Home from './pages/customer/Home';
import ProductDetails from './pages/customer/ProductDetails';
import Cart from './pages/customer/Cart';
import AddressSelection from './pages/customer/AddressSelection';
import DateSlotSelection from './pages/customer/DateSlotSelection';
import Payment from './pages/customer/Payment';
import OrderConfirmation from './pages/customer/OrderConfirmation';
import Orders from './pages/customer/Orders';
import Subscriptions from './pages/customer/Subscriptions';
import Profile from './pages/customer/Profile';

// Driver Pages
import DriverLayout from './pages/driver/DriverLayout';
import DriverHome from './pages/driver/DriverHome';
import DriverStopDetails from './pages/driver/DriverStopDetails';
import DriverExceptions from './pages/driver/DriverExceptions';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminRoutes from './pages/admin/AdminRoutes';
import AdminLiveMap from './pages/admin/AdminLiveMap';
import AdminExceptions from './pages/admin/AdminExceptions';

function AppContent() {
  const [role, setRole] = useState<UserRole>('customer');

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      {/* Dev-Only Controlled Identity & Debug Control Bar (Automatically disabled in production builds) */}
      {import.meta.env.DEV && <PrototypeControlBar currentRole={role} onRoleChange={setRole} />}
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {role === 'customer' && (
          <Routes>
            <Route path="/" element={<CustomerLayout />}>
              <Route index element={<Home />} />
              <Route path="product/:id" element={<ProductDetails />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout/address" element={<AddressSelection />} />
              <Route path="checkout/slot" element={<DateSlotSelection />} />
              <Route path="checkout/payment" element={<Payment />} />
              <Route path="checkout/confirmation/:orderId" element={<OrderConfirmation />} />
              <Route path="orders" element={<Orders />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        )}

        {role === 'driver' && (
          <Routes>
            <Route path="/" element={<DriverLayout />}>
              <Route index element={<DriverHome />} />
              <Route path="stop/:id" element={<DriverStopDetails />} />
              <Route path="exceptions" element={<DriverExceptions />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        )}

        {role === 'admin' && (
          <Routes>
            <Route path="/" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="routes" element={<AdminRoutes />} />
              <Route path="live" element={<AdminLiveMap />} />
              <Route path="exceptions" element={<AdminExceptions />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
