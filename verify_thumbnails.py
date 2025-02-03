from PIL import Image
from pathlib import Path
import random

thumbnail_dir = Path('/Users/alien/Projects/embedviznewtwo/thumbnails')

# Get all thumbnail files
thumbnails = list(thumbnail_dir.glob('*.jpg'))

# Get total count
total_thumbs = len(thumbnails)

# Sample 5 random thumbnails to check dimensions
sample_size = min(5, total_thumbs)
sample_thumbs = random.sample(thumbnails, sample_size)

print(f"Total number of thumbnails: {total_thumbs}")
print("\nSample thumbnail dimensions:")
print("-" * 50)

for thumb_path in sample_thumbs:
    with Image.open(thumb_path) as img:
        width, height = img.size
        size_kb = thumb_path.stat().st_size / 1024  # Convert to KB
        print(f"File: {thumb_path.name}")
        print(f"Dimensions: {width}x{height} pixels")
        print(f"File size: {size_kb:.1f} KB")
        print("-" * 50)
