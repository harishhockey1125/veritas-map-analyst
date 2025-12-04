import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // 1. Polyfill process.env for libraries that rely on it (prevents crash)
      'process.env': {},
      // 2. Map the Netlify/System API_KEY to the Vite standard variable
      'import.meta.env.VITE_API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || ''),
    },
  };
});
