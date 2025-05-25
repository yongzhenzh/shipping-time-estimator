import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/estimates': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.error('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log(`Proxying: ${req.method} ${req.url}`);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log(`Proxy response: ${req.method} ${req.url} - ${proxyRes.statusCode}`);
            });
          }
        },
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
