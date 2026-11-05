# Changelog

All notable changes to the YouTube Tab-Fullscreen extension will be documented in this file.

## [1.3.0] - 2026-11-05

### Added
- **Doomscroll meter** on feed surfaces (home, `/feed/*`, Shorts). A peek banner
  shows how far you've scrolled today as a playful distance plus active time
  (e.g. "📜 180 m · 42 min") and fades when you stop scrolling.
- **Escalation ladder** on continuous-session time (resets after a 5-min break):
  - **3 min** → a soft, dismissible nudge with a landmark gag ("1.3× the Leaning
    Tower of Pisa"). "Keep scrolling" snoozes; "I'm done" scrolls you to the top.
  - **10 min** → a hard block (Instagram/Android style): "Add 5 min" to extend, or
    "Go to top" to leave. The feed is frozen behind it until you choose.
- **Hard-block toggle**: a checkbox on the block screen (and in settings) turns the
  hard wall off (soft nudges only).
- **Share card**: the soft nudge and the popup can turn today's distance into a
  shareable image ("I doomscrolled on YouTube today 🫠" + your distance and a
  landmark). Copied to the clipboard, or downloaded. Rendered locally on a canvas —
  nothing is uploaded.
- **Toolbar popup**: clicking the extension icon now opens a popup with today's
  stats, quick toggles (meter / hard block), a tab-fullscreen button, and a link to
  the full settings page.
- **Settings page** (`options_ui`): enable/disable the meter, set the soft-nudge and
  hard-block minutes, choose the badge display (peek / always / off), pick which
  feeds to watch (home / subscriptions / Shorts), and reset today's counter.
- Preferences and the daily counter are stored in `chrome.storage.local` (shared
  live between the page, popup, and settings) and reset at midnight.

### Changed
- The toolbar icon opens the popup instead of toggling tab-fullscreen. Tab-fullscreen
  is still toggled by the in-player button, the Alt+T shortcut, and the popup button.

### Notes
- Adds the `storage` permission (local only — nothing leaves your device). The
  distance figure remains a local approximation (CSS reference pixel), a gag not
  telemetry; still no network requests.
- The meter never runs on the `/watch` page; tab-fullscreen behaviour is unchanged.
- Known gap: scroll distance is measured from wheel/trackpad input, so keyboard and
  scrollbar-drag scrolling isn't counted; Shorts distance may under-count.

## [1.2.2] - 2026-07-12

### Fixed
- Tab-fullscreen and YouTube's native fullscreen are now mutually exclusive.
  Entering native fullscreen suspends the tab-fill overlay (and restores it on
  exit); toggling tab-fullscreen on while in native fullscreen leaves native
  fullscreen first. This prevents the two modes from stacking, which could
  break YouTube's on-screen controls (including the exit-fullscreen button).

## [1.2.1] - 2026-07-12

### Fixed
- Tab-fullscreen now tears down cleanly on toggle off — video no longer stays enlarged and pinned to the top-left corner
- Control/nav bar now stretches to the full viewport width when tab-fullscreen is activated (previously kept its pre-fullscreen width)
- Alt+T no longer double-fires from duplicate listeners, which could cancel the toggle

### Changed
- Single source of truth for the enabled state (storage, page class, and button now stay in sync)
- Force a layout recompute on toggle so YouTube resizes the player and controls to the new container

## [1.2.0] - 2024-12-30

### Added
- Full Firefox support with Manifest V2
- Separate build process for Firefox (`bun run build:firefox`)
- Cross-browser compatibility layer for Chrome and Firefox APIs
- Support for all Firefox-based browsers (LibreWolf, Waterfox, etc.)

### Changed
- Removed all ad-blocking functionality 
- Cleaned up codebase and removed unnecessary debug logging
- Simplified permissions (only activeTab required)
- Improved button injection reliability
- Fixed button position inconsistency
- Enhanced button persistence through YouTube's dynamic page updates

## [1.0.0] - 2024-12-30

### Added
- Initial release of YouTube Tab-Fullscreen
- Tab-fullscreen toggle functionality with button in YouTube player controls
- Keyboard shortcut support (Alt + T)
- Per-tab memory using sessionStorage
- SPA-safe injection for YouTube's single-page application
- Native fullscreen awareness and conflict resolution
- Manifest V3 compliance with minimal permissions
- TypeScript source code with Rollup build pipeline
- CSS overlay system for fullscreen experience
- Extension icons (32/48/128px)

### Features
- Tab-fullscreen toggle with visual button
- Alt + T keyboard shortcut
- Per-tab memory persistence
- YouTube SPA navigation compatibility
- Native fullscreen interaction handling

### Technical
- Manifest V3 browser extension
- Single content script architecture
- Minimal permissions (activeTab only)
- < 30 KB total extension size
- ES2022 TypeScript compilation

### Browser Support
- Chrome 88+
- Edge 88+
- Chromium-based browsers with MV3 support