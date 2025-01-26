import { getEmbedding } from "./embed.js";
import { getLocalEmbedding } from "./embedLocal.js";
import { storeEmbedding, retrieveEmbedding, clearEmbeddings } from "./db.js";

const embeddingMap = {};

const API_ENDPOINT = "https://api.edenai.run/v2/image/embeddings";
const FILE_URL = "https://markusstrasser.org/images/fineart_collage2.jpg";
const LOCAL_IMAGE_PATH = "/Users/alien/Projects/embedviz/datasets/ikarus777/best-artworks-of-all-time/versions/1/images/images/Albrecht_Du╠êrer/Albrecht_Du╠êrer_1.jpg";
async function main() {
  const apiKey = process.env.EDEN_API_KEY;
  if (!apiKey) {
    console.error("Please set EDEN_API_KEY environment variable");
    process.exit(1);
  }

  try {
    clearEmbeddings();
    const embedding = await getLocalEmbedding(LOCAL_IMAGE_PATH, apiKey, API_ENDPOINT);
    console.log("Embedding:", embedding);
    const id = storeEmbedding(embedding);
    console.log("Stored embedding with id:", id);
    const retrievedEmbedding = retrieveEmbedding(id);
    console.log("Retrieved embedding:", retrievedEmbedding);
  } catch (error) {
    console.error("Error getting embedding:", error);
  }
}

main();
