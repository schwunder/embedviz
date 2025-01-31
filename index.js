import { getEmbeddingsLoop, getEmbedding  } from "./embed.js";
import { 
  deleteAllEmbeddings,
  getAllEmbeddings,
  storeEmbedding,
  storeEmbeddingLoop,
  patchWithEmbedding, 
  patchWithEmbeddingLoop, 
  patchWithSingleProjection, 
  patchWithBatchProjection, 
  retrieveEmbedding,
  retrieveFilename,
  clearEmbeddingLoop
} from "./db.js";
import { getFilePathsAndArtistNames } from "./paths.js";
import { dimensionalityReductionLoop } from "./pca.js";
import { 
  analyzeDataRangesByArtist, 
  printDatabaseAnalysis, 
  printArtistAnalysis,
  analyzeFileNumberSequence,
  analyzeDataStatus,
  analyzeDataRanges
} from "./log.js";

const API_ENDPOINT = "https://api.edenai.run/v2/image/embeddings";
const artistNames = [
  "Amedeo Modigliani",
  "Vasiliy Kandinskiy",
  "Diego Rivera",
  "Claude Monet",
  "Rene Magritte",
  "Salvador Dali",
  "Edouard Manet",
  "Andrei Rublev",
  "Vincent van Gogh",
  "Gustav Klimt",
  "Hieronymus Bosch",
  "Kazimir Malevich",
  "Mikhail Vrubel",
  "Pablo Picasso",
  "Peter Paul Rubens",
  "Pierre-Auguste Renoir",
  "Francisco Goya",
  "Frida Kahlo",
  "El Greco",
  "Albrecht Dürer",
  "Alfred Sisley",
  "Pieter Bruegel",
  "Marc Chagall",
  "Giotto di Bondone",
  "Sandro Botticelli",
  "Caravaggio",
  "Leonardo da Vinci",
  "Diego Velazquez",
  "Henri Matisse",
  "Jan van Eyck",
  "Edgar Degas",
  "Rembrandt",
  "Titian",
  "Henri de Toulouse-Lautrec",
  "Gustave Courbet",
  "Camille Pissarro",
  "William Turner",
  "Edvard Munch",
  "Paul Cezanne",
  "Eugene Delacroix",
  "Henri Rousseau",
  "Georges Seurat",
  "Paul Klee",
  "Piet Mondrian",
  "Joan Miro",
  "Andy Warhol",
  "Paul Gauguin",
  "Raphael",
  "Michelangelo",
  "Jackson Pollock",
];

