// Helper function to analyze data ranges by artist
function analyzeDataRangesByArtist(databaseIds) {
  // Group by artist first
  const byArtist = databaseIds.reduce((acc, item) => {
    if (!acc[item.artist]) {
      acc[item.artist] = [];
    }
    acc[item.artist].push(item);
    return acc;
  }, {});

  // Analyze each artist's data
  return Object.entries(byArtist).map(([artist, items]) => {
    const sortedIds = [...items].sort((a, b) => a.id - b.id);
    
    // For embeddings
    const withEmbeddings = [];
    const withoutEmbeddings = [];
    let currentEmbeddingRange = null;

    // For single projections
    const withSingleProjections = [];
    const withoutSingleProjections = [];
    let currentSingleProjectionRange = null;

    // For batch projections
    const withBatchProjections = [];
    const withoutBatchProjections = [];
    let currentBatchProjectionRange = null;

    // Helper to finalize a range
    const finalizeRange = (range, ranges) => {
      if (range) {
        if (range.start === range.end) {
          ranges.push(`${range.start}`);
        } else {
          ranges.push(`${range.start}-${range.end}`);
        }
      }
    };

    // Analyze each ID for embeddings
    sortedIds.forEach((item) => {
      const hasEmbedding = item.embedding !== null;
      
      if (!currentEmbeddingRange || currentEmbeddingRange.type !== hasEmbedding) {
        finalizeRange(currentEmbeddingRange, hasEmbedding ? withoutEmbeddings : withEmbeddings);
        currentEmbeddingRange = {
          start: item.id,
          end: item.id,
          type: hasEmbedding
        };
      } else {
        currentEmbeddingRange.end = item.id;
      }
    });

    // Analyze each ID for single projections
    sortedIds.forEach((item) => {
      const hasSingleProjection = item.projection_single !== null;
      
      if (!currentSingleProjectionRange || currentSingleProjectionRange.type !== hasSingleProjection) {
        finalizeRange(currentSingleProjectionRange, hasSingleProjection ? withoutSingleProjections : withSingleProjections);
        currentSingleProjectionRange = {
          start: item.id,
          end: item.id,
          type: hasSingleProjection
        };
      } else {
        currentSingleProjectionRange.end = item.id;
      }
    });

    // Analyze each ID for batch projections
    sortedIds.forEach((item) => {
      const hasBatchProjection = item.projection_batch !== null;
      
      if (!currentBatchProjectionRange || currentBatchProjectionRange.type !== hasBatchProjection) {
        finalizeRange(currentBatchProjectionRange, hasBatchProjection ? withoutBatchProjections : withBatchProjections);
        currentBatchProjectionRange = {
          start: item.id,
          end: item.id,
          type: hasBatchProjection
        };
      } else {
        currentBatchProjectionRange.end = item.id;
      }
    });

    // Finalize last ranges
    if (currentEmbeddingRange) {
      finalizeRange(currentEmbeddingRange, currentEmbeddingRange.type ? withEmbeddings : withoutEmbeddings);
    }
    if (currentSingleProjectionRange) {
      finalizeRange(currentSingleProjectionRange, currentSingleProjectionRange.type ? withSingleProjections : withoutSingleProjections);
    }
    if (currentBatchProjectionRange) {
      finalizeRange(currentBatchProjectionRange, currentBatchProjectionRange.type ? withBatchProjections : withoutBatchProjections);
    }

    const totalWithEmbeddings = sortedIds.filter(item => item.embedding !== null).length;
    const totalWithSingleProjections = sortedIds.filter(item => item.projection_single !== null).length;
    const totalWithBatchProjections = sortedIds.filter(item => item.projection_batch !== null).length;
    
    const firstWithoutEmbedding = sortedIds.find(item => item.embedding === null);
    const firstWithoutSingleProjection = sortedIds.find(item => item.projection_single === null);
    const firstWithoutBatchProjection = sortedIds.find(item => item.projection_batch === null);

    return {
      artist,
      totalFiles: sortedIds.length,
      embeddings: {
        withRanges: withEmbeddings.length > 0 ? withEmbeddings.join(', ') : 'none',
        withoutRanges: withoutEmbeddings.length > 0 ? withoutEmbeddings.join(', ') : 'none',
        total: totalWithEmbeddings,
        totalWithout: sortedIds.length - totalWithEmbeddings,
        firstWithout: firstWithoutEmbedding ? firstWithoutEmbedding.filename : null
      },
      singleProjections: {
        withRanges: withSingleProjections.length > 0 ? withSingleProjections.join(', ') : 'none',
        withoutRanges: withoutSingleProjections.length > 0 ? withoutSingleProjections.join(', ') : 'none',
        total: totalWithSingleProjections,
        totalWithout: sortedIds.length - totalWithSingleProjections,
        firstWithout: firstWithoutSingleProjection ? firstWithoutSingleProjection.filename : null
      },
      batchProjections: {
        withRanges: withBatchProjections.length > 0 ? withBatchProjections.join(', ') : 'none',
        withoutRanges: withoutBatchProjections.length > 0 ? withoutBatchProjections.join(', ') : 'none',
        total: totalWithBatchProjections,
        totalWithout: sortedIds.length - totalWithBatchProjections,
        firstWithout: firstWithoutBatchProjection ? firstWithoutBatchProjection.filename : null
      },
      idRange: `${sortedIds[0].id}-${sortedIds[sortedIds.length - 1].id}`
    };
  });
}

