# Changelog

All notable changes to the YouTube Tab-Fullscreen extension will be documented in this file.

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