import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    server: {
      proxy: env.API_PROXY_TARGET
        ? {
            '/backend': {
              target: env.API_PROXY_TARGET,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/backend/, ''),
            },
          }
        : undefined,
    },
  };
});