async function main() {
  const apiKey = process.env.EDEN_API_KEY;

  // Get all available file paths
  const artistNamesWithFilePaths = getFilePathsAndArtistNames(["Amedeo Modigliani"]);
  console.log('Total paths from folders:', artistNamesWithFilePaths.length);
  
  // Create a map of filename to full path for quick lookup
  const filePathMap = artistNamesWithFilePaths.reduce((acc, { artistName, filePath }) => {
    const fileName = filePath.split('/').pop();
    acc[fileName] = filePath;
    return acc;
  }, {});
  
  // Get database entries and find which ones need embeddings
  const databaseIds = await getAllEmbeddings();
  console.log('Total database entries:', databaseIds.length);

  // Show database analysis
  const dbFileNames = databaseIds.map(({ filename }) => filename);
  const sequenceAnalysis = analyzeFileNumberSequence(dbFileNames);
  const dataStatus = analyzeDataStatus(databaseIds);
  const dataRanges = analyzeDataRanges(databaseIds);
  
  // Print analysis results
  printDatabaseAnalysis(databaseIds, sequenceAnalysis, dataStatus, dataRanges);
  const artistAnalysis = analyzeDataRangesByArtist(databaseIds);
  printArtistAnalysis(artistAnalysis);

  // Find entries that need embeddings and have corresponding files
  const entriesToProcess = databaseIds
    .filter(entry => entry.embedding === null && filePathMap[entry.filename])
    .map(entry => ({
      ...entry,
      filePath: filePathMap[entry.filename]
    }));

  console.log(`\nFound ${entriesToProcess.length} entries needing embeddings`);

  // Process embeddings one by one
  if (entriesToProcess.length > 0) {
    console.log('\nProcessing embeddings...');
    let processedCount = 0;
    let errorOccurred = false;

    for (const entry of entriesToProcess) {
      try {
        console.log(`Processing ${entry.filename}...`);
        
        // Get the embedding using the matched file path
        const embedding = await getEmbedding(entry.filePath, apiKey, API_ENDPOINT);
        
        // Show sample of the embedding (first 2 values)
        const embeddingSample = Array.from(embedding.slice(0, 2)).map(v => v.toFixed(4));
        console.log(`Generated embedding sample: [${embeddingSample.join(', ')}...]`);
        
        // Update the entry with the embedding
        await patchWithEmbedding(entry.id, embedding);
        
        processedCount++;
        console.log(`✓ Successfully processed ${entry.filename} (${processedCount}/${entriesToProcess.length})`);
        
      } catch (error) {
        console.error(`✗ Error processing ${entry.filename}:`, error.message);
        errorOccurred = true;
        break;
      }
    }

    // Final status for embeddings
    if (errorOccurred) {
      console.log('\nEmbedding processing stopped due to an error.');
      console.log(`Successfully processed ${processedCount} files before the error.`);
    } else {
      console.log('\nAll embeddings processed successfully!');
    }
  }

  // Find entries that need projections
  const entriesToProject = databaseIds.filter(entry => {
    return entry.embedding !== null && 
           (entry.projection_single_x === null || entry.projection_single_y === null);
  });

  console.log(`\nFound ${entriesToProject.length} entries needing single projections`);

  // Process projections one by one
  if (entriesToProject.length > 0) {
    console.log('\nProcessing single projections...');
    let processedCount = 0;
    let errorOccurred = false;

    try {
      // Prepare data for dimensionalityReductionLoop
      const embeddingsWithIds = entriesToProject.map(entry => {
        return {
          id: entry.id,
          embedding: entry.embedding
        };
      });

      // Process all projections
      const projections = await dimensionalityReductionLoop(embeddingsWithIds);

      // Update database with projections
      for (const { id, projection } of projections) {
        const entry = entriesToProject.find(e => e.id === id);
        console.log(`✓ Processing ${entry.filename} (${processedCount + 1}/${entriesToProject.length})`);
        console.log(`  Projection: [${projection[0]}, ${projection[1]}]`);
        
        // Update the entry with the projection
        await patchWithSingleProjection(id, projection);
        
        processedCount++;
      }

      console.log('\nAll projections processed successfully!');
    } catch (error) {
      console.error(`✗ Error during projection:`, error.message);
      console.log('\nProjection processing stopped due to an error.');
      console.log(`Successfully processed ${processedCount} projections before the error.`);
    }

    // Log projections from database
    console.log('\nProjections in database:');
    const allEntries = await getAllEmbeddings();
    for (const entry of allEntries) {
      console.log(`\n${entry.filename}:`);
      console.log(`Single projection: x=${entry.projection_single_x}, y=${entry.projection_single_y}`);
    }
  }

  // Show final database status
  console.log('\nFinal database status:');
  const updatedDatabaseIds = await getAllEmbeddings();
  const updatedDataStatus = analyzeDataStatus(updatedDatabaseIds);
  
  console.log(`- Total entries: ${updatedDatabaseIds.length}`);
  console.log(`- Entries with embeddings: ${updatedDataStatus.withEmbeddings}`);
  console.log(`- Entries without embeddings: ${updatedDataStatus.withoutEmbeddings}`);
  console.log(`- Entries with single projections: ${updatedDataStatus.withSingleProjections}`);
  console.log(`- Entries without single projections: ${updatedDataStatus.withoutSingleProjections}`);
  
  if (updatedDataStatus.withoutEmbeddings > 0) {
    console.log('\nNext file needing embedding:');
    console.log(`- ${updatedDataStatus.firstWithoutEmbedding.filename}`);
  }
  if (updatedDataStatus.withoutSingleProjections > 0) {
    console.log('\nNext file needing single projection:');
    console.log(`- ${updatedDataStatus.firstWithoutSingleProjection.filename}`);
  }
}

main();
