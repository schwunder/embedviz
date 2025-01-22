import { Database } from "bun:sqlite";

const db = new Database("embeddings.sqlite");

// Create table if it doesn't exist
db.query(
  "CREATE TABLE IF NOT EXISTS embeddings (id INTEGER PRIMARY KEY AUTOINCREMENT, embedding BLOB)"
).run();

function storeEmbedding(embedding) {
  if (!(embedding instanceof Float32Array)) {
    throw new Error("Embedding must be a Float32Array");
  }
  const result = db
    .query("INSERT INTO embeddings (embedding) VALUES (?) RETURNING id")
    .get(new Uint8Array(embedding.buffer));
  return result.id;
}

function retrieveEmbedding(id) {
  const result = db
    .query("SELECT embedding FROM embeddings WHERE id = ?")
    .get(id);
  if (!result?.embedding) {
    return null;
  }
  return new Float32Array(new Uint8Array(result.embedding).buffer);
}

// Test the functions
const sampleEmbedding = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.6]);
const id = storeEmbedding(sampleEmbedding);
console.error("Stored embedding with id:", id);

const retrievedEmbedding = retrieveEmbedding(id);
if (retrievedEmbedding) {
  console.error("Retrieved embedding:", Array.from(retrievedEmbedding));
} else {
  console.error("No data found in database");
}

export { storeEmbedding, retrieveEmbedding };
