import { useState } from 'react';
import { LayoutList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';

export default function MenuCategoryTabs({ categories, activeCategory, onSelect }) {
  const [open, setOpen] = useState(false);
  const hasCartItems = useCartStore((s) => s.items.length > 0);

  if (categories.length === 0) return null;

  const handleSelect = (cat) => {
    onSelect(cat);
    setOpen(false);
  };

  const bottomClass = hasCartItems ? 'bottom-24' : 'bottom-8';

  return (
    <>
      {/* Floating round trigger button — bottom-left */}
      <div className={`fixed ${bottomClass} left-4 z-40 transition-all duration-300`}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-14 h-14 rounded-full bg-white border-2 border-amber-400 shadow-xl flex items-center justify-center text-amber-500 hover:bg-amber-50 hover:scale-105 active:scale-95 transition-all duration-200"
          title={activeCategory || 'Categories'}
        >
          <LayoutList className="w-6 h-6" />
        </button>

        {/* Popover list — slides up from the button */}
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop to close on outside click */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute bottom-full left-0 mb-3 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[180px]"
              >
                <div className="px-3 py-2 border-b border-gray-100 bg-amber-50">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    Menu Categories
                  </p>
                </div>

                <div className="py-1 max-h-72 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleSelect(cat)}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors duration-150 flex items-center justify-between gap-3
                        ${activeCategory === cat
                          ? 'bg-amber-50 text-amber-600'
                          : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {cat}
                      {activeCategory === cat && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
