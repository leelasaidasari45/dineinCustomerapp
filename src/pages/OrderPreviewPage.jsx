import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ShoppingBag, MapPin, Clock, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import PageTransition from '../components/layout/PageTransition';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useRestaurant } from '../hooks/useRestaurants';
import { createOrder } from '../hooks/useOrders';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';

// ── Step indicator ────────────────────────────────────────────
function StepBadge({ number, label, active, done }) {
  return (
    <div className={`flex items-center gap-2 ${active || done ? 'opacity-100' : 'opacity-40'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
        ${done 
          ? 'bg-emerald-500 text-white' 
          : active 
            ? 'bg-amber-500 text-white' 
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        {done ? '✓' : number}
      </div>
      <span className={`text-sm font-semibold ${active || done ? 'text-dark-800' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}

export default function OrderPreviewPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, restaurantId, restaurantName, clearCart, selectedTableIds, numGuests, arrivalDate } = useCartStore();
  const { restaurant } = useRestaurant(restaurantId);
  const [selectedTables, setSelectedTables] = useState([]);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!selectedTableIds || selectedTableIds.length === 0) return;

    async function fetchTables() {
      try {
        const { data, error } = await supabase
          .from('restaurant_tables')
          .select('*')
          .in('id', selectedTableIds);
        if (!error && data) {
          setSelectedTables(data);
        }
      } catch (err) {
        console.error('Error fetching selected tables:', err);
      }
    }
    fetchTables();
  }, [selectedTableIds]);

  const cartSubtotal = items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
  const cartTaxes   = Math.round(cartSubtotal * 0.05 * 100) / 100;
  const cartTotal   = cartSubtotal + cartTaxes;
  const advanceAmount   = Math.round(cartTotal / 2 * 100) / 100;
  const remainingAmount = Math.round((cartTotal - advanceAmount) * 100) / 100;

  // ── Guards ────────────────────────────────────────────────
  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="font-heading font-bold text-xl text-dark-800 mb-2">Sign in to checkout</h2>
            <p className="text-gray-500 mb-6 text-sm">Please sign in to place your order</p>
            <Link to="/" className="btn-primary">Go Home</Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (items.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="font-heading font-bold text-xl text-dark-800 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6 text-sm">Add items first to checkout</p>
            <Link to="/" className="btn-primary">Browse Restaurants</Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  const handlePayment = async () => {
    setPaying(true);
    
    // Simulate brief network delay for processing payment
    setTimeout(async () => {
      try {
        const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 11)}`;
        const order = await createOrder({
          customerId: user.id,
          restaurantId,
          cartItems: items,
          arrivalTime: arrivalDate,
          estimatedReadyTime: arrivalDate,
          totalAmount: cartTotal,
          advancePaidAmount: advanceAmount,
          remainingAmount,
          paymentReference: mockPaymentId,
          numGuests,
          selectedTableIds,
        });
        clearCart();
        toast.success('Payment Successful! Order placed. 🎉');
        navigate(`/order-success/${order.id}`);
      } catch (err) {
        toast.error(`Order creation failed: ${err.message}`);
        setPaying(false);
      }
    }, 1500);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-cream-100 pb-12">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex-grow min-w-0">
              <h1 className="font-heading font-bold text-lg text-dark-800 leading-none">Order Preview</h1>
              <p className="text-gray-400 text-xs mt-0.5 truncate">{restaurantName}</p>
            </div>
            {/* Step indicators */}
            <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
              <StepBadge number={1} label="Cart" done />
              <div className="w-8 h-px bg-emerald-300" />
              <StepBadge number={2} label="Checkout" done />
              <div className="w-8 h-px bg-amber-300" />
              <StepBadge number={3} label="Confirm" active />
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="max-w-5xl mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
          {/* LEFT COLUMN: Pre-order details breakdown */}
          <div className="space-y-6">
            {/* Dine-in Details summary */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-heading font-extrabold text-lg text-dark-800 mb-4 flex items-center gap-2">
                <span>🪑</span> Dine-in Summary
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold shadow-sm">
                    🍽️
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-dark-800 text-sm truncate">{restaurantName}</p>
                    {restaurant?.address && (
                      <p className="text-gray-400 text-xs truncate mt-0.5">{restaurant.address}</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold shadow-sm">
                    ⏰
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Arrival Time</p>
                    <p className="font-bold text-dark-800 text-sm mt-0.5">
                      {arrivalDate ? `${formatDate(arrivalDate)}, ${formatTime(arrivalDate)}` : '—'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold shadow-sm">
                    👥
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Guests</p>
                    <p className="font-bold text-dark-800 text-sm mt-0.5">
                      {numGuests} {numGuests === 1 ? 'Guest' : 'Guests'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold shadow-sm">
                    🪑
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Tables Booked</p>
                    <p className="font-bold text-amber-700 text-sm mt-0.5 truncate">
                      {selectedTables.length > 0 
                        ? selectedTables.map(t => t.table_number.match(/Table\s+\d+/)?.[0] || t.table_number).join(', ')
                        : 'No tables selected'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Items details card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-heading font-extrabold text-base text-dark-800 flex items-center gap-2">
                  <span>🛍️</span> Review Items ({items.reduce((s, i) => s + i.quantity, 0)})
                </h3>
              </div>
              <div className="divide-y divide-gray-50 px-6 max-h-[360px] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.menuItem.id} className="py-4 flex items-start gap-4">
                    <span className="flex-shrink-0 mt-1">
                      {item.menuItem.is_veg ? <span className="veg-dot" /> : <span className="nonveg-dot" />}
                    </span>
                    <div className="flex-grow min-w-0">
                      <p className="font-bold text-dark-800 text-sm leading-snug">{item.menuItem.name}</p>
                      {item.notes && (
                        <p className="text-gray-400 text-xs mt-0.5 italic">"{item.notes}"</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-400">×{item.quantity}</p>
                      <p className="font-bold text-dark-800 text-sm mt-0.5">
                        {formatCurrency(item.menuItem.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Payment Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h3 className="font-heading font-extrabold text-base text-dark-800 flex items-center gap-2 mb-2">
                <span>💳</span> Payment Breakdown
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-dark-800">{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-500">
                  <span>GST & Restaurant Charges (5%)</span>
                  <span className="font-semibold text-dark-800">{formatCurrency(cartTaxes)}</span>
                </div>
                <div className="h-px bg-gray-100 my-1" />
                <div className="flex justify-between items-center font-bold text-dark-800 text-base">
                  <span>Total Amount</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              {/* Split Payment display badge */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl p-4 border border-amber-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-amber-700 font-extrabold text-sm flex items-center gap-1.5">
                    Pay Now (50% Advance)
                  </span>
                  <span className="font-extrabold text-amber-700 text-lg font-heading">
                    {formatCurrency(advanceAmount)}
                  </span>
                </div>
                <div className="h-px bg-amber-200/50" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium text-xs">
                    Pay at Restaurant (50% Balance)
                  </span>
                  <span className="font-bold text-dark-800 text-sm">
                    {formatCurrency(remainingAmount)}
                  </span>
                </div>
              </div>

              {/* Final Split Note banner */}
              <div className="flex gap-2.5 bg-blue-50 border border-blue-100 rounded-2xl p-3.5 text-[11px] text-blue-700 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-blue-900 block mb-0.5">Split Pre-order Payment</span>
                  Advance payment guarantees your dining table reservation and pre-prepared food. Remaining 50% balance plus any additional orders are paid directly at the restaurant.
                </div>
              </div>

              {/* Pay Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handlePayment}
                disabled={paying}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-heading font-bold text-lg py-4 rounded-2xl shadow-lg shadow-amber-200 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {paying ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Confirm & Pay {formatCurrency(advanceAmount)}
                  </>
                )}
              </motion.button>

              <p className="text-center text-[10px] text-gray-400 flex items-center justify-center gap-1">
                <span>🔒</span> Secure Sandbox Payment powered by Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
