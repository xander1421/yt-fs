# Development Document — **YouTube Tab-Fullscreen (Free Core)**

*Version 1.0 · June 13 2025*

---

## 0 Table of Contents

1. Overview
2. Scope & Deliverables
3. File Layout & Build Pipeline
4. Feature Specifications
     4.1 Tab-Fullscreen Toggle (F-01)
     4.2 Keyboard Shortcut Alt + T (F-02)
     4.3 Per-Tab Memory (F-03)
     4.4 SPA-Safe Injection (F-04)
     4.5 Native-Fullscreen Awareness (F-05)
5. Component Design
6. Data & Control Flow
7. Coding Standards & Conventions
8. Testing Strategy
9. Release Checklist

---

## 1 Overview

The **Free Core** delivers a Twitch-style “tab-fullscreen” experience on YouTube with minimal permissions and no external services. All logic runs inside a single MV3 content script; no background worker is required for this tier.

---

## 2 Scope & Deliverables

| ID   | Deliverable             | Acceptance Criteria                                                                                       |
| ---- | ----------------------- | --------------------------------------------------------------------------------------------------------- |
| D-01 | `manifest.json`         | Loads on `youtube.com/watch*`, declares commands, **no** host permissions beyond `activeTab` & `storage`. |
| D-02 | `content.js`            | Implements F-01 → F-05; ≤ 12 KB minified.                                                                 |
| D-03 | `styles.css`            | Overlay rules; ≤ 3 KB minified.                                                                           |
| D-04 | Icons (32/48/128 PNG)   | Transparent background; simple “TF” glyph.                                                                |
| D-05 | README + Changelog      | Build/run instructions, MIT licence.                                                                      |
| D-06 | Playwright E2E test set | Passes in Chrome 122 stable & Canary.                                                                     |

---

## 3 File Layout & Build Pipeline

```
/src
  manifest.json
  content.ts           ← TypeScript source
  styles.css
  icons/
    32.png 48.png 128.png
/package.json
/rollup.config.js
/playwright.config.ts
```

**Commands**

```bash
npm run dev      # watches .ts/.css → dist/
npm run build    # rollup + terser → dist/zip
npm run test     # Playwright headless
```

---

## 4 Feature Specifications

### 4.1 F-01 Tab-Fullscreen Toggle

**UI**

* Small rectangular button **TF** injected into `.ytp-right-controls`.
* Tooltip: “Toggle tab-fullscreen (Alt + T)”.

**Behaviour**

* Adds/removes class `yt-tabfs-enabled` on `<html>` root.
* While enabled:

  ```css
  html.yt-tabfs-enabled ytd-player {
    position: fixed !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 9999 !important;
    background: #000;
  }
  html.yt-tabfs-enabled body > :not(ytd-app) { display: none !important; }
  ```
* Must survive player resize, ads, mini-player dismissal.

### 4.2 F-02 Keyboard Shortcut Alt + T

Declared in `manifest.json → commands`.
Handler lives in `content.js` and dispatches same toggle logic as the button.

### 4.3 F-03 Per-Tab Memory

* Store `isEnabled` boolean in `window.sessionStorage`.

  ```js
  const key = 'ytTabFS';               // per-tab scope
  sessionStorage.setItem(key, '1');    // on enable
  ```
* On script load: read value and re-apply mode if present.

### 4.4 F-04 SPA-Safe Injection

* Listen to native Polymer events:

  ```js
  window.addEventListener('yt-page-data-updated', initOnce);
  ```
* Fallback MutationObserver attached to `<ytd-app>` with `{childList:true, subtree:false}`. Disconnect once button present.

### 4.5 F-05 Native-Fullscreen Awareness

* Listen for `fullscreenchange` and YouTube’s `html.ytp-fullscreen`.
* If native fullscreen becomes active **and** `yt-tabfs-enabled` is set → remove our class and store flag so restore after exit.

---

## 5 Component Design

| Module            | Responsibilities                                   | Key APIs                                     |
| ----------------- | -------------------------------------------------- | -------------------------------------------- |
| **UIInjector**    | Locate `.ytp-right-controls`, insert ToggleButton. | `inject()`, `reinjectIfMissing()`            |
| **ToggleButton**  | Visual element, click handler, tooltip.            | `createEl()`, `setActive(isOn)`              |
| **StateManager**  | Get/set `isEnabled` in `sessionStorage`.           | `load()`, `save(bool)`                       |
| **DOMOverlay**    | Apply/remove CSS class; perform cleanup.           | `enable()`, `disable()`                      |
| **EventBridge**   | Wire shortcut & fullscreen events to DOMOverlay.   | `initShortcuts()`, `initFullscreenWatcher()` |
| **ObserverGuard** | Manages MutationObserver lifecycle.                | `start()`, `stop()`                          |

All reside in `content.ts` namespace modules for bundler tree-shaking.

---

## 6 Data & Control Flow

```
                +------------------+
                | UIInjector.inject|
                +---------+--------+
                          |
        yt-page-data-updated / MutationObserver
                          |
                +---------v--------+
Alt+T ---------> |   EventBridge   | -------- fullscreenchange
(click)          +---------+-------+
                          |
                +---------v--------+
                |  DOMOverlay      |
                +---------+--------+
                          |
                +---------v--------+
                |  StateManager    |
                +------------------+
```

---

## 7 Coding Standards & Conventions

* **Language:** TypeScript 5.x, ES2022 target.
* **Lints:** ESLint AirBnB + `@typescript-eslint`.
* **Module style:** Plain functions + module namespace; avoid classes.
* **No `eval` or dynamic import** (keeps CSP relaxed).
* **Shadow DOM piercing:** `querySelector('.ytp-right-controls')` only; no deep combinators.

---

## 8 Testing Strategy

| Level       | Tool             | Scenarios                                                                                                                                                                                                                                                      |
| ----------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | Vitest           | `StateManager` save/restore; `DOMOverlay` add/remove.                                                                                                                                                                                                          |
| Integration | Playwright       | 1️⃣ Load video → click TF button → expect `<ytd-player>` to fill viewport. 2️⃣ Press Alt+T to toggle back. 3️⃣ Navigate via YouTube sidebar → TF state persists. 4️⃣ Press `f` → native full → TF disables → exit native → TF state restores if previously on. |
| Performance | Lighthouse trace | Extension adds < 5 ms scripting time per navigation.                                                                                                                                                                                                           |

---

## 9 Release Checklist

1. **npm run build** → verify `dist/youtube-tabfs.zip` < 30 KB.
2. Install unpacked → manual smoke on watch, live, shorts.
3. Playwright run on Chrome Stable & Canary.
4. Increment version in `manifest.json` & tag `v1.0.0-core`.
5. Create draft release on GitHub (attach ZIP).
6. Upload to Chrome Web Store (channel: *Unlisted* for QA).
7. Fill Store listing: description, screenshots, MIT licence.
8. Publish to *Production* once QA passes.

---

### END OF DOCUMENT

This development blueprint should let a single engineer implement and ship the free core in \~1–2 sprint cycles. Ping me for clarifications or deeper code samples!
