import { Database } from "bun:sqlite";

const db = new Database("embeddings.sqlite");

// Ensure table exists
db.query("DROP TABLE IF EXISTS embeddings").run();
db.query("CREATE TABLE embeddings (embedding BLOB)").run();

function storeEmbedding(embedding) {
  if (!(embedding instanceof Float32Array)) {
    throw new Error("Embedding must be a Float32Array");
  }
  db.query("INSERT INTO embeddings VALUES (?)").run(
    new Uint8Array(embedding.buffer)
  );
}

function retrieveEmbedding() {
  const result = db.query("SELECT * FROM embeddings").get();
  if (!result?.embedding) {
    return null;
  }
  return new Float32Array(new Uint8Array(result.embedding).buffer);
}

// Test the functions
const sampleEmbedding = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]);
storeEmbedding(sampleEmbedding);

const retrievedEmbedding = retrieveEmbedding();
if (retrievedEmbedding) {
  console.error("Stored embedding:", Array.from(retrievedEmbedding));
} else {
  console.error("No data found in database");
}

export { storeEmbedding, retrieveEmbedding };
