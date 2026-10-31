import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: '@components', replacement: path.resolve(__dirname, './src/components') },
      { find: '@assets', replacement: path.resolve(__dirname, './src/assets') },
    ]
  },
  server: {
    port: 5173,
    strictPort: true,
    // Proxy all /api requests to the backend — hides the real backend URL
    // from the browser Network tab. The frontend only sees relative /api/* paths.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy static asset paths served by the backend
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/productsUploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/servicesUploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/sellerUploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/profileImages': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    // SECURITY: Disable source maps in production so attackers cannot
    // read the original TypeScript source, see route definitions, or
    // reverse-engineer business logic.
    sourcemap: mode !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          vendors: ['lodash', 'axios']
        }
      }
    }
  },
  // SECURITY: Strip console.log and console.debug from production builds
  // so sensitive data (API responses, tokens, route info) is never
  // printed in end-user browser consoles.
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly'
    }
  }
}));