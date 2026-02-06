import { useMemo, useState } from "react";
import { Circle, GeoJSON, MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import regions from "./data/regions.json";
import grids from "./data/grids.json";
import flows from "./data/flows.json";
import facilities from "./data/facilities.json";
import timeseries from "./data/timeseries.json";

const VIEWS = {
  overview: "Overview Map",
  cluster: "Cluster Explorer",
  facility: "Facility View",
};

const clusterLegend = [
  { label: "Rendah", color: "#b7e4c7" },
  { label: "Sedang", color: "#52b788" },
  { label: "Tinggi", color: "#2d6a4f" },
];

const riskLegend = [
  { label: "0 - 0.4", color: "#dbe7ff" },
  { label: "0.41 - 0.7", color: "#7aa2ff" },
  { label: "0.71+", color: "#2f4b7c" },
];

const featureHighlights = [
  "Heatmap indeks hidden cluster berbasis agregasi kunjungan faskes.",
  "Overlay grid kelurahan dengan skor risiko mobilitas.",
  "Animasi aliran mobilitas (OD flows) antar grid per bulan.",
  "Layer catchment area fasilitas untuk melihat jangkauan layanan.",
  "Filtering intensitas flow untuk menyorot koridor mobilitas kuat.",
  "Drill-down region ke kelurahan dengan klik polygon.",
  "Tooltip statistik agregat pada hover wilayah dan grid.",
  "Perbandingan tren kunjungan TBC per wilayah di panel samping.",
  "Highlight wilayah dengan gap tinggi antara suspek dan diagnosis.",
  "Mode eksplorasi fasilitas dengan marker dan ring prioritas.",
];

const getClusterColor = (value) => {
  if (value >= 75) return "#2d6a4f";
  if (value >= 55) return "#52b788";
  return "#b7e4c7";
};

const getRiskColor = (value) => {
  if (value >= 0.71) return "#2f4b7c";
  if (value >= 0.41) return "#7aa2ff";
  return "#dbe7ff";
};

const formatMonth = (month) => {
  const [year, mm] = month.split("-");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${monthNames[Number(mm) - 1]} ${year}`;
};

export default function App() {
  const [view, setView] = useState("overview");
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [showGridLayer, setShowGridLayer] = useState(true);
  const [showFlowLayer, setShowFlowLayer] = useState(true);
  const [showFacilityLayer, setShowFacilityLayer] = useState(true);
  const [flowThreshold, setFlowThreshold] = useState(60);
  const [clusterThreshold, setClusterThreshold] = useState(50);
  const [activeMonthIndex, setActiveMonthIndex] = useState(0);

  const activeMonth = timeseries.months[activeMonthIndex];

  const filteredFlows = useMemo(() => {
    return flows.filter((flow) => flow.month === activeMonth && flow.value >= flowThreshold);
  }, [activeMonth, flowThreshold]);

  const filteredRegions = useMemo(() => {
    return {
      ...regions,
      features: regions.features.filter(
        (feature) => feature.properties.hiddenClusterIndex >= clusterThreshold
      ),
    };
  }, [clusterThreshold]);

  const regionStats = useMemo(() => {
    if (!selectedRegion) return null;
    const entry = timeseries.regions.find((region) => region.regionId === selectedRegion.id);
    return entry?.series || null;
  }, [selectedRegion]);

  const mapCenter = [-6.13, 106.83];

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">TBC Hidden Cluster Map</p>
          <h1>Deteksi Klaster TBC Tak Terlapor</h1>
        </div>
        <nav className="view-switcher">
          {Object.entries(VIEWS).map(([key, label]) => (
            <button
              key={key}
              className={view === key ? "active" : ""}
              onClick={() => setView(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="main">
        <aside className="sidebar">
          <section className="panel">
            <h2>{VIEWS[view]}</h2>
            <p className="microcopy">
              Semua layer menggunakan data agregat. Tidak ada data individu atau alamat personal.
            </p>
            <div className="alert">
              <strong>Peringatan Privasi</strong>
              <p>
                Data disajikan dalam agregat grid/kelurahan. Hindari mengekspor layer untuk analisis
                individu.
              </p>
            </div>
          </section>

          {view === "overview" && (
            <>
              <section className="panel">
                <h3>Filter Hidden Cluster</h3>
                <label className="slider-label">
                  Ambang indeks: <strong>{clusterThreshold}</strong>
                </label>
                <input
                  type="range"
                  min="30"
                  max="90"
                  value={clusterThreshold}
                  onChange={(event) => setClusterThreshold(Number(event.target.value))}
                />
              </section>

              <section className="panel">
                <h3>Layer Switcher</h3>
                <label title="Choropleth indeks hidden cluster per kecamatan (agregat).">
                  <input type="checkbox" checked readOnly />
                  Hidden Cluster Index
                </label>
                <label title="Grid kelurahan untuk melihat risiko mobilitas." className="toggle">
                  <input
                    type="checkbox"
                    checked={showGridLayer}
                    onChange={(event) => setShowGridLayer(event.target.checked)}
                  />
                  Grid Risiko Mobilitas
                </label>
              </section>

              <section className="panel">
                <h3>Legend</h3>
                <div className="legend">
                  {clusterLegend.map((item) => (
                    <div key={item.label} className="legend-item">
                      <span style={{ background: item.color }} />
                      {item.label}
                    </div>
                  ))}
                </div>
                {showGridLayer && (
                  <div className="legend">
                    {riskLegend.map((item) => (
                      <div key={item.label} className="legend-item">
                        <span style={{ background: item.color }} />
                        {item.label}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="panel">
                <h3>Ringkasan Wilayah</h3>
                {selectedRegion ? (
                  <div className="card">
                    <h4>{selectedRegion.name}</h4>
                    <p>Indeks hidden cluster: {selectedRegion.hiddenClusterIndex}</p>
                    <p>Rasio notifikasi: {selectedRegion.notifRate}%</p>
                    <p>Suspek TBC: {selectedRegion.suspectedRate}%</p>
                  </div>
                ) : (
                  <p className="empty">
                    Klik wilayah di peta untuk melihat ringkasan. Jika belum ada, pilih salah satu
                    kecamatan yang berwarna gelap.
                  </p>
                )}
              </section>

              <section className="panel">
                <h3>Fitur Unggulan Berbasis Peta</h3>
                <ul className="feature-list">
                  {featureHighlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </>
          )}

          {view === "cluster" && (
            <>
              <section className="panel">
                <h3>Timeline Mobilitas</h3>
                <label className="slider-label">
                  Bulan aktif: <strong>{formatMonth(activeMonth)}</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max={timeseries.months.length - 1}
                  value={activeMonthIndex}
                  onChange={(event) => setActiveMonthIndex(Number(event.target.value))}
                />
              </section>

              <section className="panel">
                <h3>Filter Flow</h3>
                <label className="slider-label">
                  Minimum intensitas: <strong>{flowThreshold}</strong>
                </label>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={flowThreshold}
                  onChange={(event) => setFlowThreshold(Number(event.target.value))}
                />
              </section>

              <section className="panel">
                <h3>Layer Switcher</h3>
                <label title="Grid kelurahan untuk melihat skor risiko." className="toggle">
                  <input
                    type="checkbox"
                    checked={showGridLayer}
                    onChange={(event) => setShowGridLayer(event.target.checked)}
                  />
                  Grid Risiko
                </label>
                <label title="Flow mobilitas agregat antar grid (OD flows)." className="toggle">
                  <input
                    type="checkbox"
                    checked={showFlowLayer}
                    onChange={(event) => setShowFlowLayer(event.target.checked)}
                  />
                  Aliran Mobilitas
                </label>
              </section>

              <section className="panel">
                <h3>Insight Cluster</h3>
                {filteredFlows.length > 0 ? (
                  <ul className="stats-list">
                    {filteredFlows.map((flow) => (
                      <li key={flow.id}>
                        {flow.fromGrid} → {flow.toGrid} <span>{flow.value} perjalanan</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty">
                    Tidak ada flow yang memenuhi filter. Coba turunkan ambang intensitas atau pilih
                    bulan lain.
                  </p>
                )}
              </section>
            </>
          )}

          {view === "facility" && (
            <>
              <section className="panel">
                <h3>Layer Switcher</h3>
                <label title="Marker fasilitas kesehatan dengan agregasi kunjungan." className="toggle">
                  <input
                    type="checkbox"
                    checked={showFacilityLayer}
                    onChange={(event) => setShowFacilityLayer(event.target.checked)}
                  />
                  Fasilitas Kesehatan
                </label>
                <label title="Ring jangkauan pelayanan per fasilitas." className="toggle">
                  <input
                    type="checkbox"
                    checked={showGridLayer}
                    onChange={(event) => setShowGridLayer(event.target.checked)}
                  />
                  Area Layanan
                </label>
              </section>

              <section className="panel">
                <h3>Daftar Fasilitas</h3>
                <ul className="facility-list">
                  {facilities.map((facility) => (
                    <li key={facility.id}>
                      <button
                        type="button"
                        className={selectedFacility?.id === facility.id ? "active" : ""}
                        onClick={() => setSelectedFacility(facility)}
                      >
                        {facility.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="panel">
                <h3>Detail Kunjungan</h3>
                {selectedFacility ? (
                  <div className="card">
                    <h4>{selectedFacility.name}</h4>
                    <p>Tipe: {selectedFacility.type}</p>
                    <p>Kunjungan batuk kronis: {selectedFacility.visits.cough}</p>
                    <p>Suspek TBC: {selectedFacility.visits.suspect}</p>
                    <p>Diagnosis TBC: {selectedFacility.visits.diagnosis}</p>
                    <p>Mulai pengobatan: {selectedFacility.visits.treatment}</p>
                  </div>
                ) : (
                  <p className="empty">
                    Pilih salah satu fasilitas untuk melihat agregasi kunjungan dan jangkauan
                    layanan.
                  </p>
                )}
              </section>

              <section className="panel">
                <h3>Tren Wilayah</h3>
                {regionStats ? (
                  <ul className="stats-list">
                    {regionStats.map((item) => (
                      <li key={item.month}>
                        {formatMonth(item.month)}: {item.suspected} suspek → {item.diagnosis} diagnosis
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty">
                    Klik wilayah di Overview Map untuk memuat tren kunjungan faskes per bulan.
                  </p>
                )}
              </section>
            </>
          )}
        </aside>

        <section className="map-wrapper">
          <MapContainer center={mapCenter} zoom={12} scrollWheelZoom className="map">
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {view === "overview" && (
              <>
                <GeoJSON
                  data={filteredRegions}
                  style={(feature) => ({
                    color: "#1b4332",
                    weight: 1,
                    fillOpacity: 0.6,
                    fillColor: getClusterColor(feature.properties.hiddenClusterIndex),
                  })}
                  onEachFeature={(feature, layer) => {
                    layer.on({
                      click: () => setSelectedRegion(feature.properties),
                    });
                    layer.bindTooltip(
                      `${feature.properties.name}: indeks hidden cluster ${feature.properties.hiddenClusterIndex} (agregat)`,
                      { sticky: true }
                    );
                  }}
                />

                {showGridLayer && (
                  <GeoJSON
                    data={grids}
                    style={(feature) => ({
                      color: "#3a5a98",
                      weight: 0.5,
                      fillOpacity: 0.4,
                      fillColor: getRiskColor(feature.properties.riskScore),
                    })}
                    onEachFeature={(feature, layer) => {
                      layer.bindTooltip(
                        `Grid ${feature.properties.kelurahan}: skor risiko ${feature.properties.riskScore}`,
                        { sticky: true }
                      );
                    }}
                  />
                )}
              </>
            )}

            {view === "cluster" && (
              <>
                {showGridLayer && (
                  <GeoJSON
                    data={grids}
                    style={(feature) => ({
                      color: "#3a5a98",
                      weight: 0.5,
                      fillOpacity: 0.4,
                      fillColor: getRiskColor(feature.properties.riskScore),
                    })}
                    onEachFeature={(feature, layer) => {
                      layer.bindTooltip(
                        `Grid ${feature.properties.kelurahan}: skor risiko ${feature.properties.riskScore}`,
                        { sticky: true }
                      );
                    }}
                  />
                )}

                {showFlowLayer &&
                  filteredFlows.map((flow) => (
                    <Polyline
                      key={flow.id}
                      positions={flow.path}
                      pathOptions={{ color: "#f77f00", weight: Math.max(2, flow.value / 60) }}
                      eventHandlers={{
                        mouseover: (event) => {
                          event.target.bindTooltip(
                            `Flow ${flow.fromGrid} → ${flow.toGrid}: ${flow.value} perjalanan`,
                            { sticky: true }
                          ).openTooltip();
                        },
                      }}
                    />
                  ))}
              </>
            )}

            {view === "facility" && (
              <>
                {showFacilityLayer &&
                  facilities.map((facility) => (
                    <Marker
                      key={facility.id}
                      position={[facility.lat, facility.lng]}
                      eventHandlers={{
                        click: () => setSelectedFacility(facility),
                      }}
                    >
                      <Popup>
                        <strong>{facility.name}</strong>
                        <br />
                        {facility.type}
                        <br />
                        Kunjungan suspek: {facility.visits.suspect}
                      </Popup>
                    </Marker>
                  ))}
                {showGridLayer &&
                  facilities.map((facility) => (
                    <Circle
                      key={`${facility.id}-circle`}
                      center={[facility.lat, facility.lng]}
                      radius={facility.catchmentRadiusKm * 1000}
                      pathOptions={{ color: "#2a9d8f", fillOpacity: 0.12 }}
                    />
                  ))}
              </>
            )}
          </MapContainer>
        </section>
      </div>
    </div>
  );
}
