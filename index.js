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
import { getFilePathsAndArtistNames, getResizedImagePath } from "./paths.js";
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

const problematicImages = [
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Claude_Monet/Claude_Monet_20.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Gustav_Klimt/Gustav_Klimt_60.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Pierre-Auguste_Renoir/Pierre-Auguste_Renoir_89.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Pierre-Auguste_Renoir/Pierre-Auguste_Renoir_304.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Francisco_Goya/Francisco_Goya_82.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Francisco_Goya/Francisco_Goya_62.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Francisco_Goya/Francisco_Goya_142.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_325.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_321.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_288.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_303.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_136.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_256.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_108.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_109.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_190.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_89.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_187.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_211.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_55.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_44.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_149.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_148.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_35.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_270.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_261.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_18.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Alfred_Sisley/Alfred_Sisley_173.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Alfred_Sisley/Alfred_Sisley_118.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Alfred_Sisley/Alfred_Sisley_91.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Alfred_Sisley/Alfred_Sisley_7.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Alfred_Sisley/Alfred_Sisley_231.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Alfred_Sisley/Alfred_Sisley_220.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Alfred_Sisley/Alfred_Sisley_155.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Alfred_Sisley/Alfred_Sisley_140.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Caravaggio/Caravaggio_36.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Caravaggio/Caravaggio_45.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Caravaggio/Caravaggio_44.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Caravaggio/Caravaggio_5.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Caravaggio/Caravaggio_40.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Caravaggio/Caravaggio_43.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Caravaggio/Caravaggio_42.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Caravaggio/Caravaggio_9.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Caravaggio/Caravaggio_12.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Caravaggio/Caravaggio_29.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Caravaggio/Caravaggio_28.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Leonardo_da_Vinci/Leonardo_da_Vinci_132.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_643.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_87.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_655.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_641.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_325.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_650.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_644.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_652.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_337.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_18.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_635.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_626.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_632.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_619.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_194.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_630.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_629.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_600.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_602.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_603.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_216.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_14.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_604.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_598.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_611.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_662.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_663.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_660.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_664.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_665.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_659.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Edgar_Degas/Edgar_Degas_672.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Rembrandt/Rembrandt_218.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Rembrandt/Rembrandt_185.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Rembrandt/Rembrandt_28.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Rembrandt/Rembrandt_165.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Rembrandt/Rembrandt_3.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Rembrandt/Rembrandt_229.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Rembrandt/Rembrandt_91.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Rembrandt/Rembrandt_83.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Rembrandt/Rembrandt_95.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Rembrandt/Rembrandt_261.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Titian/Titian_46.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/William_Turner/William_Turner_2.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/William_Turner/William_Turner_49.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/William_Turner/William_Turner_54.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/William_Turner/William_Turner_32.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Eugene_Delacroix/Eugene_Delacroix_12.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Paul_Gauguin/Paul_Gauguin_67.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Paul_Gauguin/Paul_Gauguin_116.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Paul_Gauguin/Paul_Gauguin_191.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Paul_Gauguin/Paul_Gauguin_93.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Paul_Gauguin/Paul_Gauguin_78.jpg',
  '/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Paul_Gauguin/Paul_Gauguin_81.jpg'
];

