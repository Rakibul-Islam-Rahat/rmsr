import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './components/common/Modal.css';

// Customer pages
import Home from './pages/customer/Home';
import Restaurants from './pages/customer/Restaurants';
import RestaurantDetail from './pages/customer/RestaurantDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Orders from './pages/customer/Orders';
import OrderTracking from './pages/customer/OrderTracking';
import Profile from './pages/customer/Profile';
import Loyalty from './pages/customer/Loyalty';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Restaurant owner pages
import RestaurantDashboard from './pages/restaurant/Dashboard';
import RestaurantOrders from './pages/restaurant/Orders';
import RestaurantMenu from './pages/restaurant/Menu';
import RestaurantSettings from './pages/restaurant/Settings';
import RestaurantAnalytics from './pages/restaurant/Analytics';

// Rider pages
import RiderDashboard from './pages/rider/Dashboard';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminRestaurants from './pages/admin/Restaurants';
import AdminUsers from './pages/admin/Users';
import AdminOrders from './pages/admin/Orders';
import AdminEarnings from './pages/admin/Earnings';

// Common components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import PaymentResult from './pages/customer/PaymentResult';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  // Only redirect logged-in users away from login/register/forgot-password
  // They can still visit home, restaurants etc.
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'restaurant_owner') return <Navigate to="/restaurant" replace />;
    if (user.role === 'rider') return <Navigate to="/rider" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
};

const CustomerLayout = ({ children }) => (
  <>
    <Navbar />
    <main style={{ minHeight: 'calc(100vh - 140px)', paddingTop: '64px' }}>{children}</main>
    <Footer />
  </>
);

/* Customer dashboard pages — no Navbar/Footer, full viewport */
const CustomerDashLayout = ({ children }) => (
  <main style={{ minHeight: '100vh' }}>{children}</main>
);

const DashboardLayout = ({ children }) => (
  <main style={{ minHeight: '100vh' }}>{children}</main>
);

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* Customer */}
      <Route path="/" element={<CustomerLayout><Home /></CustomerLayout>} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/restaurants" element={<CustomerLayout><Restaurants /></CustomerLayout>} />
      <Route path="/restaurants/:id" element={<CustomerLayout><RestaurantDetail /></CustomerLayout>} />
      <Route path="/cart" element={<CustomerDashLayout><Cart /></CustomerDashLayout>} />
      <Route path="/checkout" element={<ProtectedRoute roles={['customer']}><CustomerDashLayout><Checkout /></CustomerDashLayout></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute roles={['customer']}><CustomerDashLayout><Orders /></CustomerDashLayout></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute roles={['customer']}><CustomerDashLayout><OrderTracking /></CustomerDashLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute roles={['customer']}><CustomerDashLayout><Profile /></CustomerDashLayout></ProtectedRoute>} />
      <Route path="/loyalty" element={<ProtectedRoute roles={['customer']}><CustomerDashLayout><Loyalty /></CustomerDashLayout></ProtectedRoute>} />
      <Route path="/payment/*" element={<CustomerLayout><PaymentResult /></CustomerLayout>} />

      {/* Restaurant Owner */}
      <Route path="/restaurant" element={<ProtectedRoute roles={['restaurant_owner']}><DashboardLayout><RestaurantDashboard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/restaurant/orders" element={<ProtectedRoute roles={['restaurant_owner']}><DashboardLayout><RestaurantOrders /></DashboardLayout></ProtectedRoute>} />
      <Route path="/restaurant/menu" element={<ProtectedRoute roles={['restaurant_owner']}><DashboardLayout><RestaurantMenu /></DashboardLayout></ProtectedRoute>} />
      <Route path="/restaurant/settings" element={<ProtectedRoute roles={['restaurant_owner']}><DashboardLayout><RestaurantSettings /></DashboardLayout></ProtectedRoute>} />
      <Route path="/restaurant/analytics" element={<ProtectedRoute roles={['restaurant_owner']}><DashboardLayout><RestaurantAnalytics /></DashboardLayout></ProtectedRoute>} />

      {/* Rider */}
      <Route path="/rider" element={<ProtectedRoute roles={['rider']}><DashboardLayout><RiderDashboard /></DashboardLayout></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/restaurants" element={<ProtectedRoute roles={['admin']}><DashboardLayout><AdminRestaurants /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><DashboardLayout><AdminUsers /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><DashboardLayout><AdminOrders /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/earnings" element={<ProtectedRoute roles={['admin']}><DashboardLayout><AdminEarnings /></DashboardLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontFamily: 'Nunito, sans-serif', fontWeight: 600 } }} />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
