import { PCA } from "ml-pca";

export const dimensionalityReduction = (embeddings, pcaObject = null) => {
  // Validate embeddings
  if (!Array.isArray(embeddings) || embeddings.length === 0) {
    throw new TypeError("Embeddings must be a non-empty array.");
  }
  if (embeddings.some(embedding => !(embedding instanceof Float32Array))) {
    throw new TypeError("Embeddings must be an array of Float32Array.");
  }

  // Use existing PCA object or create new one
  const pca = pcaObject || new PCA();
  const projection = pca.predict(embeddings, { nComponents: 2 });

  // Convert Matrix to number[][]
  const projectionArray = projection.to2DArray();
  return projectionArray;
};

export const dimensionalityReductionBatch = (embeddingsWithIdArray) => {
  // Validate embeddingsWithIdArray
  if (!Array.isArray(embeddingsWithIdArray) || embeddingsWithIdArray.length === 0) {
    throw new TypeError("EmbeddingsWithIdArray must be a non-empty array.");
  }
  if (embeddingsWithIdArray.some(embedding => !("id" in embedding) || !("embedding" in embedding))) {
    throw new TypeError("EmbeddingsWithIdArray must be an array of objects with 'id' and 'embedding' properties.");
  }
  if (embeddingsWithIdArray.some(embedding => !(embedding.embedding instanceof Uint8Array))) {
    throw new TypeError("Embedding must be a Uint8Array.");
  }
  const pca = new PCA();
  const projectionsWithIdArray = embeddingsWithIdArray.map(({ id, embedding }) => {
    const floatEmbedding = new Float32Array(embedding);
    const projection = dimensionalityReduction([floatEmbedding], pca)[0];
    return { id, projection };
  });
  return projectionsWithIdArray;
};
