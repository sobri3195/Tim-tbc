import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Pin icons by intervention type
const PIN_ICONS = {
  Screening: new L.DivIcon({
    className: "custom-pin",
    html: `<div style="
      width: 32px;
      height: 32px;
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    "><span style="transform: rotate(45deg); font-size: 14px;">🔍</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  Edukasi: new L.DivIcon({
    className: "custom-pin",
    html: `<div style="
      width: 32px;
      height: 32px;
      background: #10b981;
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    "><span style="transform: rotate(45deg); font-size: 14px;">📚</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  Tracing: new L.DivIcon({
    className: "custom-pin",
    html: `<div style="
      width: 32px;
      height: 32px;
      background: #f59e0b;
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    "><span style="transform: rotate(45deg); font-size: 14px;">👣</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
};

// Recommendation icon
const RECOMMENDATION_ICON = new L.DivIcon({
  className: "custom-recommendation",
  html: `<div style="
    width: 28px;
    height: 28px;
    background: #8b5cf6;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 2s infinite;
  "><span style="font-size: 12px; color: white;">⭐</span></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

// Click handler component for planning mode
function MapClickHandler({ mode, onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (mode === "planning") {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

// Zoom to pin handler
function ZoomController({ zoomTarget, onZoomComplete }) {
  const map = useMap();
  const prevTargetRef = useRef(null);

  useEffect(() => {
    if (zoomTarget && zoomTarget !== prevTargetRef.current) {
      const [lat, lng] = zoomTarget.position || zoomTarget;
      map.setView([lat, lng], 16, { animate: true, duration: 0.5 });
      prevTargetRef.current = zoomTarget;
      setTimeout(() => onZoomComplete?.(), 600);
    }
  }, [zoomTarget, map, onZoomComplete]);

  return null;
}

export default function PlannerLayer({
  // Mode
  mode,

  // Data
  grids,
  timeseriesData,
  timeKey,

  // Pins
  pins,
  selectedPinId,
  onSelectPin,
  onAddPin,
  onRemovePin,

  // Coverage visualization
  showCoverage,
  coverageSets,

  // Recommendations
  recommendations,
  highlightedRecommendation,
  onAcceptRecommendation,

  // Zoom control
  zoomTarget,
  onZoomComplete,
}) {
  const [popupOpenId, setPopupOpenId] = useState(null);

  // Get timeseries snapshot
  const snapshot = useMemo(() => timeseriesData?.[timeKey] || {}, [timeseriesData, timeKey]);

  // Handle map click in planning mode
  const handleMapClick = (position) => {
    if (mode === "planning") {
      onAddPin?.({
        position,
        type: "Screening",
        radiusKm: 1,
      });
    }
  };

  // Get coverage color for grid
  const getGridColor = (gridId) => {
    if (!showCoverage || !coverageSets) return null;
    if (coverageSets.covered?.has(gridId)) return "#22c55e"; // Green for covered
    if (coverageSets.uncovered?.has(gridId)) return "#ef4444"; // Red for uncovered
    return null;
  };

  // Get risk score for grid
  const getRiskScore = (gridId) => {
    const gridData = snapshot[gridId];
    if (!gridData) return 0;

    const suspectRate = Math.min((gridData.suspectVisits || 0) / 30, 1);
    const diagnosisRate = Math.min((gridData.tbDiagnosed || 0) / 6, 1);
    const visitRate = Math.min((gridData.facilityVisits || 0) / 100, 1);

    return suspectRate * 0.4 + diagnosisRate * 0.4 + visitRate * 0.2;
  };

  // Get grid fill color based on risk and coverage
  const getGridFillColor = (gridId) => {
    if (showCoverage && coverageSets) {
      if (coverageSets.covered?.has(gridId)) {
        return "rgba(34, 197, 94, 0.4)"; // Green with transparency
      }
      if (coverageSets.uncovered?.has(gridId)) {
        const risk = getRiskScore(gridId);
        if (risk > 0.7) return "rgba(239, 68, 68, 0.5)"; // High risk uncovered
        if (risk > 0.4) return "rgba(249, 115, 22, 0.4)"; // Medium risk uncovered
        return "rgba(156, 163, 175, 0.3)"; // Low risk uncovered
      }
    }

    // Risk-only coloring when coverage not shown
    const risk = getRiskScore(gridId);
    if (risk > 0.7) return "rgba(239, 68, 68, 0.4)";
    if (risk > 0.4) return "rgba(249, 115, 22, 0.3)";
    return "rgba(156, 163, 175, 0.2)";
  };

  // Get type label
  const getTypeLabel = (type) => {
    const labels = { Screening: "Screening", Edukasi: "Edukasi", Tracing: "Tracing" };
    return labels[type] || type;
  };

  // Get type color
  const getTypeColor = (type) => {
    const colors = { Screening: "#3b82f6", Edukasi: "#10b981", Tracing: "#f59e0b" };
    return colors[type] || "#6b7280";
  };

  return (
    <>
      {/* Map click handler */}
      <MapClickHandler mode={mode} onMapClick={handleMapClick} />

      {/* Zoom controller */}
      <ZoomController zoomTarget={zoomTarget} onZoomComplete={onZoomComplete} />

      {/* Grid coverage layer */}
      {grids?.map((grid) => {
        const gridId = grid.properties.id;
        const [lng, lat] = grid.geometry.coordinates;
        const fillColor = getGridFillColor(gridId);
        const isHighlighted = highlightedRecommendation?.gridId === gridId;

        return (
          <Circle
            key={gridId}
            center={[lat, lng]}
            radius={200} // 200m radius for grid visualization
            pathOptions={{
              fillColor: isHighlighted ? "#8b5cf6" : fillColor,
              fillOpacity: isHighlighted ? 0.7 : showCoverage ? 0.5 : 0.3,
              color: isHighlighted ? "#7c3aed" : getGridColor(gridId) || "#9ca3af",
              weight: isHighlighted ? 3 : 1,
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{gridId}</p>
                <p className="text-slate-600">
                  Risiko: {(getRiskScore(gridId) * 100).toFixed(0)}%
                </p>
                {coverageSets && (
                  <p className={coverageSets.covered?.has(gridId) ? "text-green-600" : "text-red-600"}>
                    {coverageSets.covered?.has(gridId) ? "✓ Tercakup" : "✗ Belum tercakup"}
                  </p>
                )}
                {snapshot[gridId] && (
                  <div className="mt-2 text-xs text-slate-500">
                    <p>Kunjungan batuk: {snapshot[gridId].suspectVisits}</p>
                    <p>Diagnosis TBC: {snapshot[gridId].tbDiagnosed}</p>
                    <p>Kepadatan: {(snapshot[gridId].densityIdx * 100).toFixed(0)}%</p>
                  </div>
                )}
              </div>
            </Popup>
          </Circle>
        );
      })}

      {/* Intervention pins */}
      {pins.map((pin) => {
        const isSelected = selectedPinId === pin.id;
        const isPopupOpen = popupOpenId === pin.id;

        return (
          <div key={pin.id}>
            {/* Coverage circle */}
            <Circle
              center={pin.position}
              radius={pin.radiusKm * 1000} // Convert km to meters
              pathOptions={{
                fillColor: getTypeColor(pin.type),
                fillOpacity: 0.15,
                color: getTypeColor(pin.type),
                weight: isSelected ? 3 : 2,
                dashArray: pin.travelTimeMinutes ? "5, 5" : null,
              }}
            />

            {/* Pin marker */}
            <Marker
              position={pin.position}
              icon={PIN_ICONS[pin.type] || PIN_ICONS.Screening}
              eventHandlers={{
                click: () => {
                  onSelectPin(pin.id);
                  setPopupOpenId(pin.id);
                },
                popupclose: () => setPopupOpenId(null),
              }}
            >
              <Popup>
                <div className="text-sm min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: getTypeColor(pin.type) }}
                    >
                      {pin.type === "Screening" && "🔍"}
                      {pin.type === "Edukasi" && "📚"}
                      {pin.type === "Tracing" && "👣"}
                    </span>
                    <span className="font-semibold">{getTypeLabel(pin.type)}</span>
                  </div>

                  <div className="space-y-1 text-slate-600">
                    <p>📍 {pin.position[0].toFixed(4)}, {pin.position[1].toFixed(4)}</p>
                    <p>⭕ Radius: {pin.radiusKm} km</p>
                    {pin.travelTimeMinutes && <p>⏱️ Waktu tempuh: {pin.travelTimeMinutes} menit</p>}
                    {pin.notes && (
                      <p className="mt-2 p-2 bg-slate-50 rounded text-xs">{pin.notes}</p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onRemovePin(pin.id)}
                      className="flex-1 py-1.5 px-3 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 transition"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          </div>
        );
      })}

      {/* Recommendation markers */}
      {recommendations?.map((rec) => {
        const isHighlighted = highlightedRecommendation?.gridId === rec.gridId;

        return (
          <Marker
            key={`rec-${rec.gridId}`}
            position={rec.position}
            icon={RECOMMENDATION_ICON}
            opacity={isHighlighted ? 1 : 0.7}
            zIndexOffset={isHighlighted ? 1000 : 0}
            eventHandlers={{
              click: () => onAcceptRecommendation?.(rec),
            }}
          >
            <Popup>
              <div className="text-sm min-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                    {rec.rank}
                  </span>
                  <span className="font-semibold">Rekomendasi #{rec.rank}</span>
                </div>

                <p className="text-slate-600 mb-2">{rec.reason}</p>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-slate-50 rounded p-2">
                    <p className="text-slate-500">Skor</p>
                    <p className="font-semibold text-purple-600">{rec.score.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <p className="text-slate-500">Risiko</p>
                    <p className="font-semibold text-red-600">{(rec.risk * 100).toFixed(0)}%</p>
                  </div>
                </div>

                <button
                  onClick={() => onAcceptRecommendation?.(rec)}
                  className="w-full py-2 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition"
                >
                  ➕ Tambah Pin di Sini
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Planning mode cursor indicator */}
      {mode === "planning" && (
        <style>{`
          .leaflet-container {
            cursor: crosshair !important;
          }
        `}</style>
      )}
    </>
  );
}
