import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — tiny, always needed
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Animation library — large, split out so pages share one cached copy
          'vendor-framer': ['framer-motion'],

          // Supabase client — large, rarely changes
          'vendor-supabase': ['@supabase/supabase-js'],

          // UI utilities
          'vendor-ui': ['lucide-react', 'sonner', 'canvas-confetti', 'zustand'],
        },
      },
    },
    // Raise the warning threshold — we've split intentionally
    chunkSizeWarningLimit: 600,
  },
})
