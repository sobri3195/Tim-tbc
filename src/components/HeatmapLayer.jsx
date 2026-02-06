import { useMemo } from "react";
import { CircleMarker, LayerGroup, Tooltip } from "react-leaflet";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getHeatColor = (value) => {
  const hue = clamp(120 - value * 120, 0, 120);
  return `hsl(${hue}, 80%, 45%)`;
};

export default function HeatmapLayer({ points }) {
  const maxGap = useMemo(() => {
    return Math.max(0, ...points.map((point) => point.gap || 0));
  }, [points]);

  return (
    <LayerGroup>
      {points.map((point) => {
        const intensity = maxGap ? point.gap / maxGap : 0;
        const radius = 8 + intensity * 12;
        const color = getHeatColor(intensity);
        return (
          <CircleMarker
            key={point.id}
            center={point.position}
            radius={radius}
            color={color}
            fillColor={color}
            fillOpacity={0.35 + intensity * 0.35}
            weight={1}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.9}>
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-800">{point.kelurahan}</p>
                <p>ID Grid: {point.id}</p>
                <p>Suspek: {point.suspectVisits}</p>
                <p>Diagnosis: {point.tbDiagnosed}</p>
                <p>Gap: {point.gap} ({(point.gapRate * 100).toFixed(1)}%)</p>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </LayerGroup>
  );
}