function analyzeFileNumberSequence(fileNames) {
  const numbers = fileNames
    .map(name => {
      const match = name.match(/_(\d+)\./);
      return match ? parseInt(match[1]) : null;
    })
    .filter(num => num !== null)
    .sort((a, b) => a - b);

  if (numbers.length === 0) {
    return {
      total: 0,
      range: "none",
      gaps: []
    };
  }

  const gaps = [];
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] !== numbers[i - 1] + 1) {
      for (let j = numbers[i - 1] + 1; j < numbers[i]; j++) {
        gaps.push(j);
      }
    }
  }

  return {
    total: numbers.length,
    range: `${numbers[0]}-${numbers[numbers.length - 1]}`,
    gaps
  };
}

function analyzeDataStatus(databaseIds) {
  const withEmbeddings = databaseIds.filter(item => item.embedding !== null);
  const withoutEmbeddings = databaseIds.filter(item => item.embedding === null);
  const withSingleProjections = databaseIds.filter(item => item.projection_single !== null);
  const withoutSingleProjections = databaseIds.filter(item => item.projection_single === null);
  const withBatchProjections = databaseIds.filter(item => item.projection_batch !== null);
  const withoutBatchProjections = databaseIds.filter(item => item.projection_batch === null);

  return {
    withEmbeddings: withEmbeddings.length,
    withoutEmbeddings: withoutEmbeddings.length,
    withSingleProjections: withSingleProjections.length,
    withoutSingleProjections: withoutSingleProjections.length,
    withBatchProjections: withBatchProjections.length,
    withoutBatchProjections: withoutBatchProjections.length,
    firstWithoutEmbedding: withoutEmbeddings[0],
    firstWithoutSingleProjection: withoutSingleProjections[0],
    firstWithoutBatchProjection: withoutBatchProjections[0]
  };
}

