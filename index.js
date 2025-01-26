import { getEmbedding } from "./embed.js";
import { storeEmbedding, retrieveEmbedding, clearEmbeddings } from "./db.js";

const embeddingMap = {};

const API_ENDPOINT = "https://api.edenai.run/v2/image/embeddings";
const FILE_URL = "https://markusstrasser.org/images/fineart_collage2.jpg";

async function main() {
  const apiKey = process.env.EDEN_API_KEY;
  if (!apiKey) {
    console.error("Please set EDEN_API_KEY environment variable");
    process.exit(1);
  }

  try {
    clearEmbeddings();
    const embedding = await getEmbedding(FILE_URL, apiKey, API_ENDPOINT);
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
