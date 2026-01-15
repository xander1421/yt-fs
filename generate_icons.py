#!/usr/bin/env python3
import subprocess
import os

def generate_icons():
    """Generate PNG icons from SVG with proper transparency."""
    
    sizes = [32, 48, 128]
    
    # Change to icons directory
    os.chdir('src/icons')
    
    for size in sizes:
        print(f"Generating {size}x{size} PNG...")
        
        # Use convert with proper transparency settings
        # -background none: transparent background
        # -density: higher density for better quality when scaling down
        cmd = [
            'convert',
            '-background', 'none',
            '-density', '300',
            'icon.svg',
            '-resize', f'{size}x{size}',
            '-quality', '100',
            f'{size}.png'
        ]
        
        try:
            subprocess.run(cmd, check=True)
            print(f"  ✓ Created {size}.png with transparency")
        except subprocess.CalledProcessError as e:
            print(f"  ✗ Failed to create {size}.png: {e}")
    
    # Verify the results
    print("\nVerifying PNG files:")
    for size in sizes:
        result = subprocess.run(['file', f'{size}.png'], capture_output=True, text=True)
        print(f"  {size}.png: {result.stdout.strip().split(': ')[1]}")
    
    os.chdir('../..')

if __name__ == "__main__":
    print("Generating transparent PNG icons from SVG...")
    generate_icons()
    print("\nDone! Icons generated with proper transparency and rounded corners.")