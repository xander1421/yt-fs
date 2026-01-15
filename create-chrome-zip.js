const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Try to use system zip command first
try {
  console.log('Creating Chrome Web Store ZIP...');
  execSync('cd dist && zip -r ../youtube-tabfs-chrome-store.zip * -x "*.map" "*.md"', { stdio: 'inherit' });
  console.log('✓ Created youtube-tabfs-chrome-store.zip');
} catch (error) {
  // Fallback to Node.js-based solution
  console.log('zip command not found, using Node.js alternative...');
  
  const archiver = require('archiver');
  const output = fs.createWriteStream('youtube-tabfs-chrome-store.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', () => {
    console.log(`✓ Created youtube-tabfs-chrome-store.zip (${archive.pointer()} bytes)`);
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  archive.pipe(output);
  archive.directory('dist/', false, {
    // Exclude source maps and markdown files
    filter: (entry) => !entry.name.endsWith('.map') && !entry.name.endsWith('.md')
  });
  archive.finalize();
}