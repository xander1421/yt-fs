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

- `dist-firefox/content.js`   ← from `src/content.ts` (imports `src/doomscroll.ts`, `src/store.ts`)
- `dist-firefox/background.js` ← from `src/background.ts`
- `dist-firefox/popup.js`      ← from `src/popup.ts` (imports `src/store.ts`, `src/doomscroll.ts`)
- `dist-firefox/options.js`    ← from `src/options.ts` (imports `src/store.ts`, `src/doomscroll.ts`)
- `dist-firefox/manifest.json` ← copied from `src/manifest.firefox.json`
- `dist-firefox/styles.css`    ← copied from `src/styles.css`
- `dist-firefox/popup.html`    ← copied from `src/popup.html`
- `dist-firefox/options.html`  ← copied from `src/options.html`
- `dist-firefox/icons/*`       ← copied from `src/icons/`

These match the files in the submitted add-on package.

## Build tooling

- `rollup` — bundles the TypeScript entry points into single IIFE files
- `@rollup/plugin-typescript` — compiles `.ts` → `.js`
- `@rollup/plugin-terser` — minifies the production output
  (variable mangling on, property mangling off; `rollup.config.js`)
- `rollup-plugin-copy` — copies the manifest, styles, the popup/options pages, and
  the three referenced icons (32/48/128)
- `scripts/clean.mjs` — each production build first removes its output dir, so the
  package never contains stale or dev-only files

Build configuration: `rollup.config.js`, `tsconfig.json`.

## Notes

- No remote code, no eval, no bundled third-party libraries.
- The only difference between the Chrome and Firefox builds is the manifest
  (`src/manifest.json` vs `src/manifest.firefox.json`) selected by the
  `TARGET=firefox` environment variable.
- `content.js` bundles `src/doomscroll.ts` (the "doomscroll meter") and `src/store.ts`.
  The popup (`popup.html`/`popup.js`) and options page (`options.html`/`options.js`)
  share preferences and a daily scroll/time counter via `chrome.storage.local`
  (keys `ytds-prefs`, `ytds-day`). This is why the build requests the `storage`
  permission. Everything is local — no network requests, no remote endpoints.
- `storage` is the only permission added since the previous version; the extension
  otherwise still uses `activeTab` only.
- `tests/` is a developer self-check (`bun tests/doomscroll.check.ts`) and is not
  part of the shipped add-on (excluded from the build and from `tsconfig`).
