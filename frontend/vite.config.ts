import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/sui': {
        target: 'https://fullnode.testnet.sui.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sui/, ''),
        secure: false,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      },
    },
  },
  preview: {
    port: 3000,
    proxy: {
      '/sui': {
        target: 'https://fullnode.testnet.sui.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sui/, ''),
        secure: false,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      },
    },
  },
  base: '/',
})