async function prepareDatabase(artistNames) {
  // Get all available file paths
  const artistNamesWithFilePaths = getFilePathsAndArtistNames(artistNames);
  
  // Create a map of filenames to resized paths for problematic images
  const problematicImageMap = problematicImages.reduce((acc, filePath) => {
    const filename = filePath.split('/').pop();
    acc[filename] = getResizedImagePath(filePath);
    return acc;
  }, {});

  // Map file paths, using resized versions for problematic images
  const filePathMap = artistNamesWithFilePaths.reduce((acc, { filePath, artistName }) => {
    const filename = filePath.split('/').pop();
    // If this is a problematic image, use its pre-mapped resized path
    acc[filename] = {
      path: problematicImageMap[filename] || filePath,
      artistName
    };
    return acc;
  }, {});

  // Get database entries and find which ones need embeddings
  let existingEntries = await getAllEmbeddings();
  
  // Add all files to database
  for (const [filename, { path, artistName }] of Object.entries(filePathMap)) {
    await storeEmbedding({
      artist: artistName,
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

  return { filePathMap, existingEntries, status };
}

async function processEmbeddings(existingEntries, filePathMap, apiKey, status) {
  // Process embeddings
  if (status.withoutEmbeddings > 0) {
    console.log('\nProcessing embeddings...');
    let processedCount = 0;
    let count = 0;
    const skippedImages = [];
    const errorImages = [];

    for (const entry of existingEntries.filter(e => !e.embedding)) {
      if (count >= 6000) {
        console.log('\nStopping after 6000 files as requested');
        break;
      }
      count++;
      
      try {
        const filePath = filePathMap[entry.filename].path;
        
  
        
        // Only print status for first iteration, every 50th iteration after first, or last iteration
        const isFirstIteration = processedCount === 0;
        const isLastIteration = processedCount === status.withoutEmbeddings - 1;
        const isFiftiethIteration = processedCount > 0 && processedCount % 50 === 0;
        
        if (isFirstIteration || isLastIteration || isFiftiethIteration) {
          console.log(`Processing ${entry.filename}...`);
          
          try {
            // Get the embedding using the matched file path
            const embedding = await getEmbedding(filePath, apiKey, API_URL);
            
            // Show sample of the embedding
            const embeddingSample = Array.from(embedding.slice(0, 2)).map(v => v.toFixed(4));
            console.log(`Generated embedding sample: [${embeddingSample}...]`);
            
            await patchWithEmbedding(entry.filename, embedding);
            console.log(`✓ Successfully processed ${entry.filename} (${processedCount + 1}/${status.withoutEmbeddings})`);
          } catch (error) {
            if (error.message.includes('Image exceeds max pixels allowed')) {
              console.log(`Skipping ${entry.filename} - API reported image too large`);
              skippedImages.push({ filename: entry.filename, reason: 'API size limit' });
              continue;
            }
            errorImages.push({ filename: entry.filename, error: error.message });
            continue;
          }
        } else {
          try {
            // Silently process without logging
            const embedding = await getEmbedding(filePath, apiKey, API_URL);
            await patchWithEmbedding(entry.filename, embedding);
          } catch (error) {
            if (error.message.includes('Image exceeds max pixels allowed')) {
              skippedImages.push({ filename: entry.filename, reason: 'API size limit' });
              continue;
            }
            errorImages.push({ filename: entry.filename, error: error.message });
            continue;
          }
        }
        
        processedCount++;
      } catch (error) {
        errorImages.push({ filename: entry.filename, error: error.message });
        continue;
      }
    }

    console.log('\nAll embeddings processed successfully!');
    
    if (skippedImages.length > 0) {
      console.log('\nSkipped Images Summary:');
      console.log('Total skipped:', skippedImages.length);
      console.log('Skipped images list:');
      skippedImages.forEach(({ filename, pixels }) => {
        console.log(`- ${filename} (${pixels.toLocaleString()} pixels)`);
      });
    }

    if (errorImages.length > 0) {
      console.log('\nError Images Summary:');
      console.log('Total errors:', errorImages.length);
      console.log('Error images list:');
      errorImages.forEach(({ filename, error }) => {
        console.log(`- ${filename}: ${error}`);
      });
    }
  }

  // Get updated entries after processing embeddings
  existingEntries = await getAllEmbeddings();
  status = analyzeDataStatus(existingEntries);
  return { existingEntries, status };
}

async function processProjections(existingEntries, status) {
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
}

async function main() {
  const apiKey = process.env.EDEN_API_KEY;

  //=============================================================================
  // SECTION 1: PREPARATION - Path Retrieval and Database Compare
  //=============================================================================
  const { filePathMap, existingEntries, status } = await prepareDatabase(artistNames);

  //=============================================================================
  // SECTION 2: EMBEDDING LOOP - Process and Store Embeddings
  //=============================================================================
  const { existingEntries: updatedEntries, status: updatedStatus } = 
    await processEmbeddings(existingEntries, filePathMap, apiKey, status);

  //=============================================================================
  // SECTION 3: PROJECTION LOOP - Generate and Store Projections
  //=============================================================================
  await processProjections(updatedEntries, updatedStatus);

  // Show final database status
  const finalEntries = await getAllEmbeddings();
  const finalStatus = analyzeDataStatus(finalEntries);
  printDatabaseStatus(finalStatus);
}

main();
