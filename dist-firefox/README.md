# YouTube Tab-Fullscreen Extension

A lightweight browser extension that adds a Twitch-style tab-fullscreen mode to YouTube videos. Hide all distractions and focus on your content with a single click or keyboard shortcut. Works with Chrome, Firefox, Edge, and other compatible browsers.

## Features

- 🎬 **Tab-Fullscreen Mode**: Hide everything except the video player
- ⌨️ **Keyboard Shortcut**: Toggle with Alt+T
- 🎮 **In-Player Button**: Convenient toggle button in YouTube controls
- 💾 **Per-Tab Memory**: Remembers your preference for each tab
- 🚀 **Lightweight**: Minimal permissions, < 30KB total size
- 🎯 **Smart Navigation**: Works seamlessly with YouTube's single-page app

## Installation

### Chrome/Edge/Chromium

1. Clone this repository
2. Run `bun install` to install dependencies
3. Run `bun run build` to build the Chrome version
4. Open Chrome/Edge and navigate to `chrome://extensions/` or `edge://extensions/`
5. Enable "Developer mode" in the top right
6. Click "Load unpacked" and select the `dist` folder

### Firefox

1. Clone this repository
2. Run `bun install` to install dependencies
3. Run `bun run build:firefox` to build the Firefox version
4. Open Firefox and navigate to `about:debugging`
5. Click "This Firefox" in the sidebar
6. Click "Load Temporary Add-on"
7. Navigate to the `dist-firefox` folder and select `manifest.json`

## Usage

- **Toggle Button**: Click the tab-fullscreen button in the YouTube player controls
- **Keyboard**: Press Alt+T while watching a video
- **Extension Icon**: Click the extension icon in your toolbar (when on YouTube)

## How It Works

The extension adds a CSS class to hide all page elements except the video player, creating a distraction-free viewing experience similar to Twitch's theater mode. Your preference is saved per-tab using sessionStorage.

## Development

```bash
# Install dependencies
bun install

# Development builds with watch mode
bun run dev          # Chrome/Chromium version
bun run dev:firefox  # Firefox version

# Production builds
bun run build          # Chrome/Chromium version
bun run build:firefox  # Firefox version
bun run build:all      # Build both versions

# Lint code
bun run lint
```

## Browser Support

### Chrome-based (Manifest V3)
- Chrome 88+
- Edge 88+
- Brave
- Opera
- Vivaldi
- Any Chromium-based browser with Manifest V3 support

### Firefox-based (Manifest V2)
- Firefox 78+
- Firefox Developer Edition
- Firefox Nightly
- LibreWolf
- Waterfox
- Any Firefox-based browser

## Privacy

This extension:
- Does not collect any user data
- Does not make any network requests
- Only runs on YouTube.com
- Requires minimal permissions (activeTab only)

## License

MIT License - see LICENSE file for details.