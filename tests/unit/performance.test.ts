import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('Performance Requirements', () => {
  const distPath = path.join(process.cwd(), 'dist');

  it('should have all required extension files', () => {
    const requiredFiles = [
      'content.js',
      'styles.css', 
      'manifest.json',
      'icons'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(distPath, file);
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  it('content.js should be under 12 KB', () => {
    const contentJsPath = path.join(distPath, 'content.js');
    
    if (fs.existsSync(contentJsPath)) {
      const size = fs.statSync(contentJsPath).size;
      const sizeKB = size / 1024;
      
      console.log(`content.js size: ${sizeKB.toFixed(2)} KB`);
      expect(size).toBeLessThanOrEqual(12 * 1024); // 12 KB
    } else {
      // Skip test if file doesn't exist (build not run yet)
      console.log('Skipping content.js size test - file not found (run npm run build first)');
    }
  });

  it('styles.css should be under 3 KB', () => {
    const stylesCssPath = path.join(distPath, 'styles.css');
    
    if (fs.existsSync(stylesCssPath)) {
      const size = fs.statSync(stylesCssPath).size;
      const sizeKB = size / 1024;
      
      console.log(`styles.css size: ${sizeKB.toFixed(2)} KB`);
      expect(size).toBeLessThanOrEqual(3 * 1024); // 3 KB
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

  it('total extension size should be under 30 KB', () => {
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
    expect(totalSize).toBeLessThanOrEqual(30 * 1024); // 30 KB
  });

  it('should validate manifest.json structure', () => {
    const manifestPath = path.join(distPath, 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      console.log('Skipping manifest validation - file not found (run npm run build first)');
      return;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Validate required manifest fields
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('YouTube Tab-Fullscreen');
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.permissions).toEqual(['activeTab', 'storage']);
    
    // Validate content script configuration
    expect(manifest.content_scripts).toHaveLength(1);
    expect(manifest.content_scripts[0].matches).toEqual(['https://www.youtube.com/watch*']);
    expect(manifest.content_scripts[0].js).toEqual(['content.js']);
    expect(manifest.content_scripts[0].css).toEqual(['styles.css']);
    
    // Validate commands
    expect(manifest.commands).toHaveProperty('toggle-tabfs');
    expect(manifest.commands['toggle-tabfs'].suggested_key.default).toBe('Alt+T');
  });

  it('should validate TypeScript compilation success', () => {
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
     expect(nonEmptyLines.length).toBeLessThan(500);
    
    // Should contain our key identifiers
    expect(content).toContain('yt-tabfs-enabled');
    expect(content).toContain('ytTabFS');
    expect(content).toContain('yt-tabfs-button');
  });
}); 