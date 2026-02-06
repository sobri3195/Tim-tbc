import { GeoJSON } from "react-leaflet";

const riskColors = ["#ecfeff", "#a5f3fc", "#38bdf8", "#0ea5e9", "#075985"];

const riskToColor = (risk) => {
  if (risk >= 0.8) return riskColors[4];
  if (risk >= 0.6) return riskColors[3];
  if (risk >= 0.4) return riskColors[2];
  if (risk >= 0.2) return riskColors[1];
  return riskColors[0];
};

export default function ImportRiskLayer({
  areas,
  importRiskById,
  activeAreaId,
  onHoverArea,
  onSelectArea,
}) {
  if (!areas) return null;

  return (
    <GeoJSON
      data={areas}
      style={(feature) => {
        const id = feature.properties?.id;
        const risk = importRiskById?.[id] ?? 0;
        const isActive = activeAreaId && id === activeAreaId;
        return {
          color: isActive ? "#0f172a" : "#1e293b",
          weight: isActive ? 2.5 : 1,
          fillColor: riskToColor(risk),
          fillOpacity: 0.75,
        };
      }}
      eventHandlers={{
        mouseover: (event) => {
          const feature = event.propagatedFrom?.feature || event.sourceTarget?.feature;
          if (feature?.properties?.id) onHoverArea?.(feature.properties.id);
        },
        mouseout: () => onHoverArea?.(null),
        click: (event) => {
          const feature = event.propagatedFrom?.feature || event.sourceTarget?.feature;
          if (feature?.properties?.id) onSelectArea?.(feature.properties.id);
        },
      }}
    />
  );
}
