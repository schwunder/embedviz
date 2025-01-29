import { getEmbeddingBatch } from "./embed.js";
import { 
  deleteAllEmbeddings,
  getAllEmbeddings,
  storeEmbeddingBatch,
  patchEmbeddingBatch
    } from "./db.js";
import { getFilesFromFolders } from "./paths.js";
import { dimensionalityReductionBatch } from "./pca.js";

const API_ENDPOINT = "https://api.edenai.run/v2/image/embeddings";
const IMAGE_PATH = 'datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images';
async function main() {
  const apiKey = process.env.EDEN_API_KEY;

  const retrievedPaths = getFilesFromFolders(2, 1, IMAGE_PATH);
  console.log('Retrieved paths from folders:', retrievedPaths);
  
  //deleteAllEmbeddings (); 
  //console.log('Deleted all embeddings');
  
  //let embeddings = [];
  //embeddings = await getEmbeddingBatch(retrievedPaths, apiKey, API_ENDPOINT);
  //console.log("embeddings", embeddings[0][0]);
  
  //const storedIds = storeEmbeddingBatch(embeddings);
  //console.log("stored ids", storedIds);
  
  const embeddingWithIdArray = getAllEmbeddings();
  console.log("Retrieved embeddings:", embeddingWithIdArray[0]);
  
  
  const projectionWithIdArray = dimensionalityReductionBatch(embeddingWithIdArray);
  console.log("projection array", projectionWithIdArray[0]);
  
  const patchedIds = patchEmbeddingBatch(projectionWithIdArray);
  console.log("patched", patchedIds);
}

main();
