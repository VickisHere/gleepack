import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Get API URL from environment or use localhost for development
  const apiUrl = process.env.VITE_API_URL || 'http://localhost:3000';
  
  return {
    base: "/",
    server: {
      host: "::",
      port: 5173,
      proxy: {
        '/api': {
          target: apiUrl,
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
  };
});
