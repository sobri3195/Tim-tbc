export function runDBSCAN(grids, epsilon = 0.05, minPoints = 2) {
  const clusters = [];
  const visited = new Set();
  const clustered = new Set();

  const getNeighbors = (gridIdx) => {
    const neighbors = [];
    const grid = grids[gridIdx];
    const coords = grid.geometry.coordinates[0];
    const lat1 = (coords[0][1] + coords[2][1]) / 2;
    const lng1 = (coords[0][0] + coords[2][0]) / 2;

    for (let i = 0; i < grids.length; i++) {
      if (i === gridIdx) continue;
      const otherCoords = grids[i].geometry.coordinates[0];
      const lat2 = (otherCoords[0][1] + otherCoords[2][1]) / 2;
      const lng2 = (otherCoords[0][0] + otherCoords[2][0]) / 2;

      const distance = Math.sqrt(
        Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2)
      );

      if (distance <= epsilon) {
        neighbors.push(i);
      }
    }

    return neighbors;
  };

  const expandCluster = (gridIdx, neighbors, cluster) => {
    cluster.grids.push(grids[gridIdx]);
    clustered.add(gridIdx);

    for (let i = 0; i < neighbors.length; i++) {
      const neighborIdx = neighbors[i];

      if (!visited.has(neighborIdx)) {
        visited.add(neighborIdx);
        const neighborNeighbors = getNeighbors(neighborIdx);

        if (neighborNeighbors.length >= minPoints) {
          neighbors.push(...neighborNeighbors);
        }
      }

      if (!clustered.has(neighborIdx)) {
        cluster.grids.push(grids[neighborIdx]);
        clustered.add(neighborIdx);
      }
    }
  };

  for (let i = 0; i < grids.length; i++) {
    if (visited.has(i)) continue;

    visited.add(i);
    const neighbors = getNeighbors(i);

    if (neighbors.length >= minPoints) {
      const cluster = { grids: [] };
      expandCluster(i, neighbors, cluster);
      if (cluster.grids.length > 0) {
        clusters.push(cluster);
      }
    }
  }

  return clusters;
}

export function calculateClusterStats(clusters) {
  return clusters.map((cluster, idx) => {
    const riskScores = cluster.grids.map(g => g.properties.riskScore);
    const avgRisk = riskScores.reduce((sum, val) => sum + val, 0) / riskScores.length;
    const maxRisk = Math.max(...riskScores);
    const minRisk = Math.min(...riskScores);

    return {
      id: idx,
      count: cluster.grids.length,
      avgRisk,
      maxRisk,
      minRisk,
    };
  });
}
