# Changelog

All notable changes to the YouTube Tab-Fullscreen extension will be documented in this file.

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