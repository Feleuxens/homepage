// @ts-check
import { defineConfig, envField } from 'astro/config';
import { exifExtractor} from "./src/lib/exif-reader.ts";
import node from "@astrojs/node";

// Server-only settings for the contact form. All optional: when one is missing the form
// answers "unavailable" instead of the whole server failing to start.
const secret = (options = {}) => envField.string({ context: "server", access: "secret", optional: true, ...options });

// https://astro.build/config
export default defineConfig({
  security: {
    csp: {
      // Astro hashes the built inline scripts, including the server-island loader.
      scriptDirective: { resources: ["'self'"] },
      // Layout styles and ALTCHA's shadow-root styles require inline CSS.
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
      directives: [
        "default-src 'none'",
        "base-uri 'none'",
        "object-src 'none'",
        "form-action 'self'",
        "connect-src 'self'",
        "img-src 'self' data: https://photo.feleuxens.de",
        "font-src 'self'",
        "worker-src 'self' blob:", // ALTCHA proof-of-work workers
        "frame-src 'none'",
        "manifest-src 'self'",
      ],
    },
  },
  integrations: [
      exifExtractor({
        originalsDir: ["public/images/photography/stories", "public/images/photography/favorites"],
        outputFile: "src/data/exif-data.ts",
        watchForChanges: true
      })
  ],

  env: {
    schema: {
      CONTACT_SMTP_HOST: secret(),
      CONTACT_SMTP_PORT: envField.number({ context: "server", access: "secret", default: 465 }),
      // true: implicit TLS (usually port 465). false: STARTTLS, which is then required (usually port 587).
      CONTACT_SMTP_SECURE: envField.boolean({ context: "server", access: "secret", default: true }),
      CONTACT_SMTP_USER: secret(),
      CONTACT_SMTP_PASSWORD: secret(),
      // e.g. "Kontaktformular <kontakt@feleuxens.de>"
      CONTACT_MAIL_FROM: secret(),
      CONTACT_MAIL_TO: secret(),
      // Long random string, e.g. `openssl rand -hex 32`
      CONTACT_ALTCHA_SECRET: secret(),
      // Comma-separated origins allowed to submit the form
      CONTACT_ALLOWED_ORIGINS: secret({ default: "https://feleuxens.de" }),
      CONTACT_DAILY_LIMIT: envField.number({ context: "server", access: "secret", default: 50 }),
    }
  },

  adapter: node({
    mode: "standalone"
  })
});
