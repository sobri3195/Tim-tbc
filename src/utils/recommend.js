/**
 * Priority recommendation utilities for Intervention Planner
 * Calculates priority scores for uncovered high-risk areas
 */

import { haversineDistance } from "./coverage.js";

/**
 * Calculate risk score from grid timeseries data
 * @param {Object} gridData - Grid data from timeseries
 * @returns {number} Risk score between 0-1
 */
export function calculateGridRisk(gridData) {
  if (!gridData) return 0;

  const suspectVisits = gridData.suspectVisits || 0;
  const tbDiagnosed = gridData.tbDiagnosed || 0;
  const facilityVisits = gridData.facilityVisits || 0;

  // Normalize components (assuming max values)
  const suspectRate = Math.min(suspectVisits / 30, 1);
  const diagnosisRate = Math.min(tbDiagnosed / 6, 1);
  const visitRate = Math.min(facilityVisits / 100, 1);

  // Weighted risk calculation
  // Higher suspect visits and diagnosis gap = higher risk
  const diagnosisGap = Math.max(0, suspectVisits - tbDiagnosed * 3); // Assuming 1:3 ratio expected
  const gapRate = Math.min(diagnosisGap / 20, 1);

  return suspectRate * 0.35 + diagnosisRate * 0.25 + gapRate * 0.25 + visitRate * 0.15;
}

/**
 * Calculate priority score for a grid
 * Formula: score = risk * (1 - coverage) * densityIdx
 * @param {Object} grid - Grid feature
 * @param {Object} gridData - Timeseries data for the grid
 * @param {boolean} isCovered - Whether grid is already covered
 * @returns {number} Priority score
 */
export function calculatePriorityScore(grid, gridData, isCovered) {
  const risk = calculateGridRisk(gridData);
  const densityIdx = gridData?.densityIdx || 0.5;
  const coverageFactor = isCovered ? 0 : 1; // 0 if covered, 1 if uncovered

  // Main scoring formula
  let score = risk * coverageFactor * densityIdx;

  // Boost score for very high risk uncovered areas
  if (risk > 0.7 && !isCovered) {
    score *= 1.2;
  }

  return score;
}

/**
 * Generate top N recommendations for intervention placement
 * @param {Array} grids - Array of grid features
 * @param {Object} timeseriesData - Timeseries data
 * @param {string} timeKey - Current time period
 * @param {Set} coveredGridIds - Set of already covered grid IDs
 * @param {number} count - Number of recommendations to return (default 5)
 * @returns {Array} Top recommendations
 */
export function generateRecommendations(
  grids,
  timeseriesData,
  timeKey,
  coveredGridIds,
  count = 5
) {
  if (!grids || grids.length === 0) return [];

  const snapshot = timeseriesData?.[timeKey] || {};

  // Calculate priority score for each grid
  const scoredGrids = grids.map((grid) => {
    const gridId = grid.properties.id;
    const gridData = snapshot[gridId] || {};
    const isCovered = coveredGridIds?.has(gridId) || false;
    const score = calculatePriorityScore(grid, gridData, isCovered);
    const risk = calculateGridRisk(gridData);

    return {
      gridId,
      grid,
      score,
      risk,
      densityIdx: gridData.densityIdx || 0.5,
      isCovered,
      data: gridData,
    };
  });

  // Sort by score descending and filter out already covered
  const recommendations = scoredGrids
    .filter((item) => !item.isCovered && item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((item, index) => ({
      rank: index + 1,
      gridId: item.gridId,
      position: [
        item.grid.geometry.coordinates[1],
        item.grid.geometry.coordinates[0],
      ], // [lat, lng]
      score: Math.round(item.score * 100) / 100,
      risk: Math.round(item.risk * 100) / 100,
      densityIdx: item.densityIdx,
      estimatedImpact: Math.round(item.score * item.densityIdx * 1000),
      reason: generateReason(item),
    }));

  return recommendations;
}

/**
 * Generate human-readable reason for recommendation
 * @param {Object} item - Scored grid item
 * @returns {string} Reason text
 */
function generateReason(item) {
  const reasons = [];

  if (item.risk > 0.7) {
    reasons.push("risiko tinggi");
  } else if (item.risk > 0.4) {
    reasons.push("risiko sedang");
  }

  if (item.densityIdx > 0.6) {
    reasons.push("kepadatan tinggi");
  }

  if (item.data) {
    const gap = (item.data.suspectVisits || 0) - (item.data.tbDiagnosed || 0) * 3;
    if (gap > 10) {
      reasons.push("gap diagnosis");
    }
  }

  if (reasons.length === 0) {
    return "Area belum tercakup";
  }

  return `Area ${reasons.join(" + ")}`;
}

/**
 * Check if adding a pin at position would be redundant
 * (too close to existing pins)
 * @param {Array} position - [lat, lng]
 * @param {Array} existingPins - Existing intervention pins
 * @param {number} minDistanceKm - Minimum distance to consider non-redundant
 * @returns {boolean}
 */
export function isRedundantPlacement(position, existingPins, minDistanceKm = 0.5) {
  if (!existingPins || existingPins.length === 0) return false;

  return existingPins.some((pin) => {
    const distance = haversineDistance(
      position[0],
      position[1],
      pin.position[0],
      pin.position[1]
    );
    return distance < minDistanceKm;
  });
}

/**
 * Find nearest uncovered high-risk grid to a position
 * @param {Array} position - [lat, lng]
 * @param {Array} grids - All grid features
 * @param {Set} coveredGridIds - Covered grid IDs
 * @returns {Object|null} Nearest uncovered grid or null
 */
export function findNearestUncoveredGrid(position, grids, coveredGridIds) {
  if (!grids || grids.length === 0) return null;

  let nearest = null;
  let minDistance = Infinity;

  grids.forEach((grid) => {
    if (coveredGridIds?.has(grid.properties.id)) return;

    const [gridLng, gridLat] = grid.geometry.coordinates;
    const distance = haversineDistance(
      position[0],
      position[1],
      gridLat,
      gridLng
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = grid;
    }
  });

  return nearest;
}

/**
 * Calculate diversity score for recommendations
 * Ensures recommendations are spread out geographically
 * @param {Array} recommendations - Array of recommendations
 * @returns {Array} Recommendations with diversity penalty applied
 */
export function diversifyRecommendations(recommendations) {
  if (recommendations.length <= 1) return recommendations;

  const diversified = [recommendations[0]]; // Always include top recommendation

  for (let i = 1; i < recommendations.length; i++) {
    const rec = recommendations[i];
    let tooClose = false;

    // Check if too close to already selected recommendations
    for (const selected of diversified) {
      const distance = haversineDistance(
        rec.position[0],
        rec.position[1],
        selected.position[0],
        selected.position[1]
      );

      if (distance < 0.3) {
        // 300m minimum spacing
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      diversified.push(rec);
    }

    if (diversified.length >= 5) break;
  }

  return diversified;
}
