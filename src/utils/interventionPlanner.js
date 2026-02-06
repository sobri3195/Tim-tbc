export function calculateCoverage(latlng, grids) {
  const interventionRadius = 0.015;
  let coverage = 0;

  grids.forEach(grid => {
    const coords = grid.geometry.coordinates[0];
    const gridLat = (coords[0][1] + coords[2][1]) / 2;
    const gridLng = (coords[0][0] + coords[2][0]) / 2;

    const distance = Math.sqrt(
      Math.pow(latlng.lat - gridLat, 2) + 
      Math.pow(latlng.lng - gridLng, 2)
    );

    if (distance < interventionRadius) {
      coverage++;
    }
  });

  return coverage;
}

export function estimatePopulationCoverage(interventionPoints, grids, populationPerGrid = 500) {
  const coveredGrids = new Set();
  
  interventionPoints.forEach(point => {
    grids.forEach(grid => {
      const coords = grid.geometry.coordinates[0];
      const gridLat = (coords[0][1] + coords[2][1]) / 2;
      const gridLng = (coords[0][0] + coords[2][0]) / 2;

      const distance = Math.sqrt(
        Math.pow(point.position[0] - gridLat, 2) + 
        Math.pow(point.position[1] - gridLng, 2)
      );

      if (distance < 0.015) {
        coveredGrids.add(grid.properties.gridId);
      }
    });
  });

  return {
    gridsCovered: coveredGrids.size,
    estimatedPopulation: coveredGrids.size * populationPerGrid
  };
}
