import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, UtensilsCrossed, LogOut, History, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, customer, signOut, openAuthModal } = useAuthStore();
  const items = useCartStore((s) => s.items);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const [menuOpen, setMenuOpen] = useState(false);

  // All hooks must be called before any conditional return (Rules of Hooks)
  if (location.pathname !== '/') return null;

  const handleCartClick = () => {
    if (!user) { openAuthModal('login'); return; }
    navigate('/cart');
  };

  const displayName = customer?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
          <img src="/logo.png" alt="Zuno Logo" className="h-12 w-auto object-contain rounded-lg group-hover:scale-105 transition-transform duration-200" />
        </Link>

        {/* ── Nav Links ── */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Restaurants', path: '/' },
            ...(user ? [{ label: 'My Orders', path: '/orders' }] : []),
          ].map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-bold tracking-wide transition-all duration-200
                ${location.pathname === link.path
                  ? 'text-white border-b-2 border-white pb-1'
                  : 'text-white/80 hover:text-white'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-4">

          {/* Cart Outline Button (Swiggy style) */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCartClick}
            className="relative flex items-center gap-1.5 h-11 px-2.5 sm:px-4 rounded-xl border border-white hover:bg-white/10 text-white font-bold text-sm transition-all duration-200"
          >
            <ShoppingCart className="w-4.5 h-4.5" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="bg-white text-[#fc8019] px-1.5 py-0.5 rounded-lg text-[10px] sm:text-xs font-extrabold">
                {itemCount}
              </span>
            )}
          </motion.button>

          {/* Auth State */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5 sm:gap-2.5 h-11 pl-2 pr-2 sm:pr-4 rounded-xl hover:bg-white/10 text-white font-bold text-sm transition-all duration-200 border border-white/30"
              >
                <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                  <span className="text-[#fc8019] text-xs font-extrabold">{initials}</span>
                </div>
                <span className="hidden sm:block max-w-[100px] truncate">
                  {displayName.split(' ')[0]}
                </span>
                <ChevronDown className={`w-4 h-4 text-white/70 transition-transform duration-200 hidden sm:block ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-13 z-20 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                        <p className="text-xs text-amber-700 font-medium">Signed in as</p>
                        <p className="text-sm font-bold text-dark-800 truncate">{displayName}</p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          Profile
                        </button>
                        <button
                          onClick={() => { navigate('/orders'); setMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <History className="w-4 h-4 text-gray-400" />
                          My Orders
                        </button>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={() => { signOut(); setMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => openAuthModal('login')}
              className="h-11 px-6 bg-[#0d0d0d] hover:bg-black text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-sm"
            >
              Sign In
            </motion.button>
          )}
        </div>
      </div>
    </nav>
  );
}
