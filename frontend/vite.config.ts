import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // In Docker, BACKEND_URL is set to http://backend:8000 via docker-compose
    const backendUrl = process.env.BACKEND_URL || env.BACKEND_URL || 'http://localhost:8000';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: backendUrl,
            changeOrigin: true,
          },
        },
      },
      plugins: [react(), tailwindcss()],

      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },

      build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'motion': ['framer-motion'],
              'three': ['three', '@react-three/fiber', '@react-three/drei'],
              'sentry': ['@sentry/react'],
              'ui': ['lucide-react'],
            },
          },
        },
      },
    };
});
