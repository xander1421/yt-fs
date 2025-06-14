import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionPath = path.join(__dirname, '../dist');

test.describe('Performance Tests', () => {
  test('extension files should meet size requirements for v1.1.0', async () => {
    const contentJsPath = path.join(extensionPath, 'content.js');
    const stylesCssPath = path.join(extensionPath, 'styles.css');
    const manifestPath = path.join(extensionPath, 'manifest.json');

    // Check that files exist
    expect(fs.existsSync(contentJsPath)).toBe(true);
    expect(fs.existsSync(stylesCssPath)).toBe(true);
    expect(fs.existsSync(manifestPath)).toBe(true);

    // Check file sizes (updated for ad-skipping functionality)
    const contentJsSize = fs.statSync(contentJsPath).size;
    const stylesCssSize = fs.statSync(stylesCssPath).size;
    const manifestSize = fs.statSync(manifestPath).size;

    // Updated limits: content.js ≤ 30 KB (increased for navigation & ad-skip), styles.css ≤ 6 KB, manifest ≤ 2 KB
    expect(contentJsSize).toBeLessThanOrEqual(30 * 1024); // 30 KB (increased for navigation fixes & ad-skip)
    expect(stylesCssSize).toBeLessThanOrEqual(6 * 1024);  // 6 KB (adjusted for current build)
    expect(manifestSize).toBeLessThanOrEqual(2 * 1024);   // 2 KB

    console.log(`File sizes:
      content.js: ${(contentJsSize / 1024).toFixed(2)} KB
      styles.css: ${(stylesCssSize / 1024).toFixed(2)} KB
      manifest.json: ${(manifestSize / 1024).toFixed(2)} KB
    `);
  });

  test('total extension size should be under 100 KB (updated for robust functionality)', async () => {
    // Calculate total extension size
    let totalSize = 0;
    const files = fs.readdirSync(extensionPath, { recursive: true });
    
    for (const file of files) {
      const filePath = path.join(extensionPath, file as string);
      if (fs.statSync(filePath).isFile()) {
        totalSize += fs.statSync(filePath).size;
      }
    }

    expect(totalSize).toBeLessThanOrEqual(100 * 1024); // 100 KB (increased for robust navigation & ad-skip)
    console.log(`Total extension size: ${(totalSize / 1024).toFixed(2)} KB`);
  });

  test('extension should have minimal impact on page load time', async ({ browser }) => {
    // Test page load time with and without extension
    const extensionBrowser = await browser.browserType().launch({
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-first-run',
      ],
    });

    const regularBrowser = await browser.browserType().launch();

    const extensionContext = await extensionBrowser.newContext();
    const regularContext = await regularBrowser.newContext();

    const extensionPage = await extensionContext.newPage();
    const regularPage = await regularContext.newPage();

    // Measure load time with extension
    const startTimeWithExtension = Date.now();
    await extensionPage.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await extensionPage.waitForSelector('.html5-video-player', { timeout: 15000 });
    const loadTimeWithExtension = Date.now() - startTimeWithExtension;

    // Measure load time without extension
    const startTimeWithoutExtension = Date.now();
    await regularPage.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await regularPage.waitForSelector('.html5-video-player', { timeout: 15000 });
    const loadTimeWithoutExtension = Date.now() - startTimeWithoutExtension;

    const difference = loadTimeWithExtension - loadTimeWithoutExtension;
    
    console.log(`Load times:
      With extension: ${loadTimeWithExtension}ms
      Without extension: ${loadTimeWithoutExtension}ms
      Difference: ${difference}ms
    `);

    // Extension should add less than 500ms to load time
    expect(difference).toBeLessThan(500);

    await extensionBrowser.close();
    await regularBrowser.close();
  });

  test('extension should not cause memory leaks', async ({ browser }) => {
    const extensionBrowser = await browser.browserType().launch({
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-first-run',
      ],
    });

    const context = await extensionBrowser.newContext();
    const page = await context.newPage();

    // Load YouTube and toggle extension multiple times
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.waitForSelector('#yt-tabfs-button', { timeout: 10000 });

    // Get initial memory metrics
    const initialMetrics = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
        };
      }
      return { usedJSHeapSize: 0, totalJSHeapSize: 0 };
    });

    // Toggle extension 20 times
    for (let i = 0; i < 20; i++) {
      await page.click('#yt-tabfs-button');
      await page.waitForTimeout(100);
    }

    // Get final memory metrics
    const finalMetrics = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
        };
      }
      return { usedJSHeapSize: 0, totalJSHeapSize: 0 };
    });

    // Memory usage shouldn't increase dramatically
    const memoryIncrease = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize;
    const memoryIncreaseKB = memoryIncrease / 1024;

    console.log(`Memory usage:
      Initial: ${(initialMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
      Final: ${(finalMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
      Increase: ${memoryIncreaseKB.toFixed(2)} KB
    `);

    // Should not increase memory by more than 100 KB
    expect(memoryIncreaseKB).toBeLessThan(100);

    await extensionBrowser.close();
  });

  test('extension should inject button quickly', async ({ browser }) => {
    const extensionBrowser = await browser.browserType().launch({
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-first-run',
      ],
    });

    const context = await extensionBrowser.newContext();
    const page = await context.newPage();

    // Measure time to inject button
    const startTime = Date.now();
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.waitForSelector('#yt-tabfs-button', { timeout: 10000 });
    const injectionTime = Date.now() - startTime;

    console.log(`Button injection time: ${injectionTime}ms`);

    // Button should be injected within 5 seconds of page load
    expect(injectionTime).toBeLessThan(5000);

    await extensionBrowser.close();
  });

  test('CSS styles should not conflict with YouTube styles', async ({ browser }) => {
    const extensionBrowser = await browser.browserType().launch({
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-first-run',
      ],
    });

    const context = await extensionBrowser.newContext();
    const page = await context.newPage();

    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.waitForSelector('#yt-tabfs-button', { timeout: 10000 });

    // Check that YouTube's original styles are preserved
    const playerStyles = await page.evaluate(() => {
      const player = document.querySelector('ytd-player');
      if (!player) return null;
      
      const computedStyles = window.getComputedStyle(player);
      return {
        position: computedStyles.position,
        display: computedStyles.display,
      };
    });

    expect(playerStyles).not.toBeNull();
    
    // Before enabling tab-fullscreen, player should have normal positioning
    expect(playerStyles?.position).not.toBe('fixed');

    // Enable tab-fullscreen
    await page.click('#yt-tabfs-button');

    // Check that our styles are applied correctly
    const tabFsStyles = await page.evaluate(() => {
      const player = document.querySelector('ytd-player');
      const html = document.documentElement;
      
      if (!player) return null;
      
      const computedStyles = window.getComputedStyle(player);
      return {
        position: computedStyles.position,
        zIndex: computedStyles.zIndex,
        hasTabFsClass: html.classList.contains('yt-tabfs-enabled'),
      };
    });

    expect(tabFsStyles?.position).toBe('fixed');
    expect(tabFsStyles?.zIndex).toBe('9999');
    expect(tabFsStyles?.hasTabFsClass).toBe(true);

    await extensionBrowser.close();
  });
}); 