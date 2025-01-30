import { Database } from "bun:sqlite";

const db = new Database("embeddings.sqlite");

// Create table if it doesn't exist
db.query(
  "CREATE TABLE IF NOT EXISTS embeddings (id INTEGER PRIMARY KEY AUTOINCREMENT, artist TEXT, filename TEXT, embedding BLOB, projection REAL)"
).run();

const deleteAllEmbeddings = () => {
  return db.query("DELETE FROM embeddings").run();
};

const getAllEmbeddings = () => {
  return db.query("SELECT id, embedding FROM embeddings").all();
};

// clear
const clearEmbedding = (id) => {
  db.query("DELETE FROM embeddings WHERE id = ?").run(id);
  return id;
};

const clearEmbeddingBatch = (ids) => {
  return ids.map(id => clearEmbedding(id));
};
// store 
const storeEmbedding = ({ artist, filename, embedding, projection }) => {
  const result = db
    .query(
      "INSERT INTO embeddings (artist, filename, embedding, projection) VALUES (?, ?, ?, ?) RETURNING id"
    )
    .get(
      artist,
      filename,
      embedding ? new Uint8Array(embedding.buffer) : null,
      projection ? projection[0] : null
    );
  return result.id;
};

const storeEmbeddingBatch = (embeddings) => {
  return embeddings.map((embedding) => storeEmbedding(embedding));
};

// retrieve
const retrieveEmbedding = (id) => {
  const result = db
    .query("SELECT embedding FROM embeddings WHERE id = ?")
    .get(id);
  if (!result?.embedding) {
    return null;
  }
  return new Float32Array(new Uint8Array(result.embedding).buffer);
};

const retrieveEmbeddingBatch = (ids) => {
  return ids.map(id => retrieveEmbedding(id));
};


// patch

// embedding
const patchWithEmbedding = (id, embedding) => {
  if (embedding && !(embedding instanceof Float32Array)) {
    throw new Error("Embedding must be a Float32Array");
  }
  db.query("UPDATE embeddings SET embedding = ? WHERE id = ?").run(
    new Uint8Array(embedding.buffer),
    id
  );
  return id;
};

const patchWithEmbeddingBatch = (embeddingsWithIdArray) => {
  return embeddingsWithIdArray.map(({ id, embedding }) => patchWithEmbedding(id, embedding));
};

// projection
const patchWithProjection = (id, projection) => {
  if (!Array.isArray(projection) || projection.length !== 2) {
    throw new Error("Projection must be an array with exactly 2 entries");
  }
  db.query("UPDATE embeddings SET projection = ? WHERE id = ?").run(
    new Uint8Array(projection[0].buffer),
    id
  );
  return id;
};

const patchWithProjectionBatch = (projectionsWithIdArray) => {
  return projectionsWithIdArray.map(({ id, projection }) => patchWithProjection(id, projection));
};

export { 
  getAllEmbeddings, 
  deleteAllEmbeddings,
  storeEmbedding, 
  storeEmbeddingBatch, 
  retrieveEmbedding, 
  retrieveEmbeddingBatch,
  clearEmbedding, 
  clearEmbeddingBatch, 
  patchWithEmbedding, 
  patchWithEmbeddingBatch, 
  patchWithProjection, 
  patchWithProjectionBatch 
};
