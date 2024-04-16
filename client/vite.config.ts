import { defineConfig, loadEnv } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path';


// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, path.join(process.cwd(), '..'), '')

  return defineConfig({
    // plugins: [svelte()],
    plugins: [svelte({ hot: { preserveLocalState: true } })],
    envDir: '../',
    server: {
      proxy: {
        '/api': {
          target: JSON.stringify(env.VITE_SERVER_URL),
          // target: 'http://localhost:2567',
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
  });
}
