import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      port: 5173,
      strictPort: false, // Allow fallback to another port if 5173 is in use
      host: true, // Listen on all interfaces to avoid ENOBUFS
      cors: true, // Enable CORS by default
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      // Ensure proper file output formats and types
      rollupOptions: {
        output: {
          // Ensure proper chunking
          manualChunks: {
            vendor: ['react', 'react-dom'],
            charts: ['recharts', 'react-plotly.js', 'plotly.js-dist-min'],
          },
          // Ensure proper MIME types for JS files
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    },
    define: {
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
  };
});
