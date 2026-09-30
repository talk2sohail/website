import { defineConfig } from "astro/config";

import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://mdsohail.dev",
  // Pages are prerendered at build time; opt a page into on-demand
  // rendering with `export const prerender = false` if ever needed.
  output: "static",
  adapter: node({
    mode: "standalone",
  }),
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "tokyo-night",
      },
      // Colors come from CSS vars so they follow the site's theme toggle.
      defaultColor: false,
    },
  },
});