function analyzeDataRanges(databaseIds) {
  const sortedIds = [...databaseIds].sort((a, b) => a.id - b.id);
  
  const ranges = {
    embeddings: {
      withRanges: [],
      withoutRanges: []
    },
    singleProjections: {
      withRanges: [],
      withoutRanges: []
    },
    batchProjections: {
      withRanges: [],
      withoutRanges: []
    }
  };

  let currentRange = null;

  // Helper to finalize a range
  const finalizeRange = (range, ranges) => {
    if (range) {
      if (range.start === range.end) {
        ranges.push(`${range.start}`);
      } else {
        ranges.push(`${range.start}-${range.end}`);
      }
    }
  };

  // Analyze embeddings
  sortedIds.forEach((item) => {
    const hasEmbedding = item.embedding !== null;
    
    if (!currentRange || currentRange.type !== hasEmbedding) {
      finalizeRange(currentRange, hasEmbedding ? ranges.embeddings.withoutRanges : ranges.embeddings.withRanges);
      currentRange = {
        start: item.id,
        end: item.id,
        type: hasEmbedding
      };
    } else {
      currentRange.end = item.id;
    }
  });
  finalizeRange(currentRange, currentRange?.type ? ranges.embeddings.withRanges : ranges.embeddings.withoutRanges);
  currentRange = null;

  // Analyze single projections
  sortedIds.forEach((item) => {
    const hasSingleProjection = item.projection_single !== null;
    
    if (!currentRange || currentRange.type !== hasSingleProjection) {
      finalizeRange(currentRange, hasSingleProjection ? ranges.singleProjections.withoutRanges : ranges.singleProjections.withRanges);
      currentRange = {
        start: item.id,
        end: item.id,
        type: hasSingleProjection
      };
    } else {
      currentRange.end = item.id;
    }
  });
  finalizeRange(currentRange, currentRange?.type ? ranges.singleProjections.withRanges : ranges.singleProjections.withoutRanges);
  currentRange = null;

  // Analyze batch projections
  sortedIds.forEach((item) => {
    const hasBatchProjection = item.projection_batch !== null;
    
    if (!currentRange || currentRange.type !== hasBatchProjection) {
      finalizeRange(currentRange, hasBatchProjection ? ranges.batchProjections.withoutRanges : ranges.batchProjections.withRanges);
      currentRange = {
        start: item.id,
        end: item.id,
        type: hasBatchProjection
      };
    } else {
      currentRange.end = item.id;
    }
  });
  finalizeRange(currentRange, currentRange?.type ? ranges.batchProjections.withRanges : ranges.batchProjections.withoutRanges);

  return {
    embeddings: {
      withRanges: ranges.embeddings.withRanges.join(', ') || 'none',
      withoutRanges: ranges.embeddings.withoutRanges.join(', ') || 'none'
    },
    singleProjections: {
      withRanges: ranges.singleProjections.withRanges.join(', ') || 'none',
      withoutRanges: ranges.singleProjections.withoutRanges.join(', ') || 'none'
    },
    batchProjections: {
      withRanges: ranges.batchProjections.withRanges.join(', ') || 'none',
      withoutRanges: ranges.batchProjections.withoutRanges.join(', ') || 'none'
    }
  };
}

function printDatabaseAnalysis(databaseIds, sequenceAnalysis, dataStatus, dataRanges) {
  console.log('\nDatabase Files Analysis:');
  
  // Sort by ID to analyze sequence
  const sortedIds = [...databaseIds].sort((a, b) => a.id - b.id);
  
  // Basic stats
  console.log(`- Total files: ${sortedIds.length}`);
  if (sortedIds.length > 0) {
    console.log(`- Number range: ${sortedIds[0].id}-${sortedIds[sortedIds.length - 1].id}`);
    
    // Show a sample of entries
    const sampleSize = Math.min(2, sortedIds.length);
    console.log('- Sample entries:');
    sortedIds.slice(0, sampleSize).forEach(entry => {
      console.log(`  ID ${entry.id}: ${entry.filename} (${entry.artist})`);
    });
  }
  
  // Check for gaps in sequence
  const hasGaps = sortedIds.some((item, index) => {
    if (index === 0) return false;
    return item.id !== sortedIds[index - 1].id + 1;
  });
  
  if (hasGaps) {
    console.log('- Warning: Sequence has gaps');
    // Could add gap analysis here if needed
  } else {
    console.log('- Sequence is complete with no gaps');
  }

  // Print data status
  console.log('\nData Status:');
  console.log(`- Files with embeddings: ${dataStatus.withEmbeddings}`);
  console.log(`- Files without embeddings: ${dataStatus.withoutEmbeddings}`);
  console.log(`- Files with single projections: ${dataStatus.withSingleProjections}`);
  console.log(`- Files without single projections: ${dataStatus.withoutSingleProjections}`);
  console.log(`- Files with batch projections: ${dataStatus.withBatchProjections}`);
  console.log(`- Files without batch projections: ${dataStatus.withoutBatchProjections}`);

  if (dataStatus.withoutEmbeddings > 0 || dataStatus.withoutSingleProjections > 0 || dataStatus.withoutBatchProjections > 0) {
    console.log('\nNext Items Needing Processing:');
    if (dataStatus.firstWithoutEmbedding) {
      console.log(`- First file needing embedding: ${dataStatus.firstWithoutEmbedding.filename} (${dataStatus.firstWithoutEmbedding.artist})`);
    }
    if (dataStatus.firstWithoutSingleProjection) {
      console.log(`- First file needing single projection: ${dataStatus.firstWithoutSingleProjection.filename} (${dataStatus.firstWithoutSingleProjection.artist})`);
    }
    if (dataStatus.firstWithoutBatchProjection) {
      console.log(`- First file needing batch projection: ${dataStatus.firstWithoutBatchProjection.filename} (${dataStatus.firstWithoutBatchProjection.artist})`);
    }
  }

  // Print data ranges
  console.log('\nData Ranges:');
  if (dataRanges?.embeddings?.withRanges) {
    console.log(`- IDs with embeddings: ${dataRanges.embeddings.withRanges}`);
  }
  if (dataRanges?.embeddings?.withoutRanges) {
    console.log(`- IDs without embeddings: ${dataRanges.embeddings.withoutRanges}`);
  }
  if (dataRanges?.singleProjections?.withRanges) {
    console.log(`- IDs with single projections: ${dataRanges.singleProjections.withRanges}`);
  }
  if (dataRanges?.singleProjections?.withoutRanges) {
    console.log(`- IDs without single projections: ${dataRanges.singleProjections.withoutRanges}`);
  }
  if (dataRanges?.batchProjections?.withRanges) {
    console.log(`- IDs with batch projections: ${dataRanges.batchProjections.withRanges}`);
  }
  if (dataRanges?.batchProjections?.withoutRanges) {
    console.log(`- IDs without batch projections: ${dataRanges.batchProjections.withoutRanges}`);
  }
}

