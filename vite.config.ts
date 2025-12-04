import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    define: {
      // Fixes Netlify API Key visibility
      'import.meta.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY || ''),
    },
  };
});
