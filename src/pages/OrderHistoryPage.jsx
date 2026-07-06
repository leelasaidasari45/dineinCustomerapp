import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Package, Clock, Calendar, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '../components/layout/PageTransition';
import { useOrders } from '../hooks/useOrders';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '../utils/formatters';

function OrderSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="skeleton h-5 w-2/3" />
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-4 w-1/3" />
    </div>
  );
}

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuthStore();
  const { orders, loading, error } = useOrders();

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col px-4 pt-8">
          <div className="max-w-2xl mx-auto w-full">
            <button onClick={() => navigate('/')} className="w-10 h-10 rounded-2xl bg-white shadow-card flex items-center justify-center hover:shadow-card-hover transition-all mb-8">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="font-heading font-bold text-xl text-dark-800 mb-2">Sign in to view orders</h2>
              <p className="text-gray-500 mb-6">Your order history will appear here</p>
              <button onClick={() => openAuthModal('login')} className="btn-primary">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen pt-8 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate('/')} className="w-10 h-10 rounded-2xl bg-white shadow-card flex items-center justify-center hover:shadow-card-hover transition-all">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="font-heading font-bold text-2xl text-dark-800">My Orders</h1>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <OrderSkeleton key={i} />)}
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="font-heading font-bold text-xl text-dark-800 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6">Place your first Zuno order!</p>
              <Link to="/" className="btn-primary">Browse Restaurants</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Link to={`/track/${order.id}`}>
                    <div className="card card-hover p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Restaurant name */}
                          <h3 className="font-heading font-bold text-dark-800 truncate">
                            {order.restaurants?.name || 'Restaurant'}
                          </h3>

                          {/* Items */}
                          <p className="text-gray-500 text-sm mt-0.5 truncate">
                            {order.order_items
                              ?.slice(0, 2)
                              .map((i) => i.menu_items?.name)
                              .filter(Boolean)
                              .join(', ')}
                            {(order.order_items?.length || 0) > 2
                              ? ` +${order.order_items.length - 2} more`
                              : ''}
                          </p>

                          {/* Date + time */}
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateTime(order.created_at)}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-gray-50 ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                          <span className="font-bold text-dark-800 text-sm">
                            {formatCurrency(order.total_amount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                          Advance: {formatCurrency(order.advance_paid_amount)} paid
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
