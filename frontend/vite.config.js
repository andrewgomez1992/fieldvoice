import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    https: fs.existsSync(path.resolve(__dirname, ".certs/cert.pem"))
      ? {
          key: fs.readFileSync(path.resolve(__dirname, ".certs/key.pem")),
          cert: fs.readFileSync(path.resolve(__dirname, ".certs/cert.pem")),
        }
      : undefined,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
