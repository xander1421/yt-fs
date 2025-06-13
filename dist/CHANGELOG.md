# Changelog

All notable changes to the YouTube Tab-Fullscreen extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-30

### Added
- Initial release of YouTube Tab-Fullscreen (Free Core)
- Tab-fullscreen toggle functionality with "TF" button in YouTube player controls
- Keyboard shortcut support (Alt + T)
- Per-tab memory using sessionStorage
- SPA-safe injection for YouTube's single-page application
- Native fullscreen awareness and conflict resolution
- Manifest V3 compliance with minimal permissions
- Comprehensive E2E test suite with Playwright
- TypeScript source code with Rollup build pipeline
- CSS overlay system for fullscreen experience
- Extension icons (32/48/128px)

### Features
- **F-01**: Tab-fullscreen toggle with visual button
- **F-02**: Alt + T keyboard shortcut
- **F-03**: Per-tab memory persistence
- **F-04**: YouTube SPA navigation compatibility
- **F-05**: Native fullscreen interaction handling

### Technical
- Manifest V3 browser extension
- Single content script architecture (no background workers)
- Minimal permissions (activeTab + storage only)
- < 30 KB total extension size
- ES2022 TypeScript compilation
- Comprehensive test coverage
- Production build pipeline with terser optimization

### Browser Support
- Chrome 88+
- Edge 88+
- Chromium-based browsers with MV3 support

---

## [Unreleased]

### Planned
- Auto-hide player controls option
- Custom keyboard shortcut configuration
- Theater mode integration improvements
- Performance optimizations
- Additional browser support (Firefox MV3 when available) 