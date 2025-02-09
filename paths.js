import fs from 'fs';
import path from 'path';

const getFilePaths = (folderName, numFiles = Infinity) => {
    const absoluteFolderPath = path.resolve(folderName);

    try {
        const files = fs.readdirSync(absoluteFolderPath);
        const absolutePaths = files.map(file => path.resolve(absoluteFolderPath, file));
        return numFiles ? absolutePaths.slice(0, numFiles) : absolutePaths;
    } catch (error) {
        throw error;
    }
};

const getFilePathsFromMultipleFolders = (folderNames, numFiles = Infinity) =>
    folderNames.map(folderName => getFilePaths(folderName, numFiles)).flat();

const getFilesFromFolders = (numFolders, numFiles = Infinity, parentFolder) => {
    try {
        const folders = fs.readdirSync(parentFolder).filter(file => fs.statSync(path.join(parentFolder, file)).isDirectory());
        const selectedFolders = folders.slice(0, numFolders);
        const folderNames = selectedFolders.map(folder => path.join(parentFolder, folder));

        // Use getFilePathsFromMultipleFolders to retrieve paths
        return getFilePathsFromMultipleFolders(folderNames, numFiles);
    } catch (error) {
        throw error;
    }
};


const mapArtistToFolderName = (artistName) => {
  // Special case for Albrecht Dürer - use exact folder name from filesystem
  if (artistName.toLowerCase().includes('dürer')) {
    return 'Albrecht_Du╠êrer';
  }
  
  // Replace spaces with underscores, keep hyphens
  return artistName.replace(/ /g, '_');
}
  

const getFilePathsAndArtistNames = (artistNames, numFiles = Infinity) => {
    const parentFolder = 'datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images';
    
    return artistNames.flatMap(artistName => {
        const artistFolderName = mapArtistToFolderName(artistName);
        return getFilePathsFromMultipleFolders([`${parentFolder}/${artistFolderName}`], numFiles)
            .map(filePath => ({ artistName, filePath }));
    });
};

const getResizedImagePath = (originalPath) => {
  // Extract just the filename from the original path
  const filename = originalPath.split('/').pop();
  
  // Replace the path structure to point to the resized directory
  return originalPath.replace(/\/images\/images\/.*?\//, '/resized/resized/');
}

export {
    getFilePaths,
    getFilesFromFolders,
    getFilePathsFromMultipleFolders,
    getFilePathsAndArtistNames,
    mapArtistToFolderName,
    getResizedImagePath
};
