import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // { menuItem, quantity, notes }
      restaurantId: null,
      restaurantName: null,

      addItem: (menuItem, quantity = 1, notes = '') => {
        const { items, restaurantId } = get();

        // If cart has items from a different restaurant, clear and start fresh
        if (restaurantId && restaurantId !== menuItem.restaurant_id) {
          set({
            items: [{ menuItem, quantity, notes }],
            restaurantId: menuItem.restaurant_id,
            restaurantName: menuItem.restaurantName || '',
          });
          return { switched: true };
        }

        const existing = items.find((i) => i.menuItem.id === menuItem.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.menuItem.id === menuItem.id
                ? { ...i, quantity: i.quantity + quantity, notes: notes || i.notes }
                : i
            ),
          });
        } else {
          set({
            items: [...items, { menuItem, quantity, notes }],
            restaurantId: menuItem.restaurant_id,
            restaurantName: menuItem.restaurantName || '',
          });
        }
        return { switched: false };
      },

      removeItem: (menuItemId) => {
        const { items } = get();
        const updated = items.filter((i) => i.menuItem.id !== menuItemId);
        set({
          items: updated,
          restaurantId: updated.length === 0 ? null : get().restaurantId,
          restaurantName: updated.length === 0 ? null : get().restaurantName,
        });
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.menuItem.id === menuItemId ? { ...i, quantity } : i
          ),
        });
      },

      updateNotes: (menuItemId, notes) => {
        set({
          items: get().items.map((i) =>
            i.menuItem.id === menuItemId ? { ...i, notes } : i
          ),
        });
      },

      clearCart: () => set({ items: [], restaurantId: null, restaurantName: null }),

      // Plain selector functions (NOT getters) — getters break persist serialization
      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getSubtotal: () => get().items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0),
      getTaxes: () => Math.round(get().items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0) * 0.05 * 100) / 100,
      getTotal: () => {
        const sub = get().items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
        const tax = Math.round(sub * 0.05 * 100) / 100;
        return sub + tax;
      },
      getAdvanceAmount: () => {
        const total = get().getTotal();
        return Math.round(total / 2 * 100) / 100;
      },
      getRemainingAmount: () => {
        const total = get().getTotal();
        const advance = Math.round(total / 2 * 100) / 100;
        return Math.round((total - advance) * 100) / 100;
      },
    }),
    {
      name: 'zuno-cart',
      storage: createJSONStorage(() => localStorage),
      // Only persist plain data, not functions
      partialize: (state) => ({
        items: state.items,
        restaurantId: state.restaurantId,
        restaurantName: state.restaurantName,
      }),
    }
  )
);
