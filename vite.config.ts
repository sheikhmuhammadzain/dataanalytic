import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: [],
    },
    server: {
      port: 5173,
      strictPort: false, // Allow fallback to another port if 5173 is in use
      host: true, // Listen on all interfaces to avoid ENOBUFS
      cors: true, // Enable CORS by default
      proxy: {
        '/api': {
          target: 'https://data-analysis-dashboard-rho.vercel.app',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: true,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        }
      }
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
            'lucide-icons': ['lucide-react'],
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
