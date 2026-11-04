// Keeps the CSS on the design tokens. Run with `npm run lint:css`.
const noRawColours = {
  "color-no-hex": [true, { message: "Use a colour token from src/styles/global.css (%s)" }],
  "color-named": ["never", { message: "Use a colour token from src/styles/global.css (%s)" }],
  // Black and white with alpha are allowed: they are overlays and shadows, not palette colours
  "declaration-property-value-disallowed-list": [
    { "/.*/": ["/rgba?\\((?!\\s*(0,\\s*0,\\s*0|255,\\s*255,\\s*255)\\b)/"] },
    { message: "Use a colour token from src/styles/global.css" },
  ],
};

export default {
  extends: ["stylelint-config-recommended"],
  rules: {
    ...noRawColours,
    "declaration-no-important": true,
    "selector-pseudo-class-no-unknown": [true, { ignorePseudoClasses: ["global"] }],
    // Scoped styles are organised by section, not by specificity
    "no-descending-specificity": null,
  },
  overrides: [
    { files: ["**/*.astro"], customSyntax: "postcss-html" },
    {
      // The one place raw colours belong
      files: ["src/styles/global.css"],
      rules: { "color-no-hex": null, "color-named": null, "declaration-property-value-disallowed-list": null },
    },
  ],
};
