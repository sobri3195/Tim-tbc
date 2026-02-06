import { MapContainer, TileLayer, GeoJSON, CircleMarker, Polyline, Tooltip } from "react-leaflet";
import { useMemo, useState } from "react";
import Legend from "./Legend.jsx";

function riskToColor(risk) {
  // sederhana: 0..1
  if (risk >= 0.8) return "#7f1d1d";
  if (risk >= 0.6) return "#b91c1c";
  if (risk >= 0.4) return "#ef4444";
  if (risk >= 0.2) return "#fca5a5";
  return "#fee2e2";
}

export default function MapView({ areas, facilities, flows, timeKey, layers, filters }) {
  const [selected, setSelected] = useState(null);

  const center = [-5.15, 119.42]; // Makassar-ish (placeholder)
  const zoom = 12;

  const areaLayer = useMemo(() => {
    if (!areas) return null;
    return {
      ...areas,
      features: areas.features.filter((f) => (f.properties?.risk ?? 0) >= filters.minRisk),
    };
  }, [areas, filters.minRisk]);

  const filteredFlows = useMemo(() => {
    return (flows || []).filter((x) => x.t === timeKey && (x.volume || 0) >= filters.minVolume);
  }, [flows, timeKey, filters.minVolume]);

  return (
    <div className="h-full w-full relative">
      <MapContainer className="h-full w-full" center={center} zoom={zoom} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {layers.choropleth && areaLayer && (
          <GeoJSON
            data={areaLayer}
            style={(feature) => ({
              color: "#334155",
              weight: 1,
              fillColor: riskToColor(feature.properties?.risk ?? 0),
              fillOpacity: 0.75,
            })}
            eventHandlers={{
              click: (e) => {
                const f = e.propagatedFrom?.feature;
                if (f) setSelected(f);
              },
            }}
          />
        )}

        {layers.facilities && facilities?.features?.map((f) => {
          const [lng, lat] = f.geometry.coordinates; // GeoJSON point: [lng, lat]
          return (
            <CircleMarker key={f.properties?.id} center={[lat, lng]} radius={6} pathOptions={{ color: "#0f172a" }}>
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <div className="text-xs">
                  <div className="font-semibold">{f.properties?.name}</div>
                  <div>{f.properties?.type || "Faskes"}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {layers.flows && filteredFlows.map((flow, idx) => {
          // Tanpa backend, kita belum hitung centroid dinamis.
          // Untuk demo: gunakan lat/lng dummy jika belum tersedia.
          // Saat data nyata, simpan centroid per area, lalu ambil dari map.
          const from = [-5.145 + (idx * 0.002), 119.41 + (idx * 0.002)];
          const to = [-5.155 + (idx * 0.002), 119.43 + (idx * 0.002)];
          return (
            <Polyline
              key={`${flow.from}-${flow.to}-${idx}`}
              positions={[from, to]}
              pathOptions={{ weight: Math.max(2, Math.min(8, (flow.volume || 0) / 50)), opacity: 0.7 }}
            >
              <Tooltip>
                <div className="text-xs">
                  <div className="font-semibold">Mobilitas agregat</div>
                  <div>{flow.from} → {flow.to}</div>
                  <div>Volume: {flow.volume}</div>
                </div>
              </Tooltip>
            </Polyline>
          );
        })}
      </MapContainer>

      <Legend selected={selected} />

      {!areas && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <div className="text-sm text-slate-700">Memuat data peta…</div>
        </div>
      )}
    </div>
  );
}
