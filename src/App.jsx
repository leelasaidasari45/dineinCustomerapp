import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AuthModal from './components/auth/AuthModal';
import HomePage from './pages/HomePage';
import RestaurantPage from './pages/RestaurantPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import ProfilePage from './pages/ProfilePage';
import { useAuthStore } from './store/authStore';
import RatingBarrier from './components/order/RatingBarrier';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.key}>
      <Route path="/" element={<HomePage />} />
      <Route path="/restaurant/:id" element={<RestaurantPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
      <Route path="/track/:orderId" element={<OrderTrackingPage />} />
      <Route path="/orders" element={<OrderHistoryPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}

function AppContent() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      <ScrollToTop />
      <Navbar />
      <div className="flex-grow">
        <ErrorBoundary>
          <AnimatedRoutes />
        </ErrorBoundary>
      </div>
      <Footer />
      <AuthModal />
      <RatingBarrier />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1F2937',
            color: '#fff',
            borderRadius: '16px',
            fontSize: '14px',
          },
          success: {
            style: {
              background: '#065F46',
            },
          },
          error: {
            style: {
              background: '#7F1D1D',
            },
          },
        }}
        richColors
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
