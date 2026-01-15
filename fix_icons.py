#!/usr/bin/env python3
import subprocess
import os

def create_transparent_icons():
    """Generate PNG icons with proper transparency using rsvg-convert."""
    
    sizes = [32, 48, 128]
    
    # Change to icons directory
    os.chdir('src/icons')
    
    print("Using rsvg-convert for better transparency handling...")
    
    for size in sizes:
        print(f"Generating {size}x{size} PNG...")
        
        # Use rsvg-convert which handles SVG transparency properly
        cmd = [
            'rsvg-convert',
            '-w', str(size),
            '-h', str(size),
            '-f', 'png',
            '-o', f'{size}.png',
            'icon_transparent.svg'
        ]
        
        try:
            subprocess.run(cmd, check=True)
            print(f"  ✓ Created {size}.png")
            
            # Verify transparency
            result = subprocess.run(['file', f'{size}.png'], capture_output=True, text=True)
            if 'RGBA' in result.stdout:
                print(f"    → Confirmed RGBA transparency")
        except subprocess.CalledProcessError as e:
            print(f"  ✗ Failed: {e}")
    
    # Clean up test file
    if os.path.exists('128_test.png'):
        os.remove('128_test.png')
    
    os.chdir('../..')
    
    # Copy to dist folders
    print("\nCopying to dist folders...")
    for size in sizes:
        subprocess.run(['cp', f'src/icons/{size}.png', 'dist/icons/'], check=True)
        subprocess.run(['cp', f'src/icons/{size}.png', 'dist-firefox/icons/'], check=True)
    
    print("✓ Icons updated in dist folders")

if __name__ == "__main__":
    print("Fixing PNG icons with proper transparency...\n")
    create_transparent_icons()
    print("\nDone!")