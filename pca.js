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
export const dimensionalityReductionBatch = (embeddingsWithIdArray) => {
  if (!Array.isArray(embeddingsWithIdArray) || embeddingsWithIdArray.length === 0) {
    throw new TypeError("EmbeddingsWithIdArray must be a non-empty array.");
  }
  if (embeddingsWithIdArray.some(embedding => !("id" in embedding) || !("embedding" in embedding))) {
    throw new TypeError("EmbeddingsWithIdArray must be an array of objects with 'id' and 'embedding' properties.");
  }
  if (embeddingsWithIdArray.some(embedding => !(embedding.embedding instanceof Uint8Array))) {
    throw new TypeError("Embedding must be a Uint8Array.");
  }

  // Convert embeddings to Float32Array format
  const embeddings = embeddingsWithIdArray.map(({ embedding }) => ({
    embedding: new Float32Array(embedding)
  }));
  
  // Process all embeddings at once
  const projections = dimensionalityReduction(embeddings);
  
  // Map back to objects with IDs
  return embeddingsWithIdArray.map(({ id }, index) => ({
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
export const dimensionalityReductionLoop = (embeddingsWithIdArray) => {
  if (!Array.isArray(embeddingsWithIdArray) || embeddingsWithIdArray.length === 0) {
    throw new TypeError("EmbeddingsWithIdArray must be a non-empty array.");
  }
  if (embeddingsWithIdArray.some(embedding => !("id" in embedding) || !("embedding" in embedding))) {
    throw new TypeError("EmbeddingsWithIdArray must be an array of objects with 'id' and 'embedding' properties.");
  }
  if (embeddingsWithIdArray.some(embedding => !(embedding.embedding instanceof Uint8Array))) {
    throw new TypeError("Embedding must be a Uint8Array.");
  }

  // Process each embedding independently
  return embeddingsWithIdArray.map(({ id, embedding }) => {
    const singleEmbedding = [{
      embedding: new Float32Array(embedding)
    }];
    const projection = dimensionalityReduction(singleEmbedding)[0];
    return { id, projection };
  });
};

// For testing
if (import.meta.main) {
  const { getAllEmbeddings } = await import('./db.js');
  try {
    const embeddings = await getAllEmbeddings();
    if (embeddings.length === 0) {
      console.error("No embeddings found in database");
      process.exit(1);
    }

    console.log("\n=== Testing independence of projections ===");
    
    // Take first 3 embeddings
    const testEmbeddings = embeddings.slice(0, 3);

    // Process first embedding alone
    console.log("\nProcessing first embedding alone:");
    const singleProjection = dimensionalityReduction([testEmbeddings[0]]);
    console.log("Single projection:", singleProjection[0]);

    // Process first embedding as part of batch
    console.log("\nProcessing first embedding in batch:");
    const batchProjections = dimensionalityReductionBatch(testEmbeddings);
    console.log("Same embedding in batch:", batchProjections[0].projection);
    
    // Show that results are different
    console.log("\nDifference between projections:");
    console.log("X diff:", Math.abs(singleProjection[0][0] - batchProjections[0].projection[0]));
    console.log("Y diff:", Math.abs(singleProjection[0][1] - batchProjections[0].projection[1]));
    
    console.log("\nAll batch projections:");
    batchProjections.forEach(({ id, projection }) => {
      console.log(`ID ${id}:`, projection);
    });

    console.log("\n=== Comparing different reduction methods ===");
    
    // Process embeddings independently
    console.log("\nProcessing embeddings independently (Loop):");
    const loopProjections = dimensionalityReductionLoop(testEmbeddings);
    console.log("Loop projections:");
    loopProjections.forEach(({ id, projection }) => {
      console.log(`ID ${id}:`, projection);
    });

    // Process embeddings as batch
    console.log("\nProcessing embeddings as batch:");
    const batchProjections2 = dimensionalityReductionBatch(testEmbeddings);
    console.log("Batch projections:");
    batchProjections2.forEach(({ id, projection }) => {
      console.log(`ID ${id}:`, projection);
    });

    // Show differences
    console.log("\nDifferences between loop and batch for each embedding:");
    loopProjections.forEach((loopProj, i) => {
      const batchProj = batchProjections2[i];
      console.log(`\nID ${loopProj.id}:`);
      console.log("X diff:", Math.abs(loopProj.projection[0] - batchProj.projection[0]));
      console.log("Y diff:", Math.abs(loopProj.projection[1] - batchProj.projection[1]));
    });

  } catch (error) {
    console.error("Error:", error);
  }
}
