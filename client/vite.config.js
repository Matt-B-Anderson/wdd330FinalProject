import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  root: "src/",
  base: "/",
  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        movie: resolve(__dirname, "src/movie.html")
      },
    },
  },
}));
