import { useState } from 'react';
import { Plus, Minus, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'sonner';

const FALLBACK_ITEM = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';

export default function MenuItemCard({ item, restaurantName }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const [adding, setAdding] = useState(false);

  const cartItem = items.find((i) => i.menuItem.id === item.id);
  const qty = cartItem?.quantity || 0;

  const handleAdd = async () => {
    setAdding(true);
    const result = addItem({ ...item, restaurantName }, 1);
    if (result?.switched) {
      toast.info('Cart cleared — items are from a different restaurant', { duration: 3000 });
    }
    setTimeout(() => setAdding(false), 400);
  };

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Veg/NonVeg indicator */}
        <div className="flex items-center gap-2 mb-1">
          {item.is_veg ? (
            <span className="veg-dot" title="Veg" />
          ) : (
            <span className="nonveg-dot" title="Non-Veg" />
          )}
        </div>
        <h4 className="font-heading font-semibold text-dark-800 text-base leading-snug">
          {item.name}
        </h4>
        {item.description && (
          <p className="text-gray-500 text-sm mt-1 line-clamp-3">{item.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="font-bold text-dark-800 text-base">
            {formatCurrency(item.price)}
          </span>
          {item.serves && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-lg">
              <Users className="w-3 h-3" />
              Serves {item.serves}
            </span>
          )}
        </div>
      </div>

      {/* Image + Add button */}
      <div className="flex-shrink-0 flex flex-col items-center gap-2">
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gray-100">
          <img
            src={item.photo_url || FALLBACK_ITEM}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = FALLBACK_ITEM; }}
          />
        </div>

        {/* Add / Quantity controls */}
        <AnimatePresence mode="wait">
          {qty === 0 ? (
            <motion.button
              key="add"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleAdd}
              disabled={adding}
              className="w-24 h-8 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95 shadow-amber"
            >
              <motion.div
                animate={adding ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Plus className="w-3.5 h-3.5" />
              </motion.div>
              Add
            </motion.button>
          ) : (
            <motion.div
              key="qty"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-24 h-8 bg-amber-500 rounded-xl flex items-center justify-between px-2 shadow-amber"
            >
              <button
                onClick={() => updateQuantity(item.id, qty - 1)}
                className="text-white hover:bg-amber-600 rounded-lg p-0.5 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <motion.span
                key={qty}
                initial={{ scale: 1.4 }}
                animate={{ scale: 1 }}
                className="text-white font-bold text-sm"
              >
                {qty}
              </motion.span>
              <button
                onClick={() => updateQuantity(item.id, qty + 1)}
                className="text-white hover:bg-amber-600 rounded-lg p-0.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
