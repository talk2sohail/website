import { defineConfig } from "astro/config";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  site: "https://mdsohail.dev",
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  markdown: {
    syntaxHighlight: "prism",
  },
});
