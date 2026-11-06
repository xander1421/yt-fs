# YouTube Tab-Fullscreen Extension

A lightweight browser extension that adds a Twitch-style tab-fullscreen mode to YouTube videos. Hide all distractions and focus on your content with a single click or keyboard shortcut. Works with Chrome, Firefox, Edge, and other compatible browsers.

## Features

- 🎬 **Tab-Fullscreen Mode**: Hide everything except the video player
- ⌨️ **Keyboard Shortcut**: Toggle with Alt+T
- 🎮 **In-Player Button**: Convenient toggle button in YouTube controls
- 💾 **Per-Tab Memory**: Remembers your preference for each tab
- 🏔️ **Doomscroll Meter**: Tracks how far you've scrolled the feed (as a fun distance) and nudges you when you've gone too far
- 🚀 **Lightweight**: No network requests, local-only, ~43 KB total
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
- **Toolbar Icon**: Click the extension icon to open the popup — today's scroll stats, quick toggles, a tab-fullscreen button, and a link to full settings
- **Settings**: Open the popup → "Full settings" (or right-click the icon → Options) to tune nudge/block timings, the badge, and which feeds are watched

## How It Works

The extension adds a CSS class to hide all page elements except the video player, creating a distraction-free viewing experience similar to Twitch's theater mode. Your preference is saved per-tab using sessionStorage.

### Doomscroll Meter

On YouTube feed pages (home, subscriptions, Shorts) the extension quietly measures how far you've scrolled and how long you've been active. A peek banner shows while you scroll — `📜 180 m · 42 min` — and fades once you stop. It then escalates on your continuous session time (which resets after a 5-minute break):

- **3 minutes** — a soft, dismissible nudge asks if you're sure you want to keep going, with a landmark gag for scale ("1.3× the Leaning Tower of Pisa"). "Keep scrolling" snoozes it; "I'm done" takes you back to the top.
- **10 minutes** — a hard block (like Instagram's "Take a break" or an Android app timer): **Add 5 min** to carry on, or **Go to top** to step away. A checkbox lets you switch the hard block off and keep only the gentle nudges.
- **Share it** — the nudge and the popup can turn your day's distance into an image ("I doomscrolled on YouTube today 🫠" with your distance and a landmark). It's drawn locally and copied to your clipboard, so you can paste it anywhere.

It never appears while you're watching a video.

The distance is a deliberately playful approximation (based on the CSS reference pixel, not your real screen), the daily counter lives entirely in your browser's `chrome.storage.local`, and nothing is ever sent anywhere.

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
- Requires minimal permissions: `activeTab` and `storage` (local only — preferences and the scroll counter never leave your device)

## License

MIT License - see LICENSE file for details.