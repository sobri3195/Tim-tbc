export function computeCentroid(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point") {
    const [lng, lat] = geometry.coordinates || [];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return [lat, lng];
  }

  if (geometry.type === "Polygon") {
    return centroidForPolygon(geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return centroidForMultiPolygon(geometry.coordinates);
  }

  return null;
}

export function buildCentroidById(areas) {
  if (!areas?.features?.length) return {};
  const result = {};
  areas.features.forEach((feature) => {
    const id = feature.properties?.id;
    if (!id) return;
    const centroid = computeCentroid(feature.geometry);
    if (centroid) result[id] = centroid;
  });
  return result;
}

function centroidForPolygon(rings) {
  if (!Array.isArray(rings) || !rings.length) return null;
  return centroidForRing(rings[0]);
}

function centroidForMultiPolygon(polygons) {
  if (!Array.isArray(polygons) || !polygons.length) return null;
  let totalArea = 0;
  let sumLng = 0;
  let sumLat = 0;
  polygons.forEach((polygon) => {
    if (!polygon?.length) return;
    const { centroid, area } = centroidWithArea(polygon[0]);
    if (!centroid || !Number.isFinite(area)) return;
    totalArea += Math.abs(area);
    sumLng += centroid[1] * Math.abs(area);
    sumLat += centroid[0] * Math.abs(area);
  });

  if (!totalArea) return null;
  return [sumLat / totalArea, sumLng / totalArea];
}

function centroidWithArea(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return { centroid: null, area: 0 };
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const f = x0 * y1 - x1 * y0;
    twiceArea += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }

  if (!twiceArea) {
    const avg = ring.reduce(
      (acc, coord) => {
        acc[0] += coord[0];
        acc[1] += coord[1];
        return acc;
      },
      [0, 0],
    );
    const count = ring.length || 1;
    return { centroid: [avg[1] / count, avg[0] / count], area: 0 };
  }

  const area = twiceArea / 2;
  const centroidLng = cx / (3 * twiceArea);
  const centroidLat = cy / (3 * twiceArea);
  return { centroid: [centroidLat, centroidLng], area };
}

function centroidForRing(ring) {
  const { centroid } = centroidWithArea(ring);
  return centroid;
}
