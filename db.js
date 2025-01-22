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

export { storeEmbedding, retrieveEmbedding };
