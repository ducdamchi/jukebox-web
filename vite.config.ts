import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  // Set BASE_PATH=/<repo>/ when serving from a GitHub Pages project URL.
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
