# Changelog

All notable changes to the YouTube Tab-Fullscreen extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-30

### Added
- **🚀 MAJOR**: Automatic YouTube ad-skipping functionality (always enabled)
- Proven ad-skip algorithm based on successful 44K+ user tested methods
- Player reload method for undetectable ad-skipping
- Support for all ad types: video ads, pie countdown ads, survey questions
- YouTube Music specific ad-skipping optimizations
- Fallback methods: video seeking and speed-up
- Smart ad detection using `.ad-showing` class and other indicators
- 500ms monitoring interval for optimal performance vs. detection balance
- Comprehensive error handling and retry logic with cooldown periods

### Features
- **F-06**: Automatic ad-skipping (1-3 second skip time)
- **F-07**: YouTube Music ad-skipping support
- **F-08**: Multiple fallback skip methods
- **F-09**: Undetectable ad-skipping using YouTube's own API
- **F-10**: Smart throttling to avoid YouTube detection

### Technical
- New `ad-skipper.ts` module with modular architecture
- Based on proven [Auto Skip YouTube Ads](https://greasyfork.org/en/scripts/498197-auto-skip-youtube-ads) userscript methods
- Player API integration for video reloading
- YouTube Shorts detection and exclusion
- Enhanced logging for debugging ad-skip functionality
- Cooldown and retry mechanisms for reliability

### Changed
- Extension now provides dual functionality: tab-fullscreen + ad-skipping
- Updated button tooltip to indicate ad-skipping is always active
- Enhanced console logging with `[YT-TabFS]` prefix for better debugging

### Performance
- Optimized ad detection with reliable selectors
- Minimal performance impact with smart interval timing
- Efficient player API usage for seamless video reloading

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