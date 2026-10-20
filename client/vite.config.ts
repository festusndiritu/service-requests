import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development /api is forwarded to the local API, as vercel.json does in production
    proxy: { '/api': 'http://localhost:3000' },
  },
});
