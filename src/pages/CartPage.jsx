import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trash2, Plus, Minus, ShoppingBag,
  ChevronRight, Tag, Store, Leaf, Drumstick,
  ReceiptText, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/layout/PageTransition';
import { useCartStore } from '../store/cartStore';
import { formatCurrency } from '../utils/formatters';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80';

// ── Single cart item row ──────────────────────────────────────
function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  const handleRemoveClick = () => {
    if (confirmRemove) { onRemove(); }
    else {
      setConfirmRemove(true);
      setTimeout(() => setConfirmRemove(false), 2500);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.28 }}
      className="flex gap-3 p-4 border-b border-gray-100 last:border-0 group"
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
        <img
          src={item.menuItem.photo_url || FALLBACK_IMG}
          alt={item.menuItem.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = FALLBACK_IMG; }}
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {/* Veg / non-veg dot */}
            <div className="flex items-center gap-1.5 mb-0.5">
              {item.menuItem.is_veg
                ? <span className="veg-dot" />
                : <span className="nonveg-dot" />
              }
              <span className="text-xs text-gray-400">
                {item.menuItem.is_veg ? 'Veg' : 'Non-Veg'}
              </span>
            </div>
            <p className="font-semibold text-dark-800 text-sm leading-snug truncate">
              {item.menuItem.name}
            </p>
            {item.notes && (
              <p className="text-gray-400 text-xs mt-0.5 italic truncate">"{item.notes}"</p>
            )}
            <p className="text-amber-600 font-bold text-sm mt-1">
              {formatCurrency(item.menuItem.price)}
              <span className="text-gray-400 font-normal text-xs"> / item</span>
            </p>
          </div>

          {/* Remove button */}
          <button
            onClick={handleRemoveClick}
            className={`flex-shrink-0 flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold transition-all duration-200
              ${confirmRemove
                ? 'bg-red-500 text-white'
                : 'bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500'
              }`}
          >
            <Trash2 className="w-3 h-3" />
            {confirmRemove ? 'Confirm?' : ''}
          </button>
        </div>

        {/* Quantity + line total */}
        <div className="flex items-center justify-between mt-2.5">
          {/* Stepper */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-1">
            <button
              onClick={onDecrease}
              className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-amber-50 active:scale-90 transition-all"
            >
              <Minus className="w-3.5 h-3.5 text-amber-600" />
            </button>
            <motion.span
              key={item.quantity}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-8 text-center font-bold text-dark-800 text-sm select-none"
            >
              {item.quantity}
            </motion.span>
            <button
              onClick={onIncrease}
              className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-amber-50 active:scale-90 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-amber-600" />
            </button>
          </div>

          {/* Line total */}
          <p className="font-extrabold text-dark-800 text-base font-heading">
            {formatCurrency(item.menuItem.price * item.quantity)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Bill row helper ───────────────────────────────────────────
function BillRow({ label, value, highlight, large }) {
  return (
    <div className={`flex justify-between items-center ${large ? 'py-1' : ''}`}>
      <span className={`${large ? 'font-bold text-dark-800 text-base' : 'text-gray-500 text-sm'}`}>{label}</span>
      <span className={`font-bold ${large ? 'text-amber-600 text-xl font-heading' : 'text-dark-800 text-sm'}`}>
        {value}
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, restaurantName, clearCart, numGuests, setNumGuests } = useCartStore();

  const handleCheckoutClick = () => {
    navigate('/checkout');
  };

  const totalItems  = items.reduce((s, i) => s + i.quantity, 0);
  const cartSubtotal = items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
  const cartTaxes   = Math.round(cartSubtotal * 0.05 * 100) / 100;
  const cartTotal   = cartSubtotal + cartTaxes;
  const advancePay  = Math.round(cartTotal / 2 * 100) / 100;

  /* ── Empty state ──────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="w-28 h-28 bg-white rounded-3xl shadow-card flex items-center justify-center mb-6"
          >
            <ShoppingBag className="w-14 h-14 text-amber-400" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="font-heading font-extrabold text-2xl text-dark-800 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-8 text-sm">Looks like you haven't added anything yet.<br/>Explore restaurants and start ordering!</p>
            <Link to="/" className="btn-primary inline-flex items-center gap-2">
              <Store className="w-4 h-4" /> Browse Restaurants
            </Link>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-cream-100 pb-10">

        {/* ── Sticky top bar ───────────────────────────── */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="font-heading font-bold text-lg text-dark-800 leading-none">Your Cart</h1>
              {restaurantName && (
                <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
                  <Store className="w-3 h-3" /> {restaurantName}
                </p>
              )}
            </div>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-xl">
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-5 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">

          {/* ── LEFT: Item list ──────────────────────── */}
          <div className="space-y-4">

            {/* Restaurant banner */}
            <div className="bg-gradient-to-r from-dark-800 to-dark-700 rounded-3xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-lg">🍽️</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-heading font-bold text-base truncate">{restaurantName}</p>
                <p className="text-gray-400 text-xs">Items in your cart</p>
              </div>
              <button
                onClick={clearCart}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-red-500/80 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all duration-200"
              >
                <Trash2 className="w-3 h-3" /> Clear all
              </button>
            </div>

            {/* Cart items card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <AnimatePresence>
                {items.map((item) => (
                  <CartItem
                    key={item.menuItem.id}
                    item={item}
                    onIncrease={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                    onDecrease={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                    onRemove={() => removeItem(item.menuItem.id)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Number of Guests */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse-glow">
                  <span className="text-base">👥</span>
                </div>
                <div>
                  <h2 className="font-heading font-bold text-base text-dark-800">Number of Guests</h2>
                  <p className="text-gray-400 text-xs">How many people are dining?</p>
                </div>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumGuests(num)}
                    className={`h-11 rounded-xl text-sm font-semibold transition-all duration-200 border flex items-center justify-center
                      ${numGuests === num 
                        ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-blue-600 text-xs leading-relaxed">
                Items from <strong>only one restaurant</strong> can be in your cart at a time.
                Adding from a different restaurant will clear the current cart.
              </p>
            </div>
          </div>

          {/* ── RIGHT: Bill + CTA (sticky) ───────────── */}
          <div className="lg:sticky lg:top-20 space-y-4">

            {/* Bill Summary */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                  <ReceiptText className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="font-heading font-bold text-base text-dark-800">Bill Summary</h3>
              </div>

              <div className="px-5 py-4 space-y-3">
                <BillRow label={`Subtotal (${totalItems} item${totalItems !== 1 ? 's' : ''})`} value={formatCurrency(cartSubtotal)} />
                <BillRow label="GST (5%)" value={formatCurrency(cartTaxes)} />
                <div className="h-px bg-gray-100" />
                <BillRow label="Grand Total" value={formatCurrency(cartTotal)} large />
              </div>

              {/* 50/50 split preview */}
              <div className="mx-5 mb-5 rounded-2xl overflow-hidden border border-amber-100">
                <div className="bg-amber-50 px-4 py-2 flex items-center gap-2 border-b border-amber-100">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-amber-700 text-xs font-bold uppercase tracking-wide">Payment Split (50/50)</p>
                </div>
                <div className="grid grid-cols-2">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-3 text-center">
                    <p className="text-white/75 text-xs font-medium">Pay Now</p>
                    <p className="text-white font-extrabold text-lg font-heading">{formatCurrency(advancePay)}</p>
                    <p className="text-white/60 text-xs">via Razorpay</p>
                  </div>
                  <div className="bg-white p-3 text-center border-l border-amber-100">
                    <p className="text-gray-400 text-xs font-medium">At Restaurant</p>
                    <p className="text-dark-800 font-extrabold text-lg font-heading">{formatCurrency(advancePay)}</p>
                    <p className="text-gray-300 text-xs">after dining</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkout CTA */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckoutClick}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-heading font-bold text-lg py-4 rounded-2xl shadow-lg shadow-amber-200 transition-all duration-200 flex items-center justify-center gap-2"
            >
              Proceed to Checkout
              <ChevronRight className="w-5 h-5" />
            </motion.button>

            <p className="text-center text-xs text-gray-400">
              🔒 Your cart is saved and persists across sessions
            </p>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
