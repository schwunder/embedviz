import { getEmbeddingsLoop, getEmbedding  } from "./embed.js";
import { 
  deleteAllEmbeddings,
  getAllEmbeddings,
  storeEmbedding,
  patchWithEmbedding,
  patchWithSingleProjection,
  clearSingleProjections,
  clearBatchProjections
} from "./db.js";
import { getFilePathsAndArtistNames } from "./paths.js";
import { dimensionalityReduction } from "./pca.js";
import { 
  analyzeDataStatus,
  printDatabaseStatus
} from "./log.js";

// Constants
const API_URL = "https://api.edenai.run/v2/image/embeddings";
const artistNames = [
  "Amedeo Modigliani", "Vasiliy Kandinskiy", "Diego Rivera", "Claude Monet",
  "Rene Magritte", "Salvador Dali", "Edouard Manet", "Andrei Rublev",
  "Vincent van Gogh", "Gustav Klimt", "Hieronymus Bosch", "Kazimir Malevich",
  "Mikhail Vrubel", "Pablo Picasso", "Peter Paul Rubens", "Pierre-Auguste Renoir",
  "Francisco Goya", "Frida Kahlo", "El Greco", "Albrecht Dürer",
  "Alfred Sisley", "Pieter Bruegel", "Marc Chagall", "Giotto di Bondone",
  "Sandro Botticelli", "Caravaggio", "Leonardo da Vinci", "Diego Velazquez",
  "Henri Matisse", "Jan van Eyck", "Edgar Degas", "Rembrandt",
  "Titian", "Henri de Toulouse-Lautrec", "Gustave Courbet", "Camille Pissarro",
  "William Turner", "Edvard Munch", "Paul Cezanne", "Eugene Delacroix",
  "Henri Rousseau", "Georges Seurat", "Paul Klee", "Piet Mondrian",
  "Joan Miro", "Andy Warhol", "Paul Gauguin", "Raphael",
  "Michelangelo", "Jackson Pollock"
];


async function main() {
  const apiKey = process.env.EDEN_API_KEY;


  //=============================================================================
  // SECTION 1: PREPARATION - Path Retrieval and Database Compare
  //=============================================================================

  // Get all available file paths
  const artistNamesWithFilePaths = getFilePathsAndArtistNames(artistNames);
  console.log(`\nTotal paths from folders: ${artistNamesWithFilePaths.length}`);

  // Create a map of filename to file path
  const filePathMap = artistNamesWithFilePaths.reduce((acc, { filePath }) => {
    const filename = filePath.split('/').slice(-1)[0];
    acc[filename] = filePath;
    return acc;
  }, {});



  // Get database entries and find which ones need embeddings
  let existingEntries = await getAllEmbeddings();
  
  // Add all files to database
  for (const [filename, filePath] of Object.entries(filePathMap)) {
    await storeEmbedding({
      artist: filename.split('_')[0].replace(/_/g, ' '),
      filename,
      embedding: null,
      projection_single_x: null,
      projection_single_y: null,
      projection_batch_x: null,
      projection_batch_y: null
    });
  }

  // Get updated entries after adding new ones
  existingEntries = await getAllEmbeddings();
  let status = analyzeDataStatus(existingEntries);
  printDatabaseStatus(status);

  //=============================================================================
  // SECTION 2: EMBEDDING LOOP - Process and Store Embeddings
  //=============================================================================

  // Process embeddings
  if (status.withoutEmbeddings > 0) {
    console.log('\nProcessing embeddings...');
    let processedCount = 0;
    let count = 0;

    for (const entry of existingEntries.filter(e => !e.embedding)) {
      if (count >= 2) {
        console.log('\nStopping after 2 files as requested');
        break;
      }
      count++;
      
      try {
        // Only print status for first iteration, every 50th iteration after first, or last iteration
        const isFirstIteration = processedCount === 0;
        const isLastIteration = processedCount === status.withoutEmbeddings - 1;
        const isFiftiethIteration = processedCount > 0 && processedCount % 50 === 0;
        
        if (isFirstIteration || isLastIteration || isFiftiethIteration) {
          console.log(`Processing ${entry.filename}...`);
          
          // Get the embedding using the matched file path
          const filePath = filePathMap[entry.filename];
          const embedding = await getEmbedding(filePath, apiKey, API_URL);
          
          // Show sample of the embedding
          const embeddingSample = Array.from(embedding.slice(0, 2)).map(v => v.toFixed(4));
          console.log(`Generated embedding sample: [${embeddingSample}...]`);
          
          await patchWithEmbedding(entry.filename, embedding);
          console.log(`✓ Successfully processed ${entry.filename} (${processedCount + 1}/${status.withoutEmbeddings})`);
        } else {
          // Silently process without logging
          const filePath = filePathMap[entry.filename];
          const embedding = await getEmbedding(filePath, apiKey, API_URL);
          await patchWithEmbedding(entry.filename, embedding);
        }
        
        processedCount++;
      } catch (error) {
        console.error(`✗ Error processing ${entry.filename}:`, error.message);
        console.log('\nEmbedding processing stopped due to an error.');
        console.log(`Successfully processed ${processedCount} files before the error.`);
        break;
      }
    }

    console.log('\nAll embeddings processed successfully!');
  }

  // Get updated entries after processing embeddings
  existingEntries = await getAllEmbeddings();
  status = analyzeDataStatus(existingEntries);

  //=============================================================================
  // SECTION 3: PROJECTION LOOP - Generate and Store Projections
  //=============================================================================

  // Process projections
  if (status.withEmbeddings > 0) {
    console.log('\nProcessing single projections...');
    let processedCount = 0;

    try {
      // Get all entries that have embeddings but no projections
      const entriesToProject = existingEntries.filter(
        entry => entry.embedding !== null && 
                (entry.projection_single_x === null || entry.projection_single_y === null)
      );

      const totalToProcess = entriesToProject.length;

      for (const entry of entriesToProject) {
        // Only print status for first iteration, every 50th iteration after first, or last iteration if after 50th
        const isFirstIteration = processedCount === 0;
        const isLastIteration = processedCount === totalToProcess - 1 && processedCount >= 50;
        const isFiftiethIteration = processedCount > 0 && processedCount % 50 === 0;
        
        if (isFirstIteration || isLastIteration || isFiftiethIteration) {
          console.log(`✓ Processing ${entry.filename} (${processedCount + 1}/${totalToProcess})`);
          
          // Get projection for this single embedding
          const points = dimensionalityReduction([{
            id: entry.id,
            embedding: entry.embedding
          }]);

          // The points array contains the projected coordinates
          const [x, y] = points[0];
          console.log(`  Projection: [${x}, ${y}]`);
          
          // Update the entry with the projection
          await patchWithSingleProjection(entry.filename, { x, y });
        } else {
          // Silently process without logging
          const points = dimensionalityReduction([{
            id: entry.id,
            embedding: entry.embedding
          }]);
          const [x, y] = points[0];
          await patchWithSingleProjection(entry.filename, { x, y });
        }
        
        processedCount++;
      }

      console.log('\nAll projections processed successfully!');
    } catch (error) {
      console.error(`✗ Error during projection:`, error.message);
      console.log('\nProjection processing stopped due to an error.');
    }
  }

  // Show final database status
  existingEntries = await getAllEmbeddings();
  status = analyzeDataStatus(existingEntries);
  printDatabaseStatus(status);
}

main();
