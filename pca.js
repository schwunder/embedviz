import { PCA } from "ml-pca";

export const dimensionalityReduction = (embeddings) => {
  // Create PCA object
  console.log("embeddings", embeddings);
  const pca = new PCA(embeddings);
  console.log("pca", pca);
  const projection = pca.predict(embeddings, { nComponents: 2 });

  // Convert Matrix to number[][]
  const projectionArray = projection.to2DArray();
  console.log("projectionArray", projectionArray);
  return projectionArray;
};
