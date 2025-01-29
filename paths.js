import fs from 'fs';
import path from 'path';

const getFilePaths = (folderName, numFiles) => {
    const absoluteFolderPath = path.resolve(folderName);

    try {
        const files = fs.readdirSync(absoluteFolderPath);
        const absolutePaths = files.map(file => path.resolve(absoluteFolderPath, file));
        return absolutePaths.slice(0, numFiles);
    } catch (error) {
        throw error;
    }
};

export const getFilePathsFromMultipleFolders = (folderNames, numFiles) =>
    folderNames.map(folderName => getFilePaths(folderName, numFiles)).flat();

export const getFilesFromFolders = (numFolders, numFiles, parentFolder) => {
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

export const getFilesByArtist = (artistNames, numFiles) => {
    const parentFolder = 'datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images';

    return artistNames.map(artistName => {
        const artistFolder = `${parentFolder}/${artistName}`;
        // Get file paths for the current artist and concatenate them to the result
        return getFilePathsFromMultipleFolders([artistFolder], numFiles);
    }).flat();
};
