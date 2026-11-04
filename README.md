[![Build image](https://github.com/Feleuxens/homepage/actions/workflows/build.yml/badge.svg)](https://github.com/Feleuxens/homepage/actions/workflows/build.yml)

# My personal homepage

## 🚀 Project Structure

```text
/
├── public/
├── src/
│   ├── components/      # Reusable components with their own scoped styles
│   │   └── ...
│   ├── data/            # Content shared between pages (services, repertoire, career years, ...)
│   │   └── ...          # exif-data.ts is generated, don't edit it
│   ├── layouts/
│   │   └── MainLayout.astro
│   ├── lib/             # Site facts, contact form, gallery, lightbox, exif reader
│   │   └── ...
│   ├── pages/
│   │   └── ...
│   └── styles/
│       ├── global.css   # Design tokens, base styles and shared classes
│       └── ...          # Styles shared by a few pages or built at runtime
├── package.json
├── stylelint.config.mjs
├── Dockerfile
├── nginx.conf
└── ...
```

## 🎨 Styling

- Styles belong in the scoped `<style>` of the page or component that uses them.
- `src/styles/global.css` holds the design tokens (colours, spacing, type) and the few classes used across pages. Colours are only defined there; `npm run lint:css` rejects raw colours anywhere else.
- A future dark theme only needs to override the tokens under `[data-theme="dark"]`.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run lint:css`        | Checks the CSS with Stylelint (also runs in CI)  |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Content Security Policy

Astro generates a CSP meta tag per production page, including hashes for its
inline scripts. The policy permits same-origin scripts, fonts and connections,
gallery images from `https://photo.feleuxens.de`, and blob workers for ALTCHA.
Inline CSS remains allowed for layout attributes and the ALTCHA widget.
Development mode does not enforce this policy; validate with a production build.

When deploying, replace the public reverse proxy's existing CSP header with:

```nginx
add_header Content-Security-Policy "frame-ancestors 'self'; upgrade-insecure-requests;" always;
```


## Exif reader

The exif reader looks for all photos inside `public/images/` and outputs the exif data to `src/data/exif-data.ts`.
This is used for a string containing camera model, lens, etc. under clickable photos (e.g., on the photography page).
