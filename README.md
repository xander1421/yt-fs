# YouTube Tab-Fullscreen Extension

A browser extension that provides a **Twitch-style "tab-fullscreen" experience** on YouTube with **automatic ad-skipping**, making the video player fill the entire browser tab while seamlessly skipping ads.

## Features

- 🎯 **Tab-Fullscreen Toggle**: Click the "TF" button in YouTube's player controls
- ⚡ **Auto Ad-Skip**: Automatically skips YouTube ads in 1-3 seconds (always enabled)
- ⌨️ **Keyboard Shortcut**: Press `Alt + T` to quickly toggle tab-fullscreen
- 💾 **Per-Tab Memory**: State persists when navigating within YouTube
- 🔄 **SPA-Safe**: Works with YouTube's single-page app navigation
- 🖥️ **Fullscreen Aware**: Handles native fullscreen interactions gracefully
- 🛡️ **Undetectable**: Ad-skipping uses proven methods that bypass YouTube's ad-blocker warnings

## Installation

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/xander1421/yt-fs.git
   cd yt-fs
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

3. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

### Production Build

```bash
npm run build
```

This creates a production-ready extension in the `dist/` folder.

## Development

- **Watch mode:** `npm run dev` - Rebuilds on file changes
- **Run tests:** `npm run test` - Playwright E2E tests
- **Lint code:** `npm run lint` - ESLint validation

## Usage

### Tab-Fullscreen
1. Navigate to any YouTube video (`youtube.com/watch?v=...`)
2. Look for the **"TF"** button in the player controls (bottom right)
3. Click the button or press `Alt + T` to toggle tab-fullscreen
4. The video player will fill your entire browser tab
5. Toggle again to return to normal view

### Auto Ad-Skip
- **Always Active**: Ad-skipping works automatically on all YouTube videos
- **No Configuration**: No settings needed - works out of the box
- **Fast & Reliable**: Skips ads in 1-3 seconds using proven methods
- **Undetectable**: Uses YouTube's own player API to avoid detection
- **All Ad Types**: Handles video ads, pie countdown ads, and survey questions

## How Ad-Skipping Works

The extension uses a proven method based on the successful [Auto Skip YouTube Ads](https://greasyfork.org/en/scripts/498197-auto-skip-youtube-ads) userscript (44,601+ users):

1. **Detection**: Monitors for `.ad-showing` class and other ad indicators
2. **Player Reload**: Reloads the video at the current timestamp to skip ads
3. **Fallback Methods**: Uses video seeking and speed-up as backups
4. **YouTube Music Support**: Special handling for music.youtube.com

This approach is undetectable because it uses YouTube's own player API rather than blocking or manipulating ad elements.

## Technical Details

- **Manifest V3** browser extension
- **Minimal permissions** (only `activeTab` & `storage`)
- **Single content script** approach (no background workers)
- **TypeScript** source with **Rollup** build pipeline
- **< 30 KB** total extension size
- **Proven ad-skip algorithm** based on 44K+ user tested methods

## File Structure

```
/src
  manifest.json     # Extension configuration
  content.ts        # Main tab-fullscreen logic
  ad-skipper.ts     # Ad-skipping functionality
  styles.css        # Tab-fullscreen styles
  icons/            # Extension icons (32/48/128px)
/tests
  extension.spec.ts # E2E tests
package.json        # Dependencies and scripts
rollup.config.js    # Build configuration
```

## Browser Support

- Chrome 88+
- Edge 88+
- Any Chromium-based browser with Manifest V3 support

## Privacy

This extension:
- ✅ Works entirely offline (no external services)
- ✅ Only accesses YouTube watch pages
- ✅ Stores preferences locally (sessionStorage)
- ✅ No data collection or tracking
- ✅ Ad-skipping happens locally using YouTube's own API

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## Troubleshooting

**Button not appearing?**
- Refresh the YouTube page
- Check that you're on a `/watch?v=` URL
- Verify the extension is enabled in `chrome://extensions/`

**Tab-fullscreen not working?**
- Try disabling other YouTube extensions temporarily
- Check browser console for errors
- Ensure you're using a supported browser version

**Ad-skipping not working?**
- Check browser console for `[YT-TabFS]` logs
- Ensure you're on a regular YouTube video (not Shorts)
- Try refreshing the page
- Ad-skipping may take 1-3 seconds (this is normal and optimal)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history. 
