import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: "./src/manifest.json",
      additionalInputs: {
        "content-script": resolve(__dirname, "src/content-script/index.ts"),
        background: resolve(__dirname, "src/background/index.ts"),
      },
      webExtConfig: {
        startUrl: "https://github.com",
        chromiumBinary: process.env.CHROMIUM_BINARY,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        options: resolve(__dirname, "src/options/index.html"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId
                .split("/")
                .pop()
                .replace(/\.[^/.]+$/, "")
            : "unknown";
          return `${facadeModuleId}.js`;
        },
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "assets/[name][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
    target: "es2020",
    minify: "esbuild",
    sourcemap: process.env.NODE_ENV === "development",
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development",
    ),
  },
  optimizeDeps: {
    include: ["react", "react-dom", "zustand", "i18next", "react-i18next"],
  },
});
