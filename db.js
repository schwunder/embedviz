import { Database } from "bun:sqlite";

const db = new Database("embeddings.sqlite", { create: true, readwrite: true });

db.query(
  "CREATE TABLE IF NOT EXISTS embeddings (id INTEGER PRIMARY KEY AUTOINCREMENT, artist TEXT, filename TEXT UNIQUE, embedding BLOB, projection_single_x REAL, projection_single_y REAL, projection_batch_x REAL, projection_batch_y REAL)"
).run();

const getAllEmbeddings = () => {
  const results = db.query("SELECT id, artist, filename, embedding, projection_single_x, projection_single_y, projection_batch_x, projection_batch_y FROM embeddings").all();
  return results.map(row => ({
    ...row,
    hasEmbedding: row.embedding !== null
  }));
};

const deleteAllEmbeddings = () => {
  return db.query("DELETE FROM embeddings").run();
};

// clear
const clearEmbedding = (id) => {
  db.query("UPDATE embeddings SET embedding = NULL WHERE id = ? OR filename = ?").run(id, id);
  return id;
};

const clearEmbeddingLoop = (ids) => {
  return ids.map(id => clearEmbedding(id));
};

// clear projections
const clearSingleProjections = () => {
  return db.query("UPDATE embeddings SET projection_single_x = NULL, projection_single_y = NULL").run();
};

const clearBatchProjections = () => {
  return db.query("UPDATE embeddings SET projection_batch_x = NULL, projection_batch_y = NULL").run();
};

// store 
const storeEmbedding = ({ id, artist, filename, embedding, projection_single_x, projection_single_y, projection_batch_x, projection_batch_y }) => {
  let query;
  let params;
  
  if (id) {
    query = `UPDATE embeddings SET
      artist = COALESCE(?, embeddings.artist),
      embedding = COALESCE(?, embeddings.embedding),
      projection_single_x = COALESCE(?, embeddings.projection_single_x),
      projection_single_y = COALESCE(?, embeddings.projection_single_y),
      projection_batch_x = COALESCE(?, embeddings.projection_batch_x),
      projection_batch_y = COALESCE(?, embeddings.projection_batch_y)
      WHERE id = ?`;
    params = [
      artist,
      embedding ? new Uint8Array(embedding.buffer) : null,
      projection_single_x,
      projection_single_y,
      projection_batch_x,
      projection_batch_y,
      id
    ];
  } else {
    query = `INSERT INTO embeddings 
      (artist, filename, embedding, projection_single_x, projection_single_y, projection_batch_x, projection_batch_y) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(filename) DO UPDATE SET
      artist = COALESCE(excluded.artist, embeddings.artist),
      embedding = COALESCE(excluded.embedding, embeddings.embedding),
      projection_single_x = COALESCE(excluded.projection_single_x, embeddings.projection_single_x),
      projection_single_y = COALESCE(excluded.projection_single_y, embeddings.projection_single_y),
      projection_batch_x = COALESCE(excluded.projection_batch_x, embeddings.projection_batch_x),
      projection_batch_y = COALESCE(excluded.projection_batch_y, embeddings.projection_batch_y)`;
    params = [
      artist,
      filename,
      embedding ? new Uint8Array(embedding.buffer) : null,
      projection_single_x,
      projection_single_y,
      projection_batch_x,
      projection_batch_y
    ];
  }
  
  const result = db.query(query).run(...params);
  return result.lastInsertRowId;
};

const storeEmbeddingLoop = (embeddings) => {
  return embeddings.map(embedding => storeEmbedding(embedding));
};

// patch
const patchWithEmbedding = (filename, embedding) => {
  return storeEmbedding({
    filename,
    embedding,
    artist: null,  // Will keep existing value due to COALESCE
    projection_single_x: null,
    projection_single_y: null,
    projection_batch_x: null,
    projection_batch_y: null
  });
};

const patchWithEmbeddingLoop = (embeddingsWithIdArray) => {
  return embeddingsWithIdArray.map(({ filename, embedding }) => patchWithEmbedding(filename, embedding));
};

const patchWithSingleProjection = (filename, projection) => {
  return storeEmbedding({
    filename,
    embedding: null,  // Will keep existing value due to COALESCE
    artist: null,
    projection_single_x: projection.x,
    projection_single_y: projection.y,
    projection_batch_x: null,
    projection_batch_y: null
  });
};

const patchWithSingleProjectionLoop = (projectionsWithFilenameArray) => {
  return projectionsWithFilenameArray.map(({ filename, projection }) => 
    patchWithSingleProjection(filename, projection)
  );
};

const patchWithBatchProjection = (filename, projection) => {
  return storeEmbedding({
    filename,
    embedding: null,  // Will keep existing value due to COALESCE
    artist: null,
    projection_single_x: null,
    projection_single_y: null,
    projection_batch_x: projection.x,
    projection_batch_y: projection.y
  });
};

const patchWithBatchProjectionById = (id, projection_x, projection_y) => {
  return storeEmbedding({
    id,
    artist: null,
    embedding: null,
    projection_single_x: null,
    projection_single_y: null,
    projection_batch_x: projection_x,
    projection_batch_y: projection_y
  });
};

const patchWithBatchProjectionLoop = (projectionsWithFilenameArray) => {
  return projectionsWithFilenameArray.map(({ filename, projection }) => 
    patchWithBatchProjection(filename, projection)
  );
};

// retrieve
const retrieveEmbedding = (id) => {
  const result = db
    .query("SELECT embedding FROM embeddings WHERE id = ? OR filename = ?")
    .get(id, id);
  if (!result?.embedding) {
    return null;
  }
  return new Float32Array(result.embedding);
};

const retrieveFullEntry = (id) => {
  const result = db
    .query("SELECT * FROM embeddings WHERE id = ? OR filename = ?")
    .get(id, id);
  if (!result) {
    return null;
  }
  return result;
};

const retrieveEmbeddingLoop = (ids) => {
  return ids.map(id => retrieveEmbedding(id));
};

const retrieveFilename = (id) => {
  const result = db
    .query("SELECT filename FROM embeddings WHERE id = ? OR filename = ?")
    .get(id, id);
  if (!result?.filename) {
    return null;
  }
  return result.filename;
};

const retrieveFilenameLoop = (ids) => {
  return ids.map(id => retrieveFilename(id));
};

export { 
  getAllEmbeddings, 
  deleteAllEmbeddings,
  storeEmbedding, 
  storeEmbeddingLoop,
  retrieveFullEntry,
  retrieveEmbedding,
  retrieveEmbeddingLoop,
  retrieveFilename,
  retrieveFilenameLoop,
  clearEmbedding, 
  clearEmbeddingLoop, 
  patchWithEmbedding, 
  patchWithEmbeddingLoop,
  patchWithSingleProjection,
  patchWithSingleProjectionLoop,
  patchWithBatchProjection,
  patchWithBatchProjectionLoop,
  patchWithBatchProjectionById,
  clearSingleProjections,
  clearBatchProjections
};
