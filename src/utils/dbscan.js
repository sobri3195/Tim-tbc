import { convexHull, hullToFeature } from "./hull.js";

const KM_PER_DEG_LAT = 110.574;

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function toKmCoords(lat, lng) {
  const kmPerDegLng = 111.32 * Math.cos((lat * Math.PI) / 180);
  return {
    x: lng * kmPerDegLng,
    y: lat * KM_PER_DEG_LAT,
  };
}

export function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function buildSpatialHash(points, epsKm) {
  const hash = new Map();
  const cellSize = epsKm;

  points.forEach((p, idx) => {
    const { x, y } = toKmCoords(p.lat, p.lng);
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);
    const key = `${cellX}:${cellY}`;
    if (!hash.has(key)) hash.set(key, []);
    hash.get(key).push(idx);
  });

  return hash;
}

function getNeighborCandidates(point, hash, epsKm) {
  const { x, y } = toKmCoords(point.lat, point.lng);
  const cellSize = epsKm;
  const cellX = Math.floor(x / cellSize);
  const cellY = Math.floor(y / cellSize);
  const candidates = [];

  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      const key = `${cellX + dx}:${cellY + dy}`;
      if (hash.has(key)) {
        candidates.push(...hash.get(key));
      }
    }
  }

  return candidates;
}

function regionQuery(points, index, hash, epsKm) {
  const point = points[index];
  const candidates = getNeighborCandidates(point, hash, epsKm);
  const neighbors = [];

  candidates.forEach((idx) => {
    if (haversineKm(point, points[idx]) <= epsKm) {
      neighbors.push(idx);
    }
  });

  return neighbors;
}

function computeClusterStats(points, minPts) {
  const pointCount = points.length;
  const sumRisk = points.reduce((acc, p) => acc + (p.risk || 0), 0);
  const sumSuspect = points.reduce((acc, p) => acc + (p.suspectVisits || 0), 0);
  const sumDiag = points.reduce((acc, p) => acc + (p.tbDiagnosed || 0), 0);
  const sumVisits = points.reduce((acc, p) => acc + (p.facilityVisits || 0), 0);
  const avgRisk = pointCount ? sumRisk / pointCount : 0;
  const gapIndex = sumSuspect ? (sumSuspect - sumDiag) / Math.max(1, sumSuspect) : 0;
  const densityScore = clamp01(pointCount / Math.max(minPts * 2, 1));
  const confidence = clamp01(0.45 * avgRisk + 0.35 * gapIndex + 0.2 * densityScore);

  return {
    pointCount,
    avgRisk,
    sumSuspect,
    sumDiag,
    sumVisits,
    gapIndex,
    densityScore,
    confidence,
  };
}

function computeCentroid(points) {
  if (!points.length) return null;
  const total = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );
  return [total.lat / points.length, total.lng / points.length];
}

export function runDbscan(points, epsKm, minPts) {
  if (!points.length) return [];

  const clusters = [];
  const visited = new Set();
  const assigned = new Set();
  const hash = buildSpatialHash(points, epsKm);
  let clusterId = 1;

  for (let i = 0; i < points.length; i += 1) {
    if (visited.has(i)) continue;
    visited.add(i);

    const neighbors = regionQuery(points, i, hash, epsKm);
    if (neighbors.length < minPts) continue;

    const clusterIndices = [];
    const queue = [...neighbors];
    const queued = new Set(queue);

    while (queue.length) {
      const idx = queue.shift();
      queued.delete(idx);

      if (!visited.has(idx)) {
        visited.add(idx);
        const nextNeighbors = regionQuery(points, idx, hash, epsKm);
        if (nextNeighbors.length >= minPts) {
          nextNeighbors.forEach((n) => {
            if (!queued.has(n)) {
              queue.push(n);
              queued.add(n);
            }
          });
        }
      }

      if (!assigned.has(idx)) {
        assigned.add(idx);
        clusterIndices.push(idx);
      }
    }

    const clusterPoints = clusterIndices.map((idx) => points[idx]);
    const stats = computeClusterStats(clusterPoints, minPts);
    const hullCoords = convexHull(clusterPoints.map((p) => [p.lng, p.lat]));
    const centroid = computeCentroid(clusterPoints);

    clusters.push({
      id: clusterId,
      points: clusterPoints,
      hullPolygon: hullToFeature(hullCoords),
      centroid,
      stats,
      explainability: {
        gap: stats.sumSuspect - stats.sumDiag,
        density: stats.pointCount,
        visits: stats.sumVisits,
        epsKm,
      },
    });

    clusterId += 1;
  }

  return clusters;
}
