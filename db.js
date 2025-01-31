import { Database } from "bun:sqlite";

const db = new Database("embeddings.sqlite");

// Create table if it doesn't exist
db.query(
  "CREATE TABLE IF NOT EXISTS embeddings (id INTEGER PRIMARY KEY AUTOINCREMENT, artist TEXT, filename TEXT, embedding BLOB, projection_single_x REAL, projection_single_y REAL, projection_batch_x REAL, projection_batch_y REAL)"
).run();

const deleteAllEmbeddings = () => {
  return db.query("DELETE FROM embeddings").run();
};

const getAllEmbeddings = () => {
  return db.query("SELECT id, artist, filename, embedding, projection_single_x, projection_single_y, projection_batch_x, projection_batch_y FROM embeddings").all();
};

// clear
const clearEmbedding = (id) => {
  db.query("UPDATE embeddings SET embedding = NULL WHERE id = ?").run(id);
  return id;
};

const clearEmbeddingLoop = (ids) => {
  return ids.map(id => clearEmbedding(id));
};

// store 
const storeEmbedding = ({ artist, filename, embedding, projection_single, projection_batch }) => {
  const result = db
    .query("INSERT INTO embeddings (artist, filename, embedding, projection_single_x, projection_single_y, projection_batch_x, projection_batch_y) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(
      artist, 
      filename, 
      embedding ? new Uint8Array(embedding.buffer) : null, 
      projection_single ? projection_single[0] : null,
      projection_single ? projection_single[1] : null,
      projection_batch ? projection_batch[0] : null,
      projection_batch ? projection_batch[1] : null
    );
  return result.lastInsertRowId;
};

const storeEmbeddingLoop = (embeddings) => {
  return embeddings.map(embedding => storeEmbedding(embedding));
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

const retrieveEmbeddingLoop = (ids) => {
  return ids.map(id => retrieveEmbedding(id));
};

const retrieveFilename = (id) => {
  const result = db
    .query("SELECT filename FROM embeddings WHERE id = ?")
    .get(id);
  if (!result?.filename) {
    return null;
  }
  return result.filename;
};

const retrieveFilenameLoop = (ids) => {
  return ids.map(id => retrieveFilename(id));
};

// patch
const patchWithEmbedding = (id, embedding) => {
  if (embedding && !(embedding instanceof Float32Array)) {
    throw new Error("Embedding must be a Float32Array");
  }
  db.query("UPDATE embeddings SET embedding = ? WHERE id = ?").run(
    embedding ? new Uint8Array(embedding.buffer) : null,
    id
  );
  return id;
};

const patchWithEmbeddingLoop = (embeddingsWithIdArray) => {
  return embeddingsWithIdArray.map(({ id, embedding }) => patchWithEmbedding(id, embedding));
};

const patchWithSingleProjection = (id, projection) => {
  return db
    .query("UPDATE embeddings SET projection_single_x = ?, projection_single_y = ? WHERE id = ?")
    .run(projection[0], projection[1], id);
};

const patchWithSingleProjectionLoop = (projectionsWithIdArray) => {
  return projectionsWithIdArray.map(({ id, projection }) => patchWithSingleProjection(id, projection));
};

const patchWithBatchProjection = (id, projection) => {
  return db
    .query("UPDATE embeddings SET projection_batch_x = ?, projection_batch_y = ? WHERE id = ?")
    .run(projection[0], projection[1], id);
};

const patchWithBatchProjectionLoop = (projectionsWithIdArray) => {
  return projectionsWithIdArray.map(({ id, projection }) => patchWithBatchProjection(id, projection));
};

const retrieveProjectionType = (id) => {
  const result = db
    .query("SELECT projection_type FROM embeddings WHERE id = ?")
    .get(id);
  if (!result?.projection_type) {
    return null;
  }
  return result.projection_type;
};

const retrieveProjectionTypeLoop = (ids) => {
  return ids.map(id => retrieveProjectionType(id));
};

const patchWithProjectionType = (id, projection_type) => {
  db.query("UPDATE embeddings SET projection_type = ? WHERE id = ?").run(
    projection_type,
    id
  );
  return id;
};

const patchWithProjectionTypeLoop = (projectionTypesWithIdArray) => {
  return projectionTypesWithIdArray.map(({ id, projection_type }) => patchWithProjectionType(id, projection_type));
};

export { 
  getAllEmbeddings, 
  deleteAllEmbeddings,
  storeEmbedding, 
  storeEmbeddingLoop,
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
  retrieveProjectionType,
  retrieveProjectionTypeLoop,
  patchWithProjectionType,
  patchWithProjectionTypeLoop 
};
