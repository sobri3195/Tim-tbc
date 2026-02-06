import { Polygon, Popup } from "react-leaflet";

export default function AreaLayer({ areas, onHoverArea, onSelectArea, activeAreaId }) {
  if (!areas?.features) return null;

  return (
    <>
      {areas.features.map((area) => {
        const id = area.properties?.id;
        const isActive = id === activeAreaId;

        // Handle different geometry types
        const coords = area.geometry?.coordinates;
        if (!coords) return null;

        // For Polygon
        let positions;
        if (area.geometry.type === "Polygon") {
          positions = coords[0].map(([lng, lat]) => [lat, lng]);
        } else {
          return null;
        }

        return (
          <Polygon
            key={id}
            positions={positions}
            pathOptions={{
              fillColor: isActive ? "#3b82f6" : "#e2e8f0",
              fillOpacity: isActive ? 0.3 : 0.2,
              color: isActive ? "#2563eb" : "#94a3b8",
              weight: isActive ? 2 : 1,
            }}
            eventHandlers={{
              mouseover: () => onHoverArea?.(id),
              mouseout: () => onHoverArea?.(null),
              click: () => onSelectArea?.(id),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{area.properties?.name || id}</p>
                <p className="text-slate-600">Wilayah administratif</p>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
}
