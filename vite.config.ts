import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // This helps read .env.local if you are running locally
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist', // Ensures Netlify finds the right folder
    },
    define: {
      // This is the CRITICAL fix for Netlify Environment Variables.
      // It checks for VITE_API_KEY first, then falls back to API_KEY (which Netlify sometimes uses).
      'import.meta.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY || ''),
    },
  };
});
