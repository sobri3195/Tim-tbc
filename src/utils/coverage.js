/**
 * Coverage calculation utilities for Intervention Planner
 * Uses Haversine formula for accurate distance calculation
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate Haversine distance between two points in kilometers
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Convert radius in km to approximate degrees (for quick bounding box checks)
 * @param {number} km - Radius in kilometers
 * @returns {number} Approximate degrees
 */
export function kmToDegrees(km) {
  return km / 111;
}

/**
 * Check if a grid point is within the coverage radius of any intervention pin
 * @param {Object} grid - Grid feature with geometry
 * @param {Array} pins - Array of intervention pins
 * @returns {boolean}
 */
export function isGridCovered(grid, pins) {
  if (!pins || pins.length === 0) return false;

  const [gridLng, gridLat] = grid.geometry.coordinates;

  return pins.some((pin) => {
    const distance = haversineDistance(
      pin.position[0],
      pin.position[1],
      gridLat,
      gridLng
    );
    return distance <= pin.radiusKm;
  });
}

/**
 * Calculate coverage statistics for all grids
 * @param {Array} grids - Array of grid features
 * @param {Array} pins - Array of intervention pins
 * @param {Object} timeseriesData - Timeseries data for density info
 * @param {string} timeKey - Current time key (e.g., "2024-01")
 * @returns {Object} Coverage statistics
 */
export function calculateCoverageStats(grids, pins, timeseriesData, timeKey) {
  if (!grids || grids.length === 0) {
    return {
      totalGrids: 0,
      coveredGrids: 0,
      uncoveredGrids: 0,
      coveragePercent: 0,
      highRiskCovered: 0,
      highRiskTotal: 0,
      highRiskCoveragePercent: 0,
      estimatedPopulation: 0,
    };
  }

  const snapshot = timeseriesData?.[timeKey] || {};
  const riskThreshold = 0.5; // Consider risk > 0.5 as high risk

  let coveredCount = 0;
  let highRiskCovered = 0;
  let highRiskTotal = 0;
  let totalPopulation = 0;
  let coveredPopulation = 0;

  const coverageStatus = new Map();

  grids.forEach((grid) => {
    const gridId = grid.properties.id;
    const isCovered = isGridCovered(grid, pins);
    coverageStatus.set(gridId, isCovered);

    // Get risk score and density from timeseries
    const gridData = snapshot[gridId] || {};
    const riskScore = calculateRiskScore(gridData);
    const densityIdx = gridData.densityIdx || 0.5;

    // Estimate population (proxy: densityIdx * base population per grid)
    const basePopPerGrid = 500;
    const estimatedPop = Math.round(basePopPerGrid * densityIdx);

    if (isCovered) {
      coveredCount++;
      coveredPopulation += estimatedPop;
    }

    totalPopulation += estimatedPop;

    // Track high risk coverage
    if (riskScore >= riskThreshold) {
      highRiskTotal++;
      if (isCovered) {
        highRiskCovered++;
      }
    }
  });

  return {
    totalGrids: grids.length,
    coveredGrids: coveredCount,
    uncoveredGrids: grids.length - coveredCount,
    coveragePercent: Math.round((coveredCount / grids.length) * 100),
    highRiskCovered,
    highRiskTotal,
    highRiskCoveragePercent:
      highRiskTotal > 0
        ? Math.round((highRiskCovered / highRiskTotal) * 100)
        : 0,
    estimatedPopulation: coveredPopulation,
    totalPopulation,
    coverageStatus,
  };
}

/**
 * Calculate risk score from grid data
 * @param {Object} gridData - Grid timeseries data
 * @returns {number} Risk score 0-1
 */
function calculateRiskScore(gridData) {
  if (!gridData) return 0;

  const suspectRate = Math.min((gridData.suspectVisits || 0) / 50, 1);
  const diagnosisRate = Math.min((gridData.tbDiagnosed || 0) / 10, 1);
  const visitRate = Math.min((gridData.facilityVisits || 0) / 150, 1);

  // Weighted risk score
  return suspectRate * 0.4 + diagnosisRate * 0.4 + visitRate * 0.2;
}

/**
 * Get covered and uncovered grid sets for visualization
 * @param {Array} grids - Array of grid features
 * @param {Array} pins - Array of intervention pins
 * @returns {Object} { covered: Set, uncovered: Set }
 */
export function getCoverageSets(grids, pins) {
  const covered = new Set();
  const uncovered = new Set();

  grids.forEach((grid) => {
    const gridId = grid.properties.id;
    if (isGridCovered(grid, pins)) {
      covered.add(gridId);
    } else {
      uncovered.add(gridId);
    }
  });

  return { covered, uncovered };
}

/**
 * Calculate coverage for a specific pin (which grids it covers)
 * @param {Object} pin - Intervention pin
 * @param {Array} grids - Array of grid features
 * @returns {Array} Array of covered grid IDs
 */
export function getPinCoverage(pin, grids) {
  if (!pin || !grids) return [];

  return grids
    .filter((grid) => {
      const [gridLng, gridLat] = grid.geometry.coordinates;
      const distance = haversineDistance(
        pin.position[0],
        pin.position[1],
        gridLat,
        gridLng
      );
      return distance <= pin.radiusKm;
    })
    .map((grid) => grid.properties.id);
}
