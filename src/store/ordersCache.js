import { create } from 'zustand';

/**
 * A lightweight in-memory cache for orders.
 * Keeps orders alive across route navigations so the history page
 * never shows a loading skeleton on revisit — it renders cached data
 * immediately while a silent background refresh runs.
 */
export const useOrdersCache = create((set) => ({
  orders: [],
  lastFetchedAt: null,   // timestamp (ms) of the last successful fetch
  setOrders: (orders) => set({ orders, lastFetchedAt: Date.now() }),
  clearOrders: () => set({ orders: [], lastFetchedAt: null }),
}));
