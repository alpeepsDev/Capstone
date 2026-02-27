import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        onProxyRes: function (proxyRes, req, res) {
          if (req.url.includes("/assistant/query")) {
            proxyRes.headers["Cache-Control"] = "no-cache, no-transform";
            proxyRes.headers["X-Accel-Buffering"] = "no";
          }
        },
      },
      "/socket.io": {
        target: "ws://localhost:3001",
        ws: true,
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
    }),
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": [
            "framer-motion",
            "@dnd-kit/core",
            "@dnd-kit/sortable",
            "@dnd-kit/utilities",
          ],
          "vendor-charts": ["frappe-gantt", "recharts"],
          "vendor-socket": ["socket.io-client"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false, // Disable source maps in production for smaller builds
  },
  optimizeDeps: {
    include: ["react", "react-dom", "socket.io-client", "framer-motion"],
  },
});