function printArtistAnalysis(artistAnalysis) {
  console.log('\nStatus By Artist:');
  
  // Sort artists by total files for better organization
  const sortedAnalysis = [...artistAnalysis].sort((a, b) => b.totalFiles - a.totalFiles);
  
  // Show summary first
  console.log('\nSummary:');
  sortedAnalysis.forEach(analysis => {
    console.log(`- ${analysis.artist}: ${analysis.totalFiles} files (${analysis.embeddings.total} with embeddings)`);
  });
  
  // Then show detailed analysis for each artist
  sortedAnalysis.forEach(analysis => {
    console.log(`\n${analysis.artist}:`);
    console.log(`- Total files: ${analysis.totalFiles} (ID range: ${analysis.idRange})`);
    
    // Embeddings status
    console.log('\nEmbeddings:');
    console.log(`- Files with embeddings: ${analysis.embeddings.total}`);
    console.log(`- Files without embeddings: ${analysis.embeddings.totalWithout}`);
    if (analysis.embeddings?.withRanges || analysis.embeddings?.withoutRanges) {
      console.log('- ID ranges:');
      if (analysis.embeddings?.withRanges) {
        console.log(`  With embeddings: ${analysis.embeddings.withRanges}`);
      }
      if (analysis.embeddings?.withoutRanges) {
        console.log(`  Without embeddings: ${analysis.embeddings.withoutRanges}`);
      }
    }
    if (analysis.embeddings.firstWithout) {
      console.log(`- Next file needing embedding: ${analysis.embeddings.firstWithout}`);
    }

    // Projections status
    if (analysis.singleProjections.total > 0 || analysis.batchProjections.total > 0) {
      console.log('\nProjections:');
      
      // Single projections
      if (analysis.singleProjections.total > 0) {
        console.log('- Single Projections (PCA per item):');
        console.log(`  Files with: ${analysis.singleProjections.total}`);
        console.log(`  Files without: ${analysis.singleProjections.totalWithout}`);
        if (analysis.singleProjections?.withRanges) {
          console.log(`  With ranges: ${analysis.singleProjections.withRanges}`);
        }
        if (analysis.singleProjections?.withoutRanges) {
          console.log(`  Without ranges: ${analysis.singleProjections.withoutRanges}`);
        }
        if (analysis.singleProjections.firstWithout) {
          console.log(`  Next file needing single projection: ${analysis.singleProjections.firstWithout}`);
        }
      }
      
      // Batch projections
      if (analysis.batchProjections.total > 0) {
        console.log('- Batch Projections (PCA on multiple items):');
        console.log(`  Files with: ${analysis.batchProjections.total}`);
        console.log(`  Files without: ${analysis.batchProjections.totalWithout}`);
        if (analysis.batchProjections?.withRanges) {
          console.log(`  With ranges: ${analysis.batchProjections.withRanges}`);
        }
        if (analysis.batchProjections?.withoutRanges) {
          console.log(`  Without ranges: ${analysis.batchProjections.withoutRanges}`);
        }
        if (analysis.batchProjections.firstWithout) {
          console.log(`  Next file needing batch projection: ${analysis.batchProjections.firstWithout}`);
        }
      }
    }
  });
}

export {
  analyzeDataRangesByArtist,
  analyzeFileNumberSequence,
  analyzeDataStatus,
  analyzeDataRanges,
  printDatabaseAnalysis,
  printArtistAnalysis
};
