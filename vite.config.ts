import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI & Animations
          'ui-vendor': ['framer-motion', 'lucide-react', 'canvas-confetti'],
          // Heavy libraries (split them out)
          'qr-scanner': ['html5-qrcode'],
          'supabase': ['@supabase/supabase-js'],
          'utils': ['react-blurhash', 'react-window']
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});