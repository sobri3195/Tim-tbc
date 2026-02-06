import { MapContainer, TileLayer } from "react-leaflet";
import { useMemo } from "react";
import FlowLayer from "./FlowLayer.jsx";
import ImportRiskLayer from "./ImportRiskLayer.jsx";
import MapResizeHandler from "./MapResizeHandler.jsx";

export default function MapView({
  areas,
  centroidById,
  flows,
  importRiskById,
  layers,
  activeAreaId,
  onHoverArea,
  onSelectArea,
  selectedFlow,
  flowsEmpty,
}) {
  const center = [-5.15, 119.42];
  const zoom = 12;

  const hasFlows = useMemo(() => flows?.length > 0, [flows]);

  return (
    <div className="h-full w-full relative">
      <MapContainer className="h-full w-full" center={center} zoom={zoom} scrollWheelZoom>
        <MapResizeHandler />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {layers.importRisk && (
          <ImportRiskLayer
            areas={areas}
            importRiskById={importRiskById}
            activeAreaId={activeAreaId}
            onHoverArea={onHoverArea}
            onSelectArea={onSelectArea}
          />
        )}

        {layers.flowArcs && hasFlows && (
          <FlowLayer flows={flows} centroidById={centroidById} selectedFlow={selectedFlow} />
        )}
      </MapContainer>

      {!areas && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <div className="text-sm text-slate-700">Memuat data peta…</div>
        </div>
      )}

      {layers.flowArcs && flowsEmpty && areas && (
        <div className="absolute right-4 bottom-4 rounded border bg-white/90 p-3 text-xs text-slate-700 shadow">
          Tidak ada flow agregat untuk timeKey ini.
        </div>
      )}
    </div>
  );
}
