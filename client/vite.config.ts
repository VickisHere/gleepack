import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: "/",
  server: {
    host: "::",
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3010',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": new URL('./src', import.meta.url).pathname,
    },
  },
  build: {
    chunkSizeWarningLimit: 1500, // Increase chunk size warning limit to 1500 KB
  },
}));
