import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://thenextpangeasl.github.io",
  base: "/dxter-playground",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
