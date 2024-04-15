import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  // plugins: [svelte()],
  plugins: [svelte({ hot: { preserveLocalState: true } })],
  envDir: '../',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:2567',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    hmr: {
      clientPort: 443,
    },
  },
})
