import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AuthModal from './components/auth/AuthModal';
import TableMate from './components/agent/TableMate';
import { useAuthStore } from './store/authStore';
import RatingBarrier from './components/order/RatingBarrier';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
// Each page is split into its own JS chunk and only downloaded when first visited.
const HomePage          = lazy(() => import('./pages/HomePage'));
const RestaurantPage    = lazy(() => import('./pages/RestaurantPage'));
const CartPage          = lazy(() => import('./pages/CartPage'));
const CheckoutPage      = lazy(() => import('./pages/CheckoutPage'));
const OrderPreviewPage  = lazy(() => import('./pages/OrderPreviewPage'));
const OrderSuccessPage  = lazy(() => import('./pages/OrderSuccessPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));
const OrderHistoryPage  = lazy(() => import('./pages/OrderHistoryPage'));
const ProfilePage       = lazy(() => import('./pages/ProfilePage'));

// ── Minimal page loader shown while a lazy chunk is downloading ───────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading…</p>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes location={location} key={location.key}>
        <Route path="/"                    element={<HomePage />} />
        <Route path="/restaurant/:id"      element={<RestaurantPage />} />
        <Route path="/cart"                element={<CartPage />} />
        <Route path="/checkout"            element={<CheckoutPage />} />
        <Route path="/checkout/summary"    element={<OrderPreviewPage />} />
        <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
        <Route path="/track/:orderId"      element={<OrderTrackingPage />} />
        <Route path="/orders"              element={<OrderHistoryPage />} />
        <Route path="/profile"             element={<ProfilePage />} />
      </Routes>
    </Suspense>
  );
}

function AppContent() {
  const { initialize } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initialize();
    
    // Hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              transition: { duration: 0.5, ease: 'easeInOut' }
            }}
            className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center"
          >
            {/* Logo icon and water-wave animated text */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
              }}
              className="flex flex-col items-center justify-center text-center"
            >
              {/* Crop the orange square logo icon from /logo.png */}
              <div className="w-20 h-20 overflow-hidden relative rounded-3xl mb-4 shadow-sm flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt="zunoindia icon" 
                  className="w-20 h-20 object-cover object-left"
                />
              </div>

              {/* Animated water wave text */}
              <div className="water-text font-heading font-extrabold text-4xl tracking-wider select-none leading-none">
                ZunoIndia
                <span className="water-text-fill">ZunoIndia</span>
              </div>
            </motion.div>
            
            {/* Bounce loader similar to Swiggy/Zomato */}
            <div className="absolute bottom-16 flex flex-col items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase">zunoindia</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        <TableMate />
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
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
