import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/react-fit-list/",
  resolve: {
    alias: {
      "react-fit-list": fileURLToPath(
        new URL("../src/index.ts", import.meta.url)
      ),
    },
  },
});
