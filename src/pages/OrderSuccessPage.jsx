import { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
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
                <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full">
                  Confirmed
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
            <Link to={`/track/${orderId}`} className="btn-primary text-center w-full flex items-center justify-center gap-2">
              Track Order Live
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/" className="btn-secondary text-center w-full">
              Order from Another Restaurant
            </Link>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
