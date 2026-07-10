import { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import PageTransition from '../components/layout/PageTransition';
import StatusStepper from '../components/tracking/StatusStepper';
import CountdownTimer from '../components/tracking/CountdownTimer';
import { useOrderTracking } from '../hooks/useOrderTracking';
import { formatCurrency, formatTime, getStatusLabel } from '../utils/formatters';

const STATUS_MESSAGES = {
  confirmed: "✅ Your order is confirmed! Kitchen will start soon.",
  preparing: "👨‍🍳 Your food is being prepared right now!",
  ready: "🎉 Your food is ready! Time to head over.",
  completed: "🌟 Order completed. Hope you enjoyed your meal!",
};

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const { order, loading, error } = useOrderTracking(orderId);
  const prevStatus = useRef(null);

  // Show toast on status change
  useEffect(() => {
    if (order?.status && prevStatus.current && prevStatus.current !== order.status) {
      const msg = STATUS_MESSAGES[order.status];
      if (msg) {
        toast.success(msg, { duration: 5000 });
      }
    }
    if (order?.status) prevStatus.current = order.status;
  }, [order?.status]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-gray-500">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-4 text-center">
        <div>
          <p className="text-gray-500 mb-4">{error || 'Order not found'}</p>
          <Link to="/orders" className="btn-primary">View All Orders</Link>
        </div>
      </div>
    );
  }

  const isTerminal = ['completed', 'cancelled', 'no_show'].includes(order.status);

  return (
    <PageTransition>
      <div className="min-h-screen pt-20 pb-8 px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link to="/orders" className="w-10 h-10 rounded-2xl bg-white shadow-card flex items-center justify-center hover:shadow-card-hover transition-all">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="font-heading font-bold text-xl text-dark-800">Order Tracking</h1>
              <p className="text-gray-500 text-sm">#{orderId.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          {/* Restaurant Card */}
          <div className="card p-4 mb-5">
            <div className="flex items-center gap-3">
              {order.restaurants?.photo_url && (
                <img
                  src={order.restaurants.photo_url}
                  alt={order.restaurants?.name}
                  className="w-14 h-14 rounded-2xl object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-dark-800 truncate">
                  {order.restaurants?.name || 'Restaurant'}
                </h3>
                <div className="text-gray-500 text-sm space-y-0.5 mt-0.5">
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    Arrive by: {order.arrival_time ? formatTime(order.arrival_time) : '—'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className="text-xs">👥</span>
                    Guests: {order.num_guests || 2} {order.num_guests === 1 ? 'Guest' : 'Guests'}
                  </p>
                  {order.order_dining_tables && order.order_dining_tables.length > 0 && (
                    <p className="flex items-center gap-1.5">
                      <span className="text-xs">🪑</span>
                      Tables: {order.order_dining_tables
                        .map(ot => ot.dining_tables?.table_number.match(/Table\s+\d+/)?.[0] || ot.dining_tables?.table_number)
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                order.status === 'ready'
                  ? 'bg-green-100 text-green-700'
                  : order.status === 'preparing'
                  ? 'bg-orange-100 text-orange-700'
                  : order.status === 'confirmed'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>

          {/* Countdown timer - only show if not terminal */}
          {!isTerminal && order.arrival_time && (
            <div className="card p-5 mb-5">
              <CountdownTimer
                targetTime={order.arrival_time}
                label="Time until your arrival"
              />
            </div>
          )}

          {/* Status Stepper */}
          <div className="card p-5 mb-5">
            <h3 className="font-heading font-bold text-dark-800 mb-4">Order Status</h3>
            <StatusStepper
              currentStatus={order.status}
              completedAt={order.order_status_log?.find((log) => log.status === 'completed')?.changed_at || null}
            />
          </div>

          {/* Order items */}
          {order.order_items?.length > 0 && (
            <div className="card p-5 mb-5">
              <h3 className="font-heading font-bold text-dark-800 mb-3">Your Order</h3>
              <div className="space-y-2">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {item.menu_items?.is_veg ? (
                        <span className="veg-dot" />
                      ) : (
                        <span className="nonveg-dot" />
                      )}
                      <span className="text-sm text-gray-700">
                        {item.menu_items?.name || 'Item'} × {item.quantity}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-dark-800">
                      {formatCurrency(item.price_at_order * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between font-bold text-dark-800">
                    <span>Total Bill</span>
                    <span>{formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold text-emerald-600">
                    <span className="flex items-center gap-1">Paid Online (50%)</span>
                    <span>{formatCurrency(order.advance_paid_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold text-amber-600">
                    <span className="flex items-center gap-1">Pay at Restaurant (50%)</span>
                    <span>{formatCurrency(order.remaining_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Realtime indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-green-500"
            />
            Live updates enabled
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
