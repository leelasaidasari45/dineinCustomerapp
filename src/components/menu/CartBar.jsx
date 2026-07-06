import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';

export default function CartBar() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuthStore();
  const items = useCartStore((s) => s.items);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);

  const handleClick = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    navigate('/cart');
  };

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4"
        >
          <button
            onClick={handleClick}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 shadow-amber-lg flex items-center justify-between active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </div>
                <div className="text-white/80 text-xs">View cart</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{formatCurrency(subtotal)}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
