from PIL import Image
import os
from pathlib import Path

# Source and destination directories
source_dir = Path('/Users/alien/Projects/embedviznewtwo/datasets/ikarus777/best-artworks-of-all-time/versions/1/resized/resized')
thumbnail_dir = Path('/Users/alien/Projects/embedviznewtwo/thumbnails')

# Create thumbnails directory if it doesn't exist
thumbnail_dir.mkdir(exist_ok=True)

# Target size for thumbnails
THUMBNAIL_SIZE = (50, 50)

def create_thumbnail(image_path):
    try:
        with Image.open(image_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Create thumbnail while maintaining aspect ratio
            img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
            
            # Save to new directory with same filename
            output_path = thumbnail_dir / image_path.name
            img.save(output_path, "JPEG", quality=85)
            return True
    except Exception as e:
        print(f"Error processing {image_path.name}: {e}")
        return False

def main():
    # Get all jpg files
    jpg_files = list(source_dir.glob('*.jpg'))
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
