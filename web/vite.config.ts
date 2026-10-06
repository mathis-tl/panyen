import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const racine = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  appType: "mpa",
  build: {
    rollupOptions: {
      input: {
        index: resolve(racine, "index.html"),
        techos: resolve(racine, "techos.html"),
      },
    },
  },
});
