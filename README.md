[![Build image](https://github.com/Feleuxens/homepage/actions/workflows/build.yml/badge.svg)](https://github.com/Feleuxens/homepage/actions/workflows/build.yml)

# My personal homepage

## 🚀 Project Structure

```text
/
├── public/
├── src/
│   ├── components/
│   │   └── ...
│   ├── layouts/
│   │   └── MainLayout.astro
│   ├── pages/
│   │   └── ...
│   ├── styles/
│   │   └── *.css
│   └── utils/
│       └── exif-reader.js
├── package.json
├── Dockerfile
├── nginx.conf
└── ...
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Exif reader

The exif reader looks for all photos inside `public/images/` and outputs the exif data to `src/data/exif-data.js`.
This is used for a string containing camera model, lens, etc. under clickable photos (e.g., on the photography page).
