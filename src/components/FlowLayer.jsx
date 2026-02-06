import { Polyline, Tooltip } from "react-leaflet";
import { useMemo } from "react";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

const buildArc = (from, to, curveStrength) => {
  if (!from || !to) return null;
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (!distance) return [from, to];
  const offset = distance * curveStrength;
  const normX = -dy / distance;
  const normY = dx / distance;
  const curveLat = midLat + normY * offset;
  const curveLng = midLng + normX * offset;
  return [from, [curveLat, curveLng], to];
};

export default function FlowLayer({ flows, centroidById, selectedFlow }) {
  const maxVolume = useMemo(
    () => Math.max(0, ...flows.map((flow) => flow.volume || 0)),
    [flows],
  );

  const arcs = useMemo(
    () =>
      flows
        .map((flow, index) => {
          const from = centroidById?.[flow.from];
          const to = centroidById?.[flow.to];
          if (!from || !to) return null;
          const hash = hashString(`${flow.from}-${flow.to}`);
          const direction = hash % 2 === 0 ? 1 : -1;
          const curveStrength = clamp(0.18 + (index % 3) * 0.05, 0.12, 0.35) * direction;
          const positions = buildArc(from, to, curveStrength);
          const weight = maxVolume ? clamp(1 + (flow.volume / maxVolume) * 6, 1, 8) : 2;
          const isSelected =
            selectedFlow && flow.from === selectedFlow.from && flow.to === selectedFlow.to;
          return {
            key: `${flow.from}-${flow.to}-${index}`,
            flow,
            positions,
            weight: isSelected ? weight + 2 : weight,
            color: isSelected ? "#f97316" : "#2563eb",
            opacity: isSelected ? 0.95 : 0.7,
          };
        })
        .filter(Boolean),
    [flows, centroidById, maxVolume, selectedFlow],
  );

  return arcs.map((arc) => (
    <Polyline
      key={arc.key}
      positions={arc.positions}
      pathOptions={{ weight: arc.weight, color: arc.color, opacity: arc.opacity }}
    >
      <Tooltip sticky>
        <div className="text-xs">
          <div className="font-semibold">Mobilitas agregat</div>
          <div>
            {arc.flow.from} → {arc.flow.to}
          </div>
          <div>Volume: {arc.flow.volume}</div>
        </div>
      </Tooltip>
    </Polyline>
  ));
}
