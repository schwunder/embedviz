from PIL import Image
from pathlib import Path
import subprocess
import random
import argparse
import time

# Source and destination directories
source_dir = Path('/Users/alien/Projects/embedviznewtwo/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images')
thumbnail_dir = Path('/Users/alien/Projects/embedviznewtwo/thumbnails')

# Create thumbnails directory if it doesn't exist
thumbnail_dir.mkdir(exist_ok=True)

# Target size for thumbnails (maximum dimension while preserving aspect ratio)
THUMBNAIL_SIZE = '600x600'

def create_thumbnail(image_path, show_progress=True):
    # Initialize paths at the start
    output_path = thumbnail_dir / image_path.stem
    temp_png = output_path.with_suffix('.png')
    final_avif = output_path.with_suffix('.avif')
    temp_avif = temp_png.with_suffix('.png.avif')
    
    try:
        if show_progress:
            print(f"Converting: {image_path.name}")
            start_time = time.time()
        
        # Step 1: High quality resize to PNG with aspect ratio preservation
        cmd1 = [
            'convert',
            str(image_path),
            # JPEG-specific optimizations
            '-define', 'jpeg:size=600x600',        # Initial size hint
            '-define', 'jpeg:fancy-upsampling=on', # High-quality upsampling
            '-define', 'jpeg:dct-method=float',    # Precise DCT calculation
            # Image processing
            '-filter', 'Lanczos',                  # Highest quality resampling
            '-define', 'filter:window=sinc',       # Sinc filter window
            '-define', 'filter:lobes=5',           # Maximum filter precision
            '-define', 'filter:blur=0.9',          # Optimal blur for compression
            '-resize', '600x600>',                 # Resize, maintain aspect ratio
            '-gravity', 'center',                  # Center the image
            '-background', 'none',                 # Transparent background
            '-extent', '600x600',                  # Canvas size
            # Quality optimizations
            '-colorspace', 'RGB',                  # RGB colorspace
            '-depth', '8',                         # 8-bit depth
            '-auto-gamma',                         # Gamma correction
            '-auto-level',                         # Level adjustment
            '-enhance',                            # Image enhancement
            '-unsharp', '0x0.75+0.75+0.008',      # Unsharp mask
            # PNG output settings
            '-define', 'png:compression-level=9',   # Maximum compression
            '-define', 'png:compression-filter=5',  # Paeth prediction
            '-define', 'png:compression-strategy=3',# Optimal compression
            '-sampling-factor', '4:4:4',           # No chroma subsampling
            '-strip',                              # Remove metadata
            str(temp_png)                          # Output to temporary PNG
        ]
        
        # Run first conversion pass
        subprocess.run(cmd1, check=True, capture_output=True)
        
        # Step 2: AVIF compression with maximum quality settings
        cmd2 = [
            'cavif',
            '--quality', '95',             # High quality
            '--speed', '0',                # Slowest/best quality
            '--threads', '0',              # Use all CPU threads
            '--overwrite',                 # Overwrite existing files
            '--color', 'rgb',              # RGB color space for best quality
            str(temp_png)                  # Input PNG file
        ]
        
        # Run second conversion pass
        subprocess.run(cmd2, check=True, capture_output=True)
        
        # Remove temporary PNG
        temp_png.unlink()
        
        # Rename output file (cavif adds .avif to input filename)
        if temp_avif.exists():
            temp_avif.rename(final_avif)
        
        # Get file size in KB
        size_kb = final_avif.stat().st_size / 1024
        
        if show_progress:
            end_time = time.time()
            duration = end_time - start_time
            print(f"Created: {final_avif.name} ({size_kb:.1f}KB) in {duration:.1f}s")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"Error: {image_path.name} - {str(e)[:200]}...")
        # Cleanup temporary files if they exist
        if temp_png.exists():
            temp_png.unlink()
        if temp_avif.exists():
            temp_avif.unlink()
        return False
    except Exception as e:
        print(f"Error: {image_path.name} - {str(e)[:200]}...")
        # Cleanup temporary files if they exist
        if temp_png.exists():
            temp_png.unlink()
        if temp_avif.exists():
            temp_avif.unlink()
        return False

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--test-single', action='store_true', help='Process only one test image')
    parser.add_argument('--test-batch', action='store_true', help='Process 5 test images')
    args = parser.parse_args()
    
    # Get all jpg files recursively from artist directories
    jpg_files = list(source_dir.glob('**/*.jpg'))
    total_files = len(jpg_files)
    
    if args.test_single:
        # Process just one random image
        test_file = random.choice(jpg_files)
        print(f"Test mode: Processing single image")
        create_thumbnail(test_file)
        return
        
    if args.test_batch:
        # Process 5 random images
        test_files = random.sample(jpg_files, 5)
        print(f"Test mode: Processing 5 images")
        for i, image_path in enumerate(test_files, 1):
            create_thumbnail(image_path)
            print(f"Progress: {i}/5 complete")
        return
    
    # Process all images
    print(f"Found {total_files} images to process")
    successful = 0
    start_time = time.time()
    
    for i, image_path in enumerate(jpg_files, 1):
        if create_thumbnail(image_path, show_progress=True):  # Changed to True
            successful += 1
            
            # Show overall progress after each image
            elapsed = time.time() - start_time
            avg_time = elapsed / i
            remaining = (total_files - i) * avg_time
            print(f"Overall Progress: {i}/{total_files} ({successful} successful) - ETA: {remaining/60:.1f}min")
    
    elapsed = time.time() - start_time
    print(f"\nComplete! {successful}/{total_files} images processed in {elapsed/60:.1f}min")

if __name__ == "__main__":
    main()
