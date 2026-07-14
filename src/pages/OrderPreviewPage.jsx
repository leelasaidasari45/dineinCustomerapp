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
import { openRazorpayModal } from '../lib/razorpay';
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
    
    const displayName = customer?.name || user?.user_metadata?.full_name || '';
    const displayPhone = customer?.phone || '';

    openRazorpayModal({
      amount: advanceAmount,
      orderName: `Dine-in Pre-order at ${restaurantName}`,
      customerName: displayName,
      customerEmail: user?.email || '',
      customerPhone: displayPhone,
      onSuccess: async (response) => {
        try {
          // Create actual order in Supabase with verified payment reference
          const order = await createOrder({
            customerId: user.id,
            restaurantId,
            cartItems: items,
            arrivalTime: arrivalDate,
            estimatedReadyTime: arrivalDate,
            totalAmount: cartTotal,
            advancePaidAmount: advanceAmount,
            remainingAmount,
            paymentReference: response.razorpay_payment_id,
            numGuests,
            selectedTableIds,
          });
          clearCart();
          toast.success('Payment Successful! Order placed. 🎉');
          navigate(`/order-success/${order.id}`);
        } catch (err) {
          toast.error(`Order registration failed: ${err.message}`);
          setPaying(false);
        }
      },
      onFailure: (errorMsg) => {
        toast.error(errorMsg || 'Payment failed or cancelled.');
        setPaying(false);
      }
    });
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
            {/* Dine-in Details Pass */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Ticket header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white relative">
                {/* Decorative circles to look like a ticket stub */}
                <div className="absolute left-0 bottom-0 w-3 h-6 bg-cream-100 rounded-r-full -mb-3 transform -translate-y-1/2" />
                <div className="absolute right-0 bottom-0 w-3 h-6 bg-cream-100 rounded-l-full -mb-3 transform -translate-y-1/2" />
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-white/20 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Dine-in Pre-order Pass
                    </span>
                    <h2 className="font-heading font-extrabold text-2xl mt-2.5 tracking-tight">{restaurantName}</h2>
                    {restaurant?.address && (
                      <p className="text-amber-50 text-xs mt-1 flex items-center gap-1.5 opacity-95">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        {restaurant.address}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
                    🍽️
                  </div>
                </div>
              </div>

              {/* Ticket details grid */}
              <div className="p-6 bg-white border-t border-dashed border-gray-200 relative">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Arrival Time */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Arrival Time</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-dark-800 text-sm truncate">
                          {arrivalDate ? formatTime(arrivalDate) : '—'}
                        </p>
                        <p className="text-gray-400 text-[10px] font-medium truncate">
                          {arrivalDate ? formatDate(arrivalDate) : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Guests */}
                  <div className="space-y-1 sm:border-l sm:border-gray-100 sm:pl-6">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Table For</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <span className="text-sm">👥</span>
                      </div>
                      <div>
                        <p className="font-bold text-dark-800 text-sm">
                          {numGuests} {numGuests === 1 ? 'Guest' : 'Guests'}
                        </p>
                        <p className="text-gray-400 text-[10px] font-medium">Dine-in Party</p>
                      </div>
                    </div>
                  </div>

                  {/* Tables Booked */}
                  <div className="space-y-1 sm:border-l sm:border-gray-100 sm:pl-6">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tables Reserved</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
                        <span className="text-sm">🪑</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-amber-700 text-sm truncate">
                          {selectedTables.length > 0 
                            ? selectedTables.map(t => t.table_number.match(/Table\s+\d+/)?.[0] || t.table_number).join(', ')
                            : 'No tables'
                          }
                        </p>
                        <p className="text-gray-400 text-[10px] font-medium">Table reservation</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Items details card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 pb-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <h3 className="font-heading font-extrabold text-base text-dark-800 flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center text-xs">🛍️</span>
                  Review Pre-order Items
                </h3>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {items.reduce((s, i) => s + i.quantity, 0)} Items
                </span>
              </div>
              <div className="divide-y divide-gray-100 px-6 max-h-[360px] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.menuItem.id} className="py-4 flex items-center justify-between gap-4 hover:bg-gray-50/30 -mx-6 px-6 transition-all duration-200">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="flex-shrink-0 mt-0.5">
                        {item.menuItem.is_veg ? (
                          <span className="inline-flex w-4.5 h-4.5 border border-emerald-500 rounded flex-shrink-0 items-center justify-center bg-emerald-50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          </span>
                        ) : (
                          <span className="inline-flex w-4.5 h-4.5 border border-red-500 rounded flex-shrink-0 items-center justify-center bg-red-50">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          </span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-dark-800 text-sm leading-snug">{item.menuItem.name}</p>
                        {item.notes ? (
                          <div className="bg-gray-50 border-l-2 border-amber-400 px-2.5 py-1 mt-1.5 rounded-r-lg">
                            <p className="text-[11px] text-gray-500 leading-normal italic">"{item.notes}"</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">
                        Qty: {item.quantity}
                      </span>
                      <p className="font-heading font-bold text-dark-800 text-sm w-16 text-right">
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
