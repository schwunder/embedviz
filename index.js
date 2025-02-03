import { 
  getAllEmbeddings,
  retrieveEmbedding,
  patchWithSingleProjection,
  patchWithBatchProjection,
  clearSingleProjections,
  clearBatchProjections
} from "./db.js";
// import { getDisplayAblePath } from "./paths.js";
import { dimensionalityReductionBatch } from "./pca.js";


async function main() {
  const validEmbeddings = getAllEmbeddings()
  .filter(row => row.hasEmbedding)
  .map(row => ({
    id: row.id,
    embedding: row.embedding
  }));

  const batchProjections = dimensionalityReductionBatch(validEmbeddings);
  console.log(batchProjections);
  batchProjections.forEach(projection => {
    patchWithBatchProjection(projection.id, projection.projection);
  });
  const oneProjection = retrieveEmbedding(batchProjections[0].id);
  console.log(oneProjection);

}

main();
