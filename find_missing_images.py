from pathlib import Path
import shutil

# Define paths
original_dir = Path('/Users/alien/Projects/embedviznewtwo/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images')
resized_dir = Path('/Users/alien/Projects/embedviznewtwo/datasets/ikarus777/best-artworks-of-all-time/versions/1/resized/resized')

def get_image_names(directory):
    """Get set of image names from a directory and its immediate subdirectories."""
    image_names = set()
    # Go through each subdirectory
    for subdir in directory.iterdir():
        if subdir.is_dir():
            # Add all jpg files from this subdirectory
            image_names.update(f"{subdir.name}/{img.name}" for img in subdir.glob("*.jpg"))
    return image_names

# Get sets of image names
original_images = get_image_names(original_dir)
resized_images = get_image_names(resized_dir)

# Find missing images
missing_images = original_images - resized_images

print(f"Found {len(missing_images)} images that need to be copied")

# Copy missing images
for image_path in missing_images:
    source = original_dir / image_path
    dest = resized_dir / image_path
    
    # Create parent directory if it doesn't exist
    dest.parent.mkdir(parents=True, exist_ok=True)
    
    # Copy the file
    print(f"Copying {image_path}")
    shutil.copy2(source, dest)

print("\nComplete! All missing images have been copied.")
