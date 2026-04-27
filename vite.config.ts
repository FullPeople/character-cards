import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { resolve } from "path";

export default defineConfig(({ command }) => ({
  plugins: command === "serve" ? [basicSsl()] : [],
  base: "/character-cards/",
  server: {
    cors: { origin: "*" },
    headers: { "Access-Control-Allow-Origin": "*" },
  },
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, "background.html"),
        panel: resolve(__dirname, "panel.html"),
        bind: resolve(__dirname, "bind.html"),
        info: resolve(__dirname, "info.html"),
        controls: resolve(__dirname, "controls.html"),
      },
    },
  },
}));
