// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { exifExtractor} from "./src/lib/exif-reader.ts";
import node from "@astrojs/node";


// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
      exifExtractor({
        originalsDir: ["public/images/photography/stories", "public/images/photography/favorites"],
        outputFile: "src/data/exif-data.ts",
        watchForChanges: true
      })
  ],

  adapter: node({
    mode: "standalone"
  })
});