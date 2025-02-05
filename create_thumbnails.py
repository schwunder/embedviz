from PIL import Image
from pathlib import Path
import subprocess

# Source and destination directories
source_dir = Path('/Users/alien/Projects/embedviznewtwo/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images')
thumbnail_dir = Path('/Users/alien/Projects/embedviznewtwo/thumbnails')

# Create thumbnails directory if it doesn't exist
thumbnail_dir.mkdir(exist_ok=True)

# Target size for thumbnails
THUMBNAIL_SIZE = '75x75'

def create_thumbnail(image_path):
    try:
        # Prepare output path
        output_path = thumbnail_dir / image_path.stem
        output_path = output_path.with_suffix('.avif')
        
        # Use ImageMagick to convert and resize with high quality settings
        cmd = [
            'convert',
            str(image_path),
            '-resize', f'{THUMBNAIL_SIZE}^',  # Resize to fill the dimensions
            '-gravity', 'center',  # Center the image
            '-extent', THUMBNAIL_SIZE,  # Crop to exact size
            '-quality', '100',  # Maximum quality
            '-define', 'heic:speed=1',  # Highest quality encoding
            '-define', 'heic:compression-level=9',  # Maximum compression
            '-define', 'heic:color-profile=1',  # Preserve color profile
            '-define', 'heic:preserve-orientation=1',  # Preserve orientation
            '-sampling-factor', '4:4:4',  # No chroma subsampling
            str(output_path)
        ]
        
        # Run the conversion command
        subprocess.run(cmd, check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error processing {image_path.name}: {e.stderr}")
        return False
    except Exception as e:
        print(f"Error processing {image_path.name}: {e}")
        return False

def main():
    # Get all jpg files recursively from artist directories
    jpg_files = list(source_dir.glob('**/*.jpg'))
    total_files = len(jpg_files)
    
    print(f"Found {total_files} JPG files to process")
    
    # Process all images
    successful = 0
    for i, image_path in enumerate(jpg_files, 1):
        if create_thumbnail(image_path):
            successful += 1
        
        # Print progress every 100 files
        if i % 100 == 0:
            print(f"Processed {i}/{total_files} files...")
    
    print(f"\nComplete! Successfully created {successful} thumbnails")
    print(f"Thumbnails saved in: {thumbnail_dir}")

if __name__ == "__main__":
    main()
