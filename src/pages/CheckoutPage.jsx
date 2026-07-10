import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ShoppingBag, MapPin, Clock, CreditCard, CheckCircle2, Leaf, Drumstick, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import PageTransition from '../components/layout/PageTransition';
import ArrivalTimePicker from '../components/order/ArrivalTimePicker';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useRestaurant } from '../hooks/useRestaurants';
import { openRazorpayModal } from '../lib/razorpay';
import { createOrder } from '../hooks/useOrders';
import { formatCurrency } from '../utils/formatters';
import { getArrivalDate } from '../utils/timeUtils';

// ── Step indicator ────────────────────────────────────────────
function StepBadge({ number, label, active, done }) {
  return (
    <div className={`flex items-center gap-2 ${active ? 'opacity-100' : 'opacity-40'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
        ${done ? 'bg-emerald-500 text-white' : active ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : number}
      </div>
      <span className={`text-sm font-semibold ${active ? 'text-dark-800' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, customer } = useAuthStore();
  const { items, restaurantId, restaurantName, clearCart, selectedTableIds, setSelectedTableIds, numGuests } = useCartStore();
  const { restaurant } = useRestaurant(restaurantId);
  const [showItems, setShowItems] = useState(false);

  const [tables, setTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tablesError, setTablesError] = useState(null);

  useEffect(() => {
    if (!restaurantId) return;

    let active = true;

    async function fetchTables() {
      setTablesLoading(true);
      setTablesError(null);
      try {
        const { data, error } = await supabase
          .from('restaurant_tables')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('is_blocked', false)
          .order('table_number', { ascending: true });

        if (!active) return;
        if (error) throw error;
        setTables(data || []);
      } catch (err) {
        if (!active) return;
        console.error('Error fetching tables:', err.message);
        setTablesError('Failed to load available dining tables');
      } finally {
        if (active) setTablesLoading(false);
      }
    }

    fetchTables();
    return () => { active = false; };
  }, [restaurantId]);

  const handleTableToggle = (tableId) => {
    if (selectedTableIds.includes(tableId)) {
      setSelectedTableIds(selectedTableIds.filter(id => id !== tableId));
    } else {
      setSelectedTableIds([...selectedTableIds, tableId]);
    }
  };

  const selectedTables = tables.filter(t => selectedTableIds.includes(t.id));

  const queryParams = new URLSearchParams(location.search);
  const initialTime = queryParams.get('time') || '';
  const initialDate = queryParams.get('date') || '';

  const [arrivalInfo, setArrivalInfo] = useState(() => ({
    arrivalDate: arrivalInfoState?.arrivalDate || getArrivalDate('+30'),
    slot: arrivalInfoState?.slot || '+30',
  }));

  const cartSubtotal = items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
  const cartTaxes   = Math.round(cartSubtotal * 0.05 * 100) / 100;
  const cartTotal   = cartSubtotal + cartTaxes;
  const advanceAmount   = Math.round(cartTotal / 2 * 100) / 100;
  const remainingAmount = Math.round((cartTotal - advanceAmount) * 100) / 100;
  const totalItems  = items.reduce((s, i) => s + i.quantity, 0);

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



  return (
    <PageTransition>
      <div className="min-h-screen bg-cream-100 pb-12">

        {/* ── Top Bar ─────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="font-heading font-bold text-lg text-dark-800 leading-none">Checkout</h1>
              <p className="text-gray-400 text-xs mt-0.5">{restaurantName}</p>
            </div>
            {/* Step indicators */}
            <div className="hidden sm:flex items-center gap-4">
              <StepBadge number={1} label="Cart" done />
              <div className="w-8 h-px bg-gray-200" />
              <StepBadge number={2} label="Checkout" active />
              <div className="w-8 h-px bg-gray-200" />
              <StepBadge number={3} label="Confirm" active={false} />
            </div>
          </div>
        </div>

        {/* ── Main Layout ─────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

          {/* ── LEFT: Forms ─────────────────────────────── */}
          <div className="space-y-5">

            {/* Delivery info */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4.5 h-4.5 text-blue-500" />
                </div>
                <h2 className="font-heading font-bold text-base text-dark-800">Dine-in Details</h2>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-lg">🍽️</span>
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-semibold text-dark-800 text-sm truncate">{restaurantName}</p>
                  {restaurant?.address && (
                    <p className="text-gray-500 text-xs mt-0.5 truncate">{restaurant.address}</p>
                  )}
                  {selectedTables.length > 0 && (
                    <div className="text-amber-600 font-bold text-[11px] mt-1 flex items-center gap-1 flex-wrap">
                      <span>🪑 Booked:</span>
                      <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] uppercase">
                        {selectedTables.map(t => t.table_number.match(/Table\s+\d+/)?.[0] || t.table_number).join(', ')}
                      </span>
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1 mt-1.5 bg-emerald-50 text-emerald-600 text-xs font-semibold px-2 py-0.5 rounded-lg">
                    <CheckCircle2 className="w-3 h-3" /> Dine-in Pre-order
                  </span>
                </div>
              </div>
            </div>

            {/* Arrival time */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4.5 h-4.5 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-base text-dark-800">Choose Arrival Time</h2>
                  <p className="text-gray-400 text-xs">Your food will be ready when you arrive</p>
                </div>
              </div>
              <ArrivalTimePicker
                avgPrepMinutes={restaurant?.avg_prep_time_minutes || 20}
                onChange={setArrivalInfo}
                initialTime={initialTime}
                initialDate={initialDate}
              />
            </div>

            {/* Dining Table Selection */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse-glow">
                  <span className="text-base">🪑</span>
                </div>
                <div>
                  <h2 className="font-heading font-bold text-base text-dark-800">Select Dining Table(s)</h2>
                  <p className="text-gray-400 text-xs">Choose one or more available tables for your dine-in</p>
                </div>
              </div>

              {tablesLoading ? (
                <div className="flex items-center justify-center py-6">
                  <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : tablesError ? (
                <p className="text-red-500 text-xs">{tablesError}</p>
              ) : tables.length === 0 ? (
                <p className="text-gray-400 text-xs py-4 text-center">No tables available at this restaurant.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {tables.map((table) => {
                    const isSelected = selectedTableIds.includes(table.id);
                    return (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => handleTableToggle(table.id)}
                        className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between h-24 text-wrap
                          ${isSelected 
                            ? 'border-amber-500 bg-amber-50/60 shadow-sm shadow-amber-100 scale-98' 
                            : 'border-gray-100 hover:border-gray-200 bg-white hover:scale-101'
                          }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg
                            ${isSelected ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'}`}
                          >
                            Table {table.table_number.match(/\d+/)?.[0] || table.table_number}
                          </span>
                          <span className="text-base">🪑</span>
                        </div>
                        <div className="mt-1">
                          <p className="font-bold text-dark-800 text-[13px] truncate">{table.table_number}</p>
                          <p className="text-gray-400 text-[10px] font-medium">{table.capacity} Seater</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4.5 h-4.5 text-purple-500" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-base text-dark-800">Payment</h2>
                  <p className="text-gray-400 text-xs">Secure payment via Razorpay</p>
                </div>
              </div>

              {/* Pay now / pay at restaurant split */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-4 text-white">
                  <p className="text-white/75 text-xs font-medium mb-1">Pay Now (50%)</p>
                  <p className="font-heading font-extrabold text-2xl">{formatCurrency(advanceAmount)}</p>
                  <p className="text-white/70 text-xs mt-1">via Razorpay</p>
                </div>
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-4">
                  <p className="text-gray-400 text-xs font-medium mb-1">Pay at Restaurant (50%)</p>
                  <p className="font-heading font-extrabold text-2xl text-dark-800">{formatCurrency(remainingAmount)}</p>
                  <p className="text-gray-400 text-xs mt-1">after dining</p>
                </div>
              </div>

              {/* Bill breakdown */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>GST (5%)</span>
                  <span>{formatCurrency(cartTaxes)}</span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex justify-between font-bold text-dark-800">
                  <span>Grand Total</span>
                  <span className="text-amber-600">{formatCurrency(cartTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Order Summary (sticky) ───────────── */}
          <div className="lg:sticky lg:top-20 space-y-4">

            {/* Order card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-dark-800 to-dark-700 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Your Order</p>
                    <p className="text-white font-heading font-bold text-base">{restaurantName}</p>
                  </div>
                  <div className="bg-amber-500 rounded-2xl w-10 h-10 flex items-center justify-center shadow-lg">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Items toggle */}
              <button
                onClick={() => setShowItems(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-semibold text-dark-800">
                  {totalItems} item{totalItems !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                  {showItems ? 'Hide' : 'Show'}
                  {showItems ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              {/* Expandable item list */}
              <AnimatePresence>
                {showItems && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-b border-gray-100"
                  >
                    <div className="px-5 py-3 space-y-3 max-h-64 overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.menuItem.id} className="flex items-start gap-3">
                          <span className="flex-shrink-0 mt-0.5">
                            {item.menuItem.is_veg
                              ? <span className="veg-dot" />
                              : <span className="nonveg-dot" />
                            }
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-dark-800 leading-snug">{item.menuItem.name}</p>
                            {item.notes && <p className="text-gray-400 text-xs">"{item.notes}"</p>}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-xs text-gray-400">×{item.quantity}</p>
                            <p className="text-sm font-semibold text-dark-800">
                              {formatCurrency(item.menuItem.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Total */}
              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-gray-500 text-sm">Total Bill</span>
                  <span className="font-bold text-dark-800">{formatCurrency(cartTotal)}</span>
                </div>
                
                <div className="space-y-1.5 pt-2.5 border-t border-gray-200/60">
                  <div className="flex justify-between items-center">
                    <span className="text-amber-600 text-sm font-semibold flex items-center gap-1.5">
                      Pay Now <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md">50%</span>
                    </span>
                    <span className="font-extrabold text-amber-600 text-lg font-heading">{formatCurrency(advanceAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      Pay at Restaurant <span className="text-[10px] bg-gray-200 text-gray-700 font-semibold px-1.5 py-0.5 rounded-md">50%</span>
                    </span>
                    <span className="font-semibold text-dark-800">{formatCurrency(remainingAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Payment Note */}
            <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-800 leading-relaxed shadow-sm">
              <span className="text-base mt-0.5 flex-shrink-0">💡</span>
              <div>
                <p className="font-bold text-amber-950 mb-0.5">Split Payment Policy</p>
                <p>Pay <span className="font-semibold text-amber-950">{formatCurrency(advanceAmount)} (50%)</span> now to confirm your pre-order. Pay the remaining <span className="font-semibold text-amber-950">{formatCurrency(remainingAmount)} (50%)</span> directly at the restaurant after your meal.</p>
              </div>
            </div>

             {/* Proceed to Preview Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (selectedTableIds.length === 0) {
                  toast.error('Please select at least one dining table to proceed.');
                  return;
                }
                navigate('/checkout/summary');
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-heading font-bold text-lg py-4 rounded-2xl shadow-lg shadow-amber-200 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Proceed to Preview
              <ChevronRight className="w-5 h-5" />
            </motion.button>

            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <span>🔒</span> Secured by Razorpay · Sandbox Mode
            </p>
          </div>
        </div>
      </div>


    </PageTransition>
  );
}
