# AMO Reviewer Build Instructions

This extension is written in TypeScript and bundled with Rollup. The submitted
`content.js` / `background.js` are minified by terser, so they are generated
from the `src/` sources below.

## Build environment

- OS: Linux (any; also builds on macOS/Windows)
- Node.js: v20 LTS (v18+ works)
- Package manager: npm (a `package-lock.json` is included). `bun` also works.

## Steps to reproduce the submitted files

```bash
# 1. Install exact dependencies
npm ci

# 2. Build the Firefox target (production)
npm run build:firefox
```

Output is written to `dist-firefox/`:

- `dist-firefox/content.js`   ← from `src/content.ts`
- `dist-firefox/background.js` ← from `src/background.ts`
- `dist-firefox/manifest.json` ← copied from `src/manifest.firefox.json`
- `dist-firefox/styles.css`    ← copied from `src/styles.css`
- `dist-firefox/icons/*`       ← copied from `src/icons/`

These match the files in the submitted add-on package.

## Build tooling

- `rollup` — bundles the TypeScript entry points into single IIFE files
- `@rollup/plugin-typescript` — compiles `.ts` → `.js`
- `@rollup/plugin-terser` — minifies the production output
  (variable mangling on, property mangling off; `rollup.config.js`)
- `rollup-plugin-copy` — copies the manifest, styles, and icons

Build configuration: `rollup.config.js`, `tsconfig.json`.

## Notes

- No remote code, no eval, no bundled third-party libraries.
- The only difference between the Chrome and Firefox builds is the manifest
  (`src/manifest.json` vs `src/manifest.firefox.json`) selected by the
  `TARGET=firefox` environment variable.
