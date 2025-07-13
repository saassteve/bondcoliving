import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Enable client-side routing for development
    historyApiFallback: true,
  },
  preview: {
    // Enable client-side routing for preview mode
    historyApiFallback: true,
  },
  build: {
    // Ensure proper routing for production builds
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});