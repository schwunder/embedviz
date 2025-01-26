import fs from 'fs';
import path from 'path';

function getFilePaths(numFiles) {
    return function(folderName) {
        const absoluteFolderPath = path.resolve(folderName);

        try {
            const files = fs.readdirSync(absoluteFolderPath);
            const absolutePaths = files.map(file => path.resolve(absoluteFolderPath, file));
            return absolutePaths.slice(0, numFiles);
        } catch (error) {
            console.error('Error reading directory:', error);
            return [];
        }
    };
}

export function getFilePathsFromMultipleFolders(folderNames, numFiles) {
    const allPaths = [];
    const getPaths = getFilePaths(numFiles);
    folderNames.forEach(folderName => {
        const paths = getPaths(folderName);
        allPaths.push(...paths);
    });
    return allPaths;
}

export function getFilesFromFolders(numFolders, numFiles, parentFolder) {
    try {
        const folders = fs.readdirSync(parentFolder).filter(file => fs.statSync(path.join(parentFolder, file)).isDirectory());
        const selectedFolders = folders.slice(0, numFolders);
        const folderNames = selectedFolders.map(folder => path.join(parentFolder, folder));

        // Use getFilePathsFromMultipleFolders to retrieve paths
        return getFilePathsFromMultipleFolders(folderNames, numFiles);
    } catch (error) {
        console.error('Error reading folders:', error);
        return [];
    }
}

export function getFilesByArtist(artistName, numFiles) {
    const parentFolder = 'datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images';
    const artistFolder = `${parentFolder}/${artistName}`;

    // Directly use the artist folder since there is only one
    return getFilePathsFromMultipleFolders([artistFolder], numFiles);
}
