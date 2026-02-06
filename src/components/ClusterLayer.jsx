import { CircleMarker, GeoJSON, Tooltip, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import L from "leaflet";

function riskColor(risk) {
  if (risk >= 0.8) return "#7f1d1d";
  if (risk >= 0.6) return "#b91c1c";
  if (risk >= 0.4) return "#ef4444";
  if (risk >= 0.2) return "#fca5a5";
  return "#fecaca";
}

function formatExplainability(cluster) {
  const { explainability, stats } = cluster;
  return (
    `Kenapa cluster ini terdeteksi?\n` +
    `• Gap suspect vs diagnosis: ${explainability.gap}\n` +
    `• Kepadatan: ${stats.pointCount} titik (eps ${explainability.epsKm} km)\n` +
    `• Kunjungan fasilitas: ${explainability.visits}`
  );
}

export default function ClusterLayer({
  candidates = [],
  clusters = [],
  showPoints,
  showHulls,
  selectedClusterId,
  onSelectCluster,
}) {
  const map = useMap();

  const bounds = useMemo(() => {
    if (!clusters.length) return null;
    const selected = clusters.find((c) => c.id === selectedClusterId);
    if (!selected) return null;

    if (selected.hullPolygon?.geometry?.coordinates?.length) {
      const ring = selected.hullPolygon.geometry.coordinates[0];
      return L.latLngBounds(ring.map((coord) => [coord[1], coord[0]]));
    }

    return L.latLngBounds(selected.points.map((p) => [p.lat, p.lng]));
  }, [clusters, selectedClusterId]);

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [bounds, map]);

  return (
    <>
      {showHulls &&
        clusters.map((cluster) => {
          if (!cluster.hullPolygon) return null;
          const isSelected = cluster.id === selectedClusterId;
          return (
            <GeoJSON
              key={`cluster-${cluster.id}`}
              data={cluster.hullPolygon}
              style={() => ({
                color: isSelected ? "#0f172a" : "#dc2626",
                weight: isSelected ? 3 : 2,
                fillColor: isSelected ? "#f97316" : "#fca5a5",
                fillOpacity: 0.35,
              })}
              eventHandlers={{
                click: () => onSelectCluster(cluster.id),
              }}
            >
              <Tooltip direction="center" opacity={1} sticky>
                <div className="text-xs whitespace-pre-line">
                  <div className="font-semibold">Cluster #{cluster.id}</div>
                  <div>{formatExplainability(cluster)}</div>
                </div>
              </Tooltip>
            </GeoJSON>
          );
        })}

      {showPoints &&
        candidates.map((p) => {
          const isSelected = selectedClusterId && p.clusterId === selectedClusterId;
          return (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={isSelected ? 6 : 4}
              pathOptions={{
                color: isSelected ? "#0f172a" : "#7f1d1d",
                fillColor: riskColor(p.risk),
                fillOpacity: 0.8,
                weight: 1,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <div className="text-xs">
                  <div className="font-semibold">Grid {p.id}</div>
                  <div>Risk: {p.risk.toFixed(2)}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
    </>
  );
}
