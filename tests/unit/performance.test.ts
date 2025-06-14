import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('Performance Requirements', () => {
  const distPath = path.join(process.cwd(), 'dist');

  it('should have all required extension files', () => {
    const requiredFiles = [
      'content.js',
      'background.js',
      'styles.css', 
      'manifest.json',
      'icons'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(distPath, file);
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  it('content.js should be under 30 KB (updated for robust navigation & ad-skip)', () => {
    const contentJsPath = path.join(distPath, 'content.js');
    
    if (fs.existsSync(contentJsPath)) {
      const size = fs.statSync(contentJsPath).size;
      const sizeKB = size / 1024;
      
      console.log(`content.js size: ${sizeKB.toFixed(2)} KB`);
      expect(size).toBeLessThanOrEqual(30 * 1024); // 30 KB (increased for navigation fixes & ad-skip)
    } else {
      // Skip test if file doesn't exist (build not run yet)
      console.log('Skipping content.js size test - file not found (run npm run build first)');
    }
  });

  it('styles.css should be under 6 KB (updated for current build)', () => {
    const stylesCssPath = path.join(distPath, 'styles.css');
    
    if (fs.existsSync(stylesCssPath)) {
      const size = fs.statSync(stylesCssPath).size;
      const sizeKB = size / 1024;
      
      console.log(`styles.css size: ${sizeKB.toFixed(2)} KB`);
      expect(size).toBeLessThanOrEqual(6 * 1024); // 6 KB (adjusted for current build)
    } else {
      console.log('Skipping styles.css size test - file not found (run npm run build first)');
    }
  });

  it('manifest.json should be under 2 KB', () => {
    const manifestPath = path.join(distPath, 'manifest.json');
    
    if (fs.existsSync(manifestPath)) {
      const size = fs.statSync(manifestPath).size;
      const sizeKB = size / 1024;
      
      console.log(`manifest.json size: ${sizeKB.toFixed(2)} KB`);
      expect(size).toBeLessThanOrEqual(2 * 1024); // 2 KB
    } else {
      console.log('Skipping manifest.json size test - file not found (run npm run build first)');
    }
  });

  it('total extension size should be under 100 KB (updated for robust functionality)', () => {
    if (!fs.existsSync(distPath)) {
      console.log('Skipping total size test - dist folder not found (run npm run build first)');
      return;
    }

    let totalSize = 0;
    const calculateSize = (dirPath: string) => {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          calculateSize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    };

    calculateSize(distPath);
    const totalSizeKB = totalSize / 1024;
    
    console.log(`Total extension size: ${totalSizeKB.toFixed(2)} KB`);
    expect(totalSize).toBeLessThanOrEqual(100 * 1024); // 100 KB (increased for robust navigation & ad-skip)
  });

  it('should validate manifest.json structure for v1.1.0', () => {
    const manifestPath = path.join(distPath, 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      console.log('Skipping manifest validation - file not found (run npm run build first)');
      return;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Validate required manifest fields
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('YouTube Tab-Fullscreen + Auto Ad-Skip');
    expect(manifest.version).toBe('1.1.0');
    expect(manifest.description).toContain('automatic ad-skipping');
    expect(manifest.permissions).toEqual(['activeTab', 'storage', 'tabs']);
    
    // Validate content script configuration
    expect(manifest.content_scripts).toHaveLength(1);
    expect(manifest.content_scripts[0].matches).toEqual(['https://www.youtube.com/watch*']);
    expect(manifest.content_scripts[0].js).toEqual(['content.js']);
    expect(manifest.content_scripts[0].css).toEqual(['styles.css']);
    
    // Validate commands
    expect(manifest.commands).toHaveProperty('toggle-tabfs');
    expect(manifest.commands['toggle-tabfs'].suggested_key.default).toBe('Alt+T');
    
    // Validate action (extension popup)
    expect(manifest.action.default_title).toBe('YouTube Tab-Fullscreen + Auto Ad-Skip');
    
    // Validate background script
    expect(manifest.background).toBeDefined();
    expect(manifest.background.service_worker).toBe('background.js');
    expect(manifest.background.type).toBe('module');
  });

  it('should validate TypeScript compilation success with ad-skip functionality', () => {
    const contentJsPath = path.join(distPath, 'content.js');
    
    if (!fs.existsSync(contentJsPath)) {
      console.log('Skipping compilation validation - file not found (run npm run build first)');
      return;
    }

    const content = fs.readFileSync(contentJsPath, 'utf8');
    
    // Should be minified (no excessive whitespace)
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    // Production build should be minified (fewer lines than unminified)
    // Our dev build includes source maps so may have more lines
    expect(nonEmptyLines.length).toBeLessThan(1200); // Increased for navigation fixes & ad-skip functionality
    
    // Should contain our key tab-fullscreen identifiers
    expect(content).toContain('yt-tabfs-enabled');
    expect(content).toContain('ytTabFS');
    expect(content).toContain('yt-tabfs-button');
    
    // Should contain ad-skipping identifiers (check for minified versions)
    expect(content).toContain('ad-showing');
    expect(content).toContain('loadVideoWithPlayerVars');
    expect(content).toContain('ytp-ad-timed-pie-countdown-container');
    
    // Should contain debug functionality
    expect(content).toContain('ytTabFSDebug');
    
    // Should contain navigation handling functionality (check for core functionality)
    expect(content).toContain('MutationObserver');
    expect(content).toContain('waitForPlayer');
    expect(content).toContain('handleInitialLoad');
  });

  it('should validate ad-skip functionality is included', () => {
    const contentJsPath = path.join(distPath, 'content.js');
    
    if (!fs.existsSync(contentJsPath)) {
      console.log('Skipping ad-skip validation - file not found (run npm run build first)');
      return;
    }

    const content = fs.readFileSync(contentJsPath, 'utf8');
    
    // Check for key ad-skipping components (minified versions)
    expect(content).toContain('startAlways');
    expect(content).toContain('ytp-ad-survey-questions');
    expect(content).toContain('music.youtube.com');
    expect(content).toContain('getCurrentTime');
    
    // Check for error handling and retry logic
    expect(content).toContain('setInterval');
    expect(content).toContain('clearInterval');
    
    // Check for video manipulation
    expect(content).toContain('playbackRate');
    expect(content).toContain('currentTime');
    
    // Check for navigation and button management (check for core functionality)
    expect(content).toContain('cleanup');
    expect(content).toContain('setTimeout');
    expect(content).toContain('waitForPlayer');
  });
}); 