#!/usr/bin/env python3
import os
import zipfile
from pathlib import Path

def create_chrome_zip():
    """Create a ZIP file for Chrome Web Store submission."""
    
    dist_dir = Path('dist')
    zip_name = 'youtube-tabfs-chrome-store.zip'
    
    # Files to exclude
    exclude_patterns = ['.map', '.md']
    
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(dist_dir):
            for file in files:
                file_path = Path(root) / file
                
                # Check if file should be excluded
                should_exclude = any(file.endswith(pattern) for pattern in exclude_patterns)
                
                if not should_exclude:
                    # Get the relative path from dist directory
                    arcname = file_path.relative_to(dist_dir)
                    zipf.write(file_path, arcname)
                    print(f"  Added: {arcname}")
    
    # Get file size
    file_size = os.path.getsize(zip_name)
    print(f"\n✓ Created {zip_name} ({file_size:,} bytes)")
    print(f"  Ready for Chrome Web Store submission!")

if __name__ == "__main__":
    print("Creating Chrome Web Store ZIP...")
    create_chrome_zip()