# YouTube Tab-Fullscreen Extension

A browser extension that provides a **Twitch-style "tab-fullscreen" experience** on YouTube, making the video player fill the entire browser tab while keeping it within the tab (not native OS fullscreen).

## Features

- 🎯 **Tab-Fullscreen Toggle**: Click the "TF" button in YouTube's player controls
- ⌨️ **Keyboard Shortcut**: Press `Alt + T` to quickly toggle
- 💾 **Per-Tab Memory**: State persists when navigating within YouTube
- 🔄 **SPA-Safe**: Works with YouTube's single-page app navigation
- 🖥️ **Fullscreen Aware**: Handles native fullscreen interactions gracefully

## Installation

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repo-url>
   cd youtube-tabfs
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

1. Navigate to any YouTube video (`youtube.com/watch?v=...`)
2. Look for the **"TF"** button in the player controls (bottom right)
3. Click the button or press `Alt + T` to toggle tab-fullscreen
4. The video player will fill your entire browser tab
5. Toggle again to return to normal view

## Technical Details

- **Manifest V3** browser extension
- **Minimal permissions** (only `activeTab` & `storage`)
- **Single content script** approach (no background workers)
- **TypeScript** source with **Rollup** build pipeline
- **< 30 KB** total extension size

## File Structure

```
/src
  manifest.json     # Extension configuration
  content.ts        # Main logic (TypeScript)
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

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history. 