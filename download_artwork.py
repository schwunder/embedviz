import kagglehub
import os
import argparse

def download_and_link(dataset_path):
    # Download the dataset
    path = kagglehub.dataset_download(dataset_path)
    print("Dataset downloaded to:", path)
    
    # Extract the username from the dataset path (e.g., "ikarus777" from "ikarus777/best-artworks-of-all-time")
    username = dataset_path.split('/')[0]
    
    # Create datasets directory if it doesn't exist
    datasets_dir = os.path.join(os.path.dirname(__file__), 'datasets')
    os.makedirs(datasets_dir, exist_ok=True)
    
    # Create symlink
    symlink_path = os.path.join(datasets_dir, username)
    
    # Remove existing symlink if it exists
    if os.path.islink(symlink_path):
        os.unlink(symlink_path)
    
    # Get the path to the user's dataset directory in the cache
    cache_user_dir = os.path.dirname(os.path.dirname(os.path.dirname(path)))
    
    # Create the new symlink
    os.symlink(cache_user_dir, symlink_path)
    print(f"Created symlink: {symlink_path} -> {cache_user_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Download a Kaggle dataset and create a symlink in datasets directory')
    parser.add_argument('dataset_path', help='Kaggle dataset path (e.g., "username/dataset-name")')
    args = parser.parse_args()
    
    download_and_link(args.dataset_path)