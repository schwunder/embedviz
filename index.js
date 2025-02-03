import { 
  getAllEmbeddings,
  retrieveEmbedding,
  retrieveFullEntry,
  patchWithSingleProjection,
  patchWithBatchProjection,
  patchWithBatchProjectionById,
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
    patchWithBatchProjectionById(projection.id, projection.projection[0], projection.projection[1]);
  });
  const oneProjection = retrieveFullEntry(batchProjections[0].id);
  console.log(oneProjection);

}

main();
