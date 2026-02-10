import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://game.dxter.ai",
  base: "/",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
