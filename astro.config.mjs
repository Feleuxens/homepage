// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import { exifExtractor} from "./src/utils/exif-reader.js";


// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [
      react(),
      exifExtractor({
        originalsDir: ["public/images/photography/stories", "public/images/photography/favorites"],
        outputFile: "src/data/exif-data.js",
        watchForChanges: true
      })
  ]
});