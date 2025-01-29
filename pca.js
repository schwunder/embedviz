import { PCA } from "ml-pca";

export const dimensionalityReduction = (embeddings, pcaObject = null) => {
  if (!Array.isArray(embeddings) || embeddings.length === 0) {
    throw new TypeError("Embeddings must be a non-empty array.");
  }

  // Convert embeddings to regular arrays
  const processedEmbeddings = embeddings.map(item => 
    Array.from(item.embedding instanceof Float32Array ? 
      item.embedding : 
      new Float32Array(new Uint8Array(item.embedding).buffer)
    )
  );

  // Reshape each embedding into a matrix (32 columns)
  const reshapedData = processedEmbeddings.map(embedding => {
    const rows = [];
    for (let i = 0; i < embedding.length; i += 32) {
      rows.push(embedding.slice(i, i + 32));
    }
    return rows;
  });

  // Run PCA on the reshaped data
  const dataForPCA = reshapedData.length === 1 ? reshapedData[0] : reshapedData.flat();
  const pca = pcaObject || new PCA(dataForPCA, { center: true, scale: true });
  const projection = pca.predict(dataForPCA, { nComponents: 2 });
  const points = Array.isArray(projection) ? projection : projection.to2DArray();

  // For single embedding, return mean of projected points
  return embeddings.length === 1 ? [[
    points.reduce((sum, p) => sum + p[0], 0) / points.length,
    points.reduce((sum, p) => sum + p[1], 0) / points.length
  ]] : points;
};

/**
 * Processes all embeddings together in a single PCA transformation.
 * This method shows relationships between embeddings by positioning them relative to each other.
 * Points will be spread out in 2D space based on their differences.
 * The position of each point is influenced by all other points in the batch.
 * Best for visualization when you want to see how embeddings relate to each other.
 */
export const dimensionalityReductionBatch = (embeddingWithIdArray) => {
  if (!Array.isArray(embeddingWithIdArray) || embeddingWithIdArray.length === 0) {
    throw new TypeError("EmbeddingsWithIdArray must be a non-empty array.");
  }
  if (embeddingWithIdArray.some(embedding => !("id" in embedding) || !("embedding" in embedding))) {
    throw new TypeError("EmbeddingsWithIdArray must be an array of objects with 'id' and 'embedding' properties.");
  }
  if (embeddingWithIdArray.some(embedding => !(embedding.embedding instanceof Uint8Array))) {
    throw new TypeError("Embedding must be a Uint8Array.");
  }

  // Convert embeddings to Float32Array format
  const embeddings = embeddingWithIdArray.map(({ embedding }) => ({
    embedding: new Float32Array(embedding)
  }));
  
  // Process all embeddings at once
  const projections = dimensionalityReduction(embeddings);
  
  // Map back to objects with IDs
  return embeddingWithIdArray.map(({ id }, index) => ({
    id,
    projection: projections[index]
  }));
};

/**
 * Processes each embedding independently through PCA.
 * Each embedding is transformed without knowledge of other embeddings.
 * Points will tend to cluster near [0,0] since each embedding is processed alone.
 * The position of each point is NOT influenced by other embeddings.
 * Best when you want each embedding's position to be completely independent.
 */
export const dimensionalityReductionLoop = (embeddingWithIdArray) => {
  if (!Array.isArray(embeddingWithIdArray) || embeddingWithIdArray.length === 0) {
    throw new TypeError("EmbeddingsWithIdArray must be a non-empty array.");
  }
  if (embeddingWithIdArray.some(embedding => !("id" in embedding) || !("embedding" in embedding))) {
    throw new TypeError("EmbeddingsWithIdArray must be an array of objects with 'id' and 'embedding' properties.");
  }
  if (embeddingWithIdArray.some(embedding => !(embedding.embedding instanceof Uint8Array))) {
    throw new TypeError("Embedding must be a Uint8Array.");
  }

  // Process each embedding independently
  return embeddingWithIdArray.map(({ id, embedding }) => {
    const singleEmbedding = [{
      embedding: new Float32Array(embedding)
    }];
    const projection = dimensionalityReduction(singleEmbedding)[0];
    return { id, projection };
  });
};
