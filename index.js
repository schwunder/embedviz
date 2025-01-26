import { getEmbedding } from "./embed.js";
import { getLocalEmbedding, getBatchLocalEmbedding } from "./embedLocal.js";
import { storeEmbedding, retrieveEmbedding, clearEmbeddings } from "./db.js";
import { getFilesFromFolders, getFilesByArtist } from "./batchExecution.js";


const API_ENDPOINT = "https://api.edenai.run/v2/image/embeddings";
const FILE_URL = "https://markusstrasser.org/images/fineart_collage2.jpg";
const LOCAL_IMAGE_PATH = "/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_1.jpg";
async function main() {
  const apiKey = process.env.EDEN_API_KEY;
const retrievedPaths = getFilesFromFolders(2, 1, 'datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/');
console.log('Retrieved paths from folders:', retrievedPaths);
  if (!apiKey) {
    console.error("Please set EDEN_API_KEY environment variable");
    process.exit(1);
  }

  try {
    clearEmbeddings();
    const embeddings = await getBatchLocalEmbedding(retrievedPaths, apiKey, API_ENDPOINT);
    for (const embedding of embeddings) {
      const id = storeEmbedding(embedding);
      console.log("Stored embedding with id:", id);
      const retrievedEmbedding = retrieveEmbedding(id);
      console.log("Retrieved embedding:", id);
    }
  } catch (error) {
    console.error("Error getting embedding:", error);
  }
}

main();
