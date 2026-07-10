import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { MapPin, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import PageTransition from '../components/layout/PageTransition';
import { useOrderTracking } from '../hooks/useOrderTracking';
import { formatCurrency, formatTime, formatDate } from '../utils/formatters';

function CheckmarkSVG() {
  return (
    <svg className="w-16 h-16" viewBox="0 0 100 100">
      <motion.circle
        cx="50" cy="50" r="46"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      <motion.path
        d="M 25 50 L 43 68 L 75 32"
        fill="none"
        stroke="white"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.5 }}
      />
    </svg>
  );
}

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const { order, loading } = useOrderTracking(orderId);
  const confettiFired = useRef(false);
  const { user } = useAuthStore();

  const [checkingCancel, setCheckingCancel] = useState(false);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [cancelCount, setCancelCount] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  const handleCancelClick = async () => {
    if (!user) return;
    setCheckingCancel(true);
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id)
        .eq('status', 'cancelled');
      
      if (error) throw error;
      setCancelCount(count || 0);
      setShowCancelPopup(true);
    } catch (err) {
      toast.error('Failed to check cancellation policy.');
      console.error(err);
    } finally {
      setCheckingCancel(false);
    }
  };

  const confirmCancellation = async () => {
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      await supabase
        .from('order_status_log')
        .insert({
          order_id: orderId,
          status: 'cancelled'
        });

      toast.success('Pre-order cancelled successfully.');
      setShowCancelPopup(false);
    } catch (err) {
      toast.error('Order cancellation failed.');
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (!confettiFired.current) {
      confettiFired.current = true;
      // Delay slightly for page to render
      setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FB923C', '#F97316'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
          });
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
          });
        }, 400);
      }, 300);
    }
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen pt-20 pb-8 px-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          {/* Success animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mb-4 shadow-amber-lg">
              <CheckmarkSVG />
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="font-heading font-extrabold text-3xl text-dark-800 text-center"
            >
              Order Placed! 🎉
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-gray-500 text-center mt-2"
            >
              Your food will be ready when you arrive
            </motion.p>
          </motion.div>

          {/* Order details card */}
          {!loading && order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="card p-5 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-dark-800">Order Details</h3>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full
                  ${order.status === 'cancelled' 
                    ? 'bg-red-50 text-red-600' 
                    : 'bg-green-50 text-green-600'
                  }`}
                >
                  {order.status === 'cancelled' ? 'Cancelled' : 'Confirmed'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">🍽️</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Restaurant</p>
                    <p className="font-semibold text-dark-800 text-sm">
                      {order.restaurants?.name || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Arrive by</p>
                    <p className="font-semibold text-dark-800 text-sm">
                      {order.arrival_time
                        ? `${formatDate(order.arrival_time)}, ${formatTime(order.arrival_time)}`
                        : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">👥</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Guests</p>
                    <p className="font-semibold text-dark-800 text-sm">
                      {order.num_guests || 2} {order.num_guests === 1 ? 'Guest' : 'Guests'}
                    </p>
                  </div>
                </div>

                {order.order_tables && order.order_tables.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">🪑</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Booked Table(s)</p>
                      <p className="font-semibold text-dark-800 text-sm">
                        {order.order_tables
                          .map(ot => ot.restaurant_tables?.table_number.match(/Table\s+\d+/)?.[0] || ot.restaurant_tables?.table_number)
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100 flex justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total Bill</p>
                    <p className="font-bold text-dark-800">{formatCurrency(order.total_amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Paid Now</p>
                    <p className="font-bold text-amber-600">{formatCurrency(order.advance_paid_amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">At Restaurant</p>
                    <p className="font-bold text-gray-600">{formatCurrency(order.remaining_amount)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="flex flex-col gap-3"
          >
            {!loading && order && order.status !== 'cancelled' && (
              <Link to={`/track/${orderId}`} className="btn-primary text-center w-full flex items-center justify-center gap-2">
                Track Order Live
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
            <Link to="/" className="btn-secondary text-center w-full">
              Order from Another Restaurant
            </Link>


            {!loading && order && order.status !== 'cancelled' && (
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={checkingCancel}
                className="bg-white hover:bg-red-50 text-red-500 hover:text-red-600 font-semibold px-6 py-3 rounded-2xl border border-red-200 hover:border-red-300 transition-all duration-200 active:scale-95 w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingCancel ? 'Checking policy...' : 'Cancel Order'}
              </button>
            )}
          </motion.div>
        </div>
      </div>
      {/* Cancellation Warning Modal */}
      <AnimatePresence>
        {showCancelPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !cancelling && setShowCancelPopup(false)}
              className="absolute inset-0 bg-dark-800/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative z-10 border border-gray-100 p-6 text-center"
            >
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>

              <h3 className="font-heading font-extrabold text-xl text-dark-800 mb-3">
                Cancel Pre-Order
              </h3>

              {cancelCount < 3 ? (
                <div className="space-y-3 mb-6 text-left text-sm text-gray-600">
                  <p>
                    For the first 3 cancellations you will get refund, after that no refund.
                  </p>
                  <div className="bg-emerald-50 border-l-2 border-emerald-500 p-3 rounded-r-lg text-emerald-800">
                    <p className="font-bold">Refund Status: Eligible</p>
                    <p className="text-xs mt-0.5">
                      You have cancelled <strong>{cancelCount}</strong> order(s) so far. Since this is within the limit, you will receive a full refund of your 50% advance payment.
                    </p>
                  </div>
                  <p className="text-center font-bold text-dark-800 mt-2">
                    Do you want to cancel this order?
                  </p>
                </div>
              ) : (
                <div className="space-y-3 mb-6 text-left text-sm text-gray-600">
                  <p>
                    For the first 3 cancellations you will get refund, after that no refund.
                  </p>
                  <div className="bg-red-50 border-l-2 border-red-500 p-3 rounded-r-lg text-red-800">
                    <p className="font-bold">Refund Status: NOT Eligible</p>
                    <p className="text-xs mt-0.5">
                      You have already cancelled <strong>{cancelCount}</strong> order(s). Because you have exceeded the 3-cancellation limit, you will not receive any refund for this cancellation.
                    </p>
                  </div>
                  <p className="text-center font-bold text-dark-800 mt-2">
                    Do you want to cancel this order?
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelPopup(false)}
                  disabled={cancelling}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  No, Keep It
                </button>
                <button
                  onClick={confirmCancellation}
                  disabled={cancelling}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-heading font-bold py-3 rounded-xl shadow-md shadow-red-200 transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-75"
                >
                  {cancelling ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Yes, Cancel'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
