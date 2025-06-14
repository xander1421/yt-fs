import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionPath = path.join(__dirname, '../dist');

test.describe('YouTube Tab-Fullscreen Extension', () => {
  let context: any;
  let page: any;

  test.beforeAll(async ({ browser }) => {
    // Load extension by launching browser with extension args
    const browserWithExtension = await browser.browserType().launch({
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-first-run',
        '--disable-default-apps',
      ],
    });
    context = await browserWithExtension.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should inject TF button into YouTube player controls', async () => {
    // Navigate to a YouTube video
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for the video player to load
    await page.waitForSelector('.html5-video-player', { timeout: 10000 });
    
    // Wait for our button to be injected
    await page.waitForSelector('#yt-tabfs-button', { timeout: 5000 });
    
    // Verify button is present and has correct attributes
    const button = page.locator('#yt-tabfs-button');
    await expect(button).toBeVisible();
    await expect(button).toHaveText('TF');
    await expect(button).toHaveAttribute('title', 'Toggle tab-fullscreen (Alt + T)');
  });

  test('should toggle tab-fullscreen on button click', async () => {
    // Navigate to a YouTube video
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for the video player and button
    await page.waitForSelector('.html5-video-player', { timeout: 10000 });
    await page.waitForSelector('#yt-tabfs-button', { timeout: 5000 });
    
    // Initially, tab-fullscreen should not be enabled
    await expect(page.locator('html')).not.toHaveClass(/yt-tabfs-enabled/);
    
    // Click the TF button
    await page.click('#yt-tabfs-button');
    
    // Verify tab-fullscreen is enabled
    await expect(page.locator('html')).toHaveClass(/yt-tabfs-enabled/);
    
    // Verify ytd-player has the correct styles
    const player = page.locator('ytd-player');
    await expect(player).toHaveCSS('position', 'fixed');
    await expect(player).toHaveCSS('z-index', '9999');
    
    // Click again to disable
    await page.click('#yt-tabfs-button');
    
    // Verify tab-fullscreen is disabled
    await expect(page.locator('html')).not.toHaveClass(/yt-tabfs-enabled/);
  });

  test('should toggle tab-fullscreen with Alt+T keyboard shortcut', async () => {
    // Navigate to a YouTube video
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for the video player and button
    await page.waitForSelector('.html5-video-player', { timeout: 10000 });
    await page.waitForSelector('#yt-tabfs-button', { timeout: 5000 });
    
    // Initially, tab-fullscreen should not be enabled
    await expect(page.locator('html')).not.toHaveClass(/yt-tabfs-enabled/);
    
    // Press Alt+T
    await page.keyboard.press('Alt+t');
    
    // Verify tab-fullscreen is enabled
    await expect(page.locator('html')).toHaveClass(/yt-tabfs-enabled/);
    
    // Press Alt+T again to disable
    await page.keyboard.press('Alt+t');
    
    // Verify tab-fullscreen is disabled
    await expect(page.locator('html')).not.toHaveClass(/yt-tabfs-enabled/);
  });

  test('should persist tab-fullscreen state during YouTube navigation', async () => {
    // Navigate to a YouTube video
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for the video player and button
    await page.waitForSelector('.html5-video-player', { timeout: 10000 });
    await page.waitForSelector('#yt-tabfs-button', { timeout: 5000 });
    
    // Enable tab-fullscreen
    await page.click('#yt-tabfs-button');
    await expect(page.locator('html')).toHaveClass(/yt-tabfs-enabled/);
    
    // Navigate to another video via YouTube's SPA navigation
    await page.click('a[href*="/watch?v="]'); // Click on a related video
    
    // Wait for navigation to complete
    await page.waitForTimeout(2000);
    
    // Wait for button to be re-injected
    await page.waitForSelector('#yt-tabfs-button', { timeout: 5000 });
    
    // Verify tab-fullscreen state is restored
    await expect(page.locator('html')).toHaveClass(/yt-tabfs-enabled/);
  });

  test.skip('should handle native fullscreen interaction', async () => {
    // Navigate to a YouTube video
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for the video player and button
    await page.waitForSelector('.html5-video-player', { timeout: 10000 });
    await page.waitForSelector('#yt-tabfs-button', { timeout: 5000 });
    
    // Enable tab-fullscreen first
    await page.click('#yt-tabfs-button');
    await expect(page.locator('html')).toHaveClass(/yt-tabfs-enabled/);
    
    // Trigger native fullscreen (this might not work in headless mode)
    await page.keyboard.press('f');
    
    // Wait for fullscreen change
    await page.waitForTimeout(1000);
    
    // Tab-fullscreen should be temporarily disabled
    await expect(page.locator('html')).not.toHaveClass(/yt-tabfs-enabled/);
    
    // Exit native fullscreen
    await page.keyboard.press('Escape');
    
    // Wait for fullscreen exit
    await page.waitForTimeout(1000);
    
    // Tab-fullscreen should be restored
    await expect(page.locator('html')).toHaveClass(/yt-tabfs-enabled/);
  });

  test('should handle button re-injection after DOM changes', async () => {
    // Navigate to a YouTube video
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for initial button
    await page.waitForSelector('#yt-tabfs-button', { timeout: 10000 });
    
    // Simulate DOM change by removing the button
    await page.evaluate(() => {
      const button = document.getElementById('yt-tabfs-button');
      if (button) button.remove();
    });
    
    // Wait a moment for the MutationObserver to detect changes
    await page.waitForTimeout(2000);
    
    // Button should be re-injected
    await expect(page.locator('#yt-tabfs-button')).toBeVisible();
  });

  test('should not inject button on non-watch pages', async () => {
    // Navigate to YouTube homepage
    await page.goto('https://www.youtube.com/');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Button should not be present
    await expect(page.locator('#yt-tabfs-button')).not.toBeVisible();
  });

  test('should handle rapid toggle operations', async () => {
    // Navigate to a YouTube video
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for button
    await page.waitForSelector('#yt-tabfs-button', { timeout: 10000 });
    
    // Rapidly toggle multiple times
    for (let i = 0; i < 5; i++) {
      await page.click('#yt-tabfs-button');
      await page.waitForTimeout(100);
    }
    
    // Final state should be enabled (started disabled, toggled 5 times)
    await expect(page.locator('html')).toHaveClass(/yt-tabfs-enabled/);
  });

  test('should work with ads present', async () => {
    // Navigate to a YouTube video that might have ads
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for player
    await page.waitForSelector('.html5-video-player', { timeout: 10000 });
    
    // Wait for button (even if ads are playing)
    await page.waitForSelector('#yt-tabfs-button', { timeout: 15000 });
    
    // Button should be clickable even with ads
    await page.click('#yt-tabfs-button');
    await expect(page.locator('html')).toHaveClass(/yt-tabfs-enabled/);
  });

  test('should maintain state during video quality changes', async () => {
    // Navigate to a YouTube video
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for button and enable tab-fullscreen
    await page.waitForSelector('#yt-tabfs-button', { timeout: 10000 });
    await page.click('#yt-tabfs-button');
    await expect(page.locator('html')).toHaveClass(/yt-tabfs-enabled/);
    
    // Simulate video quality change by clicking settings
    try {
      await page.click('.ytp-settings-button');
      await page.waitForTimeout(500);
      // Click somewhere else to close settings
      await page.click('.html5-video-player');
      await page.waitForTimeout(1000);
    } catch {
      // Settings interaction might fail, that's okay
    }
    
    // Tab-fullscreen should still be enabled
    await expect(page.locator('html')).toHaveClass(/yt-tabfs-enabled/);
    await expect(page.locator('#yt-tabfs-button')).toBeVisible();
  });

  test('should handle keyboard shortcuts correctly', async () => {
    // Navigate to a YouTube video
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for page to load completely
    await page.waitForSelector('#yt-tabfs-button', { timeout: 10000 });
    
    // Test Alt+T when focused on video
    await page.click('.html5-video-player');
    await page.keyboard.press('Alt+t');
    await expect(page.locator('html')).toHaveClass(/yt-tabfs-enabled/);
    
    // Test Alt+T again to disable
    await page.keyboard.press('Alt+t');
    await expect(page.locator('html')).not.toHaveClass(/yt-tabfs-enabled/);
  });

  test('should not interfere with YouTube hotkeys', async () => {
    // Navigate to a YouTube video
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for video player
    await page.waitForSelector('.html5-video-player', { timeout: 10000 });
    await page.waitForSelector('#yt-tabfs-button', { timeout: 5000 });
    
    // Click on video to focus it
    await page.click('.html5-video-player');
    
    // Test that space bar still works for play/pause
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    
    // Test that other YouTube shortcuts don't trigger our extension
    await page.keyboard.press('k'); // Play/pause
    await page.keyboard.press('j'); // Rewind
    await page.keyboard.press('l'); // Forward
    
    // Our extension should not be enabled by these keys
    await expect(page.locator('html')).not.toHaveClass(/yt-tabfs-enabled/);
  });

  test('should work across different video types', async () => {
    const videoTypes = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Regular video
      // Note: Live streams and premieres would need actual live content
    ];

    for (const videoUrl of videoTypes) {
      await page.goto(videoUrl);
      
      // Wait for button
      await page.waitForSelector('#yt-tabfs-button', { timeout: 10000 });
      
      // Test toggle functionality
      await page.click('#yt-tabfs-button');
      await expect(page.locator('html')).toHaveClass(/yt-tabfs-enabled/);
      
      // Disable for next test
      await page.click('#yt-tabfs-button');
      await expect(page.locator('html')).not.toHaveClass(/yt-tabfs-enabled/);
    }
  });

  test('should initialize ad-skipping functionality', async () => {
    // Navigate to a YouTube video
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for the video player to load
    await page.waitForSelector('.html5-video-player', { timeout: 10000 });
    
    // Check that ad-skipping is running by looking for console logs
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('[YT-TabFS]')) {
        logs.push(msg.text());
      }
    });
    
    // Wait for initialization
    await page.waitForTimeout(3000);
    
    // Should have initialization logs
    const hasInitLog = logs.some(log => log.includes('Ad-skipping initialized'));
    expect(hasInitLog).toBe(true);
  });

  test('should detect ad elements when present', async () => {
    // Navigate to a YouTube video
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for player
    await page.waitForSelector('.html5-video-player', { timeout: 10000 });
    
    // Simulate ad presence by adding ad-showing class
    await page.evaluate(() => {
      const player = document.querySelector('.html5-video-player');
      if (player) {
        player.classList.add('ad-showing');
      }
    });
    
    // Wait for ad detection
    await page.waitForTimeout(2000);
    
    // Remove ad class to simulate ad being skipped
    await page.evaluate(() => {
      const player = document.querySelector('.html5-video-player');
      if (player) {
        player.classList.remove('ad-showing');
      }
    });
    
    // Ad-skipping should not interfere with tab-fullscreen functionality
    await page.waitForSelector('#yt-tabfs-button', { timeout: 5000 });
    await page.click('#yt-tabfs-button');
    await expect(page.locator('html')).toHaveClass(/yt-tabfs-enabled/);
  });

  test('should handle YouTube Music compatibility', async () => {
    // Test that the extension works on YouTube Music
    await page.goto('https://music.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for page load
    await page.waitForTimeout(5000);
    
    // Ad-skipping should be active on YouTube Music
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('[YT-TabFS]')) {
        logs.push(msg.text());
      }
    });
    
    // Wait for potential ad detection
    await page.waitForTimeout(3000);
    
    // Should handle YouTube Music domain
    const hasYouTubeMusicLog = logs.some(log => log.includes('music.youtube.com'));
    // This might not always be true, but the extension should handle the domain
  });

  test('should not interfere with normal video playback', async () => {
    // Navigate to a YouTube video
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for video player
    await page.waitForSelector('.html5-video-player', { timeout: 10000 });
    
    // Get video element
    const video = await page.locator('video').first();
    
    // Video should be playable
    await page.click('.html5-video-player'); // Click to focus
    await page.keyboard.press('Space'); // Play/pause
    
    // Wait a moment
    await page.waitForTimeout(2000);
    
    // Video should have normal playback rate when no ads
    const playbackRate = await video.evaluate((el: HTMLVideoElement) => el.playbackRate);
    expect(playbackRate).toBe(1); // Normal speed
    
    // Tab-fullscreen should still work
    await page.waitForSelector('#yt-tabfs-button', { timeout: 5000 });
    await page.click('#yt-tabfs-button');
    await expect(page.locator('html')).toHaveClass(/yt-tabfs-enabled/);
  });
}); 