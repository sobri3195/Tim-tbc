import { useMemo, useState, useCallback } from "react";
import { Circle, GeoJSON, MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from "react-leaflet";
import regions from "./data/regions.json";
import grids from "./data/grids.json";
import flows from "./data/flows.json";
import facilities from "./data/facilities.json";
import timeseries from "./data/timeseries.json";
import { runDBSCAN, calculateClusterStats } from "./utils/clustering";
import { calculateDataQuality } from "./utils/dataQuality";
import { calculateExplainability } from "./utils/explainability";
import { calculateCoverage } from "./utils/interventionPlanner";

const VIEWS = {
  overview: "Overview Map",
  cluster: "Cluster Explorer",
  facility: "Facility View",
  gapAnalysis: "Gap Analysis",
  intervention: "Intervention Planner",
};

const clusterLegend = [
  { label: "Rendah (0-54)", color: "#b7e4c7" },
  { label: "Sedang (55-74)", color: "#52b788" },
  { label: "Tinggi (75+)", color: "#2d6a4f" },
];

const riskLegend = [
  { label: "0 - 0.4", color: "#dbe7ff" },
  { label: "0.41 - 0.7", color: "#7aa2ff" },
  { label: "0.71+", color: "#2f4b7c" },
];

const gapLegend = [
  { label: "Gap Rendah", color: "#a7c957" },
  { label: "Gap Sedang", color: "#f4a261" },
  { label: "Gap Tinggi", color: "#e76f51" },
];

const qualityLegend = [
  { label: "Tinggi", color: "#10b981" },
  { label: "Sedang", color: "#f59e0b" },
  { label: "Rendah", color: "#ef4444" },
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

const getGapColor = (suspectRate, diagnosisRate) => {
  const gap = suspectRate - diagnosisRate;
  if (gap >= 25) return "#e76f51";
  if (gap >= 10) return "#f4a261";
  return "#a7c957";
};

const getQualityColor = (quality) => {
  if (quality >= 0.8) return "#10b981";
  if (quality >= 0.5) return "#f59e0b";
  return "#ef4444";
};

const formatMonth = (month) => {
  const [year, mm] = month.split("-");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${monthNames[Number(mm) - 1]} ${year}`;
};

function InterventionMarker({ position, onRemove, coverage }) {
  return (
    <>
      <Marker position={position}>
        <Popup>
          <div>
            <strong>Titik Intervensi</strong>
            <p>Cakupan estimasi: {coverage} grid</p>
            <button onClick={onRemove} style={{ marginTop: '8px', padding: '4px 8px' }}>
              Hapus
            </button>
          </div>
        </Popup>
      </Marker>
      <Circle
        center={position}
        radius={1000}
        pathOptions={{ color: "#8b5cf6", fillOpacity: 0.15, weight: 2, dashArray: "5, 5" }}
      />
    </>
  );
}

function MapClickHandler({ onMapClick, enabled }) {
  useMapEvents({
    click: (e) => {
      if (enabled) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

export default function App() {
  const [view, setView] = useState("overview");
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [showGridLayer, setShowGridLayer] = useState(true);
  const [showFlowLayer, setShowFlowLayer] = useState(true);
  const [showFacilityLayer, setShowFacilityLayer] = useState(true);
  const [showQualityOverlay, setShowQualityOverlay] = useState(false);
  const [flowThreshold, setFlowThreshold] = useState(60);
  const [clusterThreshold, setClusterThreshold] = useState(50);
  const [activeMonthIndex, setActiveMonthIndex] = useState(0);
  const [autoClusters, setAutoClusters] = useState(null);
  const [showAutoClusters, setShowAutoClusters] = useState(false);
  const [interventionPoints, setInterventionPoints] = useState([]);
  const [interventionMode, setInterventionMode] = useState(false);
  const [selectedGrid, setSelectedGrid] = useState(null);

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

  const gridQuality = useMemo(() => {
    return grids.features.map(feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        quality: calculateDataQuality(feature.properties)
      }
    }));
  }, []);

  const handleDiscoverClusters = useCallback(() => {
    const highRiskGrids = grids.features.filter(f => f.properties.riskScore >= 0.6);
    const clusters = runDBSCAN(highRiskGrids, 0.05, 2);
    const stats = calculateClusterStats(clusters);
    setAutoClusters({ clusters, stats });
    setShowAutoClusters(true);
  }, []);

  const handleAddInterventionPoint = useCallback((latlng) => {
    const coverage = calculateCoverage(latlng, grids.features);
    setInterventionPoints(prev => [...prev, { 
      id: `int-${Date.now()}`, 
      position: [latlng.lat, latlng.lng],
      coverage 
    }]);
  }, []);

  const handleRemoveInterventionPoint = useCallback((id) => {
    setInterventionPoints(prev => prev.filter(p => p.id !== id));
  }, []);

  const totalCoverage = useMemo(() => {
    const coveredGrids = new Set();
    interventionPoints.forEach(point => {
      grids.features.forEach(grid => {
        const center = grid.geometry.coordinates[0];
        const gridLat = (center[0][1] + center[2][1]) / 2;
        const gridLng = (center[0][0] + center[2][0]) / 2;
        const distance = Math.sqrt(
          Math.pow(point.position[0] - gridLat, 2) + 
          Math.pow(point.position[1] - gridLng, 2)
        );
        if (distance < 0.015) {
          coveredGrids.add(grid.properties.gridId);
        }
      });
    });
    return coveredGrids.size;
  }, [interventionPoints]);

  const explainability = useMemo(() => {
    if (!selectedGrid) return null;
    return calculateExplainability(selectedGrid, filteredFlows);
  }, [selectedGrid, filteredFlows]);

  const mapCenter = [-6.13, 106.83];

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">TBC Hidden Cluster Map - 10 Fitur Unggulan</p>
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
          <section className="panel privacy-banner">
            <div className="privacy-icon">🔒</div>
            <div>
              <strong>Privasi Terjaga</strong>
              <p className="microcopy">
                Semua data ditampilkan dalam agregat grid/kelurahan. Tidak ada data individu atau alamat personal yang ditampilkan. Cell count minimum diterapkan.
              </p>
            </div>
          </section>

          {view === "overview" && (
            <>
              <section className="panel">
                <h2>🗺️ Fitur 1: Hidden Cluster Score</h2>
                <p className="microcopy">
                  Layer choropleth + grid menampilkan skor risiko per kelurahan dan grid untuk deteksi klaster mikro.
                </p>
                <label className="slider-label">
                  Ambang indeks: <strong>{clusterThreshold}</strong>
                </label>
                <input
                  type="range"
                  min="30"
                  max="90"
                  value={clusterThreshold}
                  onChange={(e) => setClusterThreshold(Number(e.target.value))}
                />
              </section>

              <section className="panel">
                <h3>Layer Control</h3>
                <label className="toggle">
                  <input type="checkbox" checked readOnly />
                  Hidden Cluster Choropleth
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={showGridLayer}
                    onChange={(e) => setShowGridLayer(e.target.checked)}
                  />
                  Grid Risiko (500m)
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={showQualityOverlay}
                    onChange={(e) => setShowQualityOverlay(e.target.checked)}
                  />
                  🔍 Fitur 6: Data Quality Overlay
                </label>
              </section>

              <section className="panel">
                <h3>🎨 Legend</h3>
                <div className="legend">
                  {clusterLegend.map((item) => (
                    <div key={item.label} className="legend-item">
                      <span style={{ background: item.color }} />
                      {item.label}
                    </div>
                  ))}
                </div>
                {showGridLayer && !showQualityOverlay && (
                  <>
                    <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Grid Risk Score</h4>
                    <div className="legend">
                      {riskLegend.map((item) => (
                        <div key={item.label} className="legend-item">
                          <span style={{ background: item.color }} />
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {showQualityOverlay && (
                  <>
                    <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Data Quality</h4>
                    <div className="legend">
                      {qualityLegend.map((item) => (
                        <div key={item.label} className="legend-item">
                          <span style={{ background: item.color }} />
                          {item.label}
                        </div>
                      ))}
                    </div>
                    <p className="microcopy" style={{ marginTop: '0.5rem' }}>
                      Confidence berdasarkan kelengkapan data faskes & stabilitas sinyal
                    </p>
                  </>
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
                    Klik wilayah di peta untuk melihat ringkasan statistik agregat.
                  </p>
                )}
              </section>
            </>
          )}

          {view === "cluster" && (
            <>
              <section className="panel">
                <h2>🔄 Fitur 4: Time Slider</h2>
                <p className="microcopy">
                  Slider temporal mengubah semua layer untuk analisis pola musiman.
                </p>
                <label className="slider-label">
                  Bulan aktif: <strong>{formatMonth(activeMonth)}</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max={timeseries.months.length - 1}
                  value={activeMonthIndex}
                  onChange={(e) => setActiveMonthIndex(Number(e.target.value))}
                />
              </section>

              <section className="panel">
                <h2>🌊 Fitur 3: Mobility Flow Map</h2>
                <p className="microcopy">
                  Arcs OD menampilkan arus mobilitas untuk prediksi penyebaran.
                </p>
                <label className="slider-label">
                  Minimum intensitas: <strong>{flowThreshold}</strong>
                </label>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={flowThreshold}
                  onChange={(e) => setFlowThreshold(Number(e.target.value))}
                />
              </section>

              <section className="panel">
                <h2>🤖 Fitur 5: Cluster Auto-Discovery</h2>
                <p className="microcopy">
                  DBSCAN mengelompokkan grid berisiko tinggi menjadi cluster polygon.
                </p>
                <button 
                  className="btn-primary"
                  onClick={handleDiscoverClusters}
                  type="button"
                >
                  🔍 Temukan Klaster Otomatis
                </button>
                {autoClusters && (
                  <div className="card" style={{ marginTop: '1rem' }}>
                    <h4>Cluster Terdeteksi: {autoClusters.clusters.length}</h4>
                    {autoClusters.stats.map((stat, idx) => (
                      <div key={idx} style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        <strong>Cluster {idx + 1}:</strong> {stat.count} grid, 
                        avg risk: {stat.avgRisk.toFixed(2)}
                      </div>
                    ))}
                  </div>
                )}
                <label className="toggle" style={{ marginTop: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={showAutoClusters}
                    onChange={(e) => setShowAutoClusters(e.target.checked)}
                    disabled={!autoClusters}
                  />
                  Tampilkan Cluster di Peta
                </label>
              </section>

              <section className="panel">
                <h3>Layer Control</h3>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={showGridLayer}
                    onChange={(e) => setShowGridLayer(e.target.checked)}
                  />
                  Grid Risiko
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={showFlowLayer}
                    onChange={(e) => setShowFlowLayer(e.target.checked)}
                  />
                  Aliran Mobilitas (OD Arcs)
                </label>
              </section>

              <section className="panel">
                <h3>Insight Flow</h3>
                {filteredFlows.length > 0 ? (
                  <ul className="stats-list">
                    {filteredFlows.slice(0, 8).map((flow) => (
                      <li key={flow.id}>
                        {flow.fromGrid} → {flow.toGrid} <span>{flow.value} trip</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty">
                    Tidak ada flow yang memenuhi filter. Turunkan ambang intensitas.
                  </p>
                )}
              </section>
            </>
          )}

          {view === "facility" && (
            <>
              <section className="panel">
                <h2>🏥 Fitur 7: Facility Catchment</h2>
                <p className="microcopy">
                  Klik faskes untuk melihat catchment radius, beban kunjungan & gap rujukan.
                </p>
              </section>

              <section className="panel">
                <h3>Layer Control</h3>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={showFacilityLayer}
                    onChange={(e) => setShowFacilityLayer(e.target.checked)}
                  />
                  Marker Fasilitas
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={showGridLayer}
                    onChange={(e) => setShowGridLayer(e.target.checked)}
                  />
                  Catchment Radius
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
                <h3>Detail Beban & Gap</h3>
                {selectedFacility ? (
                  <div className="card">
                    <h4>{selectedFacility.name}</h4>
                    <p><strong>Tipe:</strong> {selectedFacility.type}</p>
                    <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #cbd5e1' }} />
                    <p>Kunjungan batuk: {selectedFacility.visits.cough}</p>
                    <p>Suspek TBC: {selectedFacility.visits.suspect}</p>
                    <p>Diagnosis TBC: {selectedFacility.visits.diagnosis}</p>
                    <p>Mulai pengobatan: {selectedFacility.visits.treatment}</p>
                    <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #cbd5e1' }} />
                    <p><strong>Gap Rujukan:</strong> {selectedFacility.visits.suspect - selectedFacility.visits.diagnosis} pasien</p>
                    <p><strong>Conversion Rate:</strong> {((selectedFacility.visits.diagnosis / selectedFacility.visits.suspect) * 100).toFixed(1)}%</p>
                  </div>
                ) : (
                  <p className="empty">
                    Pilih fasilitas untuk melihat analisis beban & gap rujukan.
                  </p>
                )}
              </section>
            </>
          )}

          {view === "gapAnalysis" && (
            <>
              <section className="panel">
                <h2>📊 Fitur 2: Gap Analysis Heatmap</h2>
                <p className="microcopy">
                  Heatmap menunjukkan area dengan gejala/kunjungan tinggi tapi diagnosis rendah (indikasi under-detection).
                </p>
              </section>

              <section className="panel">
                <h3>🎨 Legend Gap</h3>
                <div className="legend">
                  {gapLegend.map((item) => (
                    <div key={item.label} className="legend-item">
                      <span style={{ background: item.color }} />
                      {item.label}
                    </div>
                  ))}
                </div>
                <p className="microcopy" style={{ marginTop: '0.5rem' }}>
                  Gap = Suspek Rate - Diagnosis Rate
                </p>
              </section>

              <section className="panel">
                <h3>🧠 Fitur 9: Smart Explainability</h3>
                {selectedGrid ? (
                  <div className="card">
                    <h4>Kenapa "{selectedGrid.kelurahan}" tinggi?</h4>
                    {explainability && (
                      <div className="explainability-chart">
                        {explainability.factors.map(factor => (
                          <div key={factor.name} className="factor-bar">
                            <div className="factor-label">{factor.name}</div>
                            <div className="factor-bar-container">
                              <div 
                                className="factor-bar-fill" 
                                style={{ width: `${factor.contribution}%` }}
                              />
                            </div>
                            <div className="factor-value">{factor.contribution}%</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="empty">
                    Klik grid di peta untuk melihat kontribusi faktor risiko.
                  </p>
                )}
              </section>

              <section className="panel">
                <h3>Area Gap Tinggi</h3>
                <ul className="stats-list">
                  {regions.features
                    .filter(f => (f.properties.suspectedRate - (f.properties.notifRate * 1.5)) > 20)
                    .slice(0, 5)
                    .map(f => (
                      <li key={f.properties.id}>
                        {f.properties.name} 
                        <span>Gap: {(f.properties.suspectedRate - (f.properties.notifRate * 1.5)).toFixed(0)}%</span>
                      </li>
                    ))}
                </ul>
              </section>
            </>
          )}

          {view === "intervention" && (
            <>
              <section className="panel">
                <h2>📍 Fitur 8: Intervention Planner</h2>
                <p className="microcopy">
                  Taruh pin kegiatan (screening, edukasi, tracing) untuk estimasi cakupan populasi area berisiko.
                </p>
                <button 
                  className={interventionMode ? "btn-primary active" : "btn-primary"}
                  onClick={() => setInterventionMode(!interventionMode)}
                  type="button"
                >
                  {interventionMode ? "✓ Mode Aktif - Klik Peta" : "🎯 Aktifkan Mode Pin"}
                </button>
              </section>

              <section className="panel">
                <h3>Coverage Summary</h3>
                <div className="card">
                  <p><strong>Total Titik Intervensi:</strong> {interventionPoints.length}</p>
                  <p><strong>Grid Tercakup:</strong> {totalCoverage} / {grids.features.length}</p>
                  <p><strong>Coverage Rate:</strong> {((totalCoverage / grids.features.length) * 100).toFixed(1)}%</p>
                </div>
              </section>

              <section className="panel">
                <h3>Daftar Titik Intervensi</h3>
                {interventionPoints.length > 0 ? (
                  <ul className="stats-list">
                    {interventionPoints.map((point, idx) => (
                      <li key={point.id}>
                        Titik {idx + 1} 
                        <span>{point.coverage} grid</span>
                        <button 
                          onClick={() => handleRemoveInterventionPoint(point.id)}
                          style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '0.8rem' }}
                        >
                          Hapus
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty">
                    Aktifkan mode pin dan klik peta untuk menambah titik intervensi.
                  </p>
                )}
              </section>

              <section className="panel">
                <h3>Rekomendasi</h3>
                <div className="alert">
                  <strong>💡 Tip</strong>
                  <p>Fokuskan intervensi pada area dengan gap deteksi tinggi dan mobilitas tinggi.</p>
                </div>
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

            {view === "intervention" && interventionMode && (
              <MapClickHandler 
                onMapClick={handleAddInterventionPoint} 
                enabled={interventionMode}
              />
            )}

            {view === "overview" && (
              <>
                <GeoJSON
                  key={`regions-${clusterThreshold}`}
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
                      `${feature.properties.name}: indeks ${feature.properties.hiddenClusterIndex}`,
                      { sticky: true }
                    );
                  }}
                />

                {showGridLayer && !showQualityOverlay && (
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
                        `Grid ${feature.properties.kelurahan}: risk ${feature.properties.riskScore}`,
                        { sticky: true }
                      );
                    }}
                  />
                )}

                {showGridLayer && showQualityOverlay && (
                  <GeoJSON
                    key="quality-overlay"
                    data={{ type: "FeatureCollection", features: gridQuality }}
                    style={(feature) => ({
                      color: "#64748b",
                      weight: 0.5,
                      fillOpacity: 0.5,
                      fillColor: getQualityColor(feature.properties.quality),
                    })}
                    onEachFeature={(feature, layer) => {
                      const qualityLabel = feature.properties.quality >= 0.8 ? "Tinggi" : 
                                          feature.properties.quality >= 0.5 ? "Sedang" : "Rendah";
                      layer.bindTooltip(
                        `${feature.properties.kelurahan}: Data Quality ${qualityLabel} (${(feature.properties.quality * 100).toFixed(0)}%)`,
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
                    key={`grids-${activeMonthIndex}`}
                    data={grids}
                    style={(feature) => ({
                      color: "#3a5a98",
                      weight: 0.5,
                      fillOpacity: 0.4,
                      fillColor: getRiskColor(feature.properties.riskScore),
                    })}
                    onEachFeature={(feature, layer) => {
                      layer.bindTooltip(
                        `Grid ${feature.properties.kelurahan}: risk ${feature.properties.riskScore}`,
                        { sticky: true }
                      );
                    }}
                  />
                )}

                {showFlowLayer &&
                  filteredFlows.map((flow) => (
                    <Polyline
                      key={`${flow.id}-${activeMonthIndex}`}
                      positions={flow.path}
                      pathOptions={{ 
                        color: "#f77f00", 
                        weight: Math.max(2, flow.value / 60),
                        opacity: 0.7
                      }}
                      eventHandlers={{
                        mouseover: (event) => {
                          event.target.setStyle({ color: "#d62828", weight: Math.max(3, flow.value / 40) });
                          event.target.bindTooltip(
                            `Flow: ${flow.fromGrid} → ${flow.toGrid} (${flow.value} trip)`,
                            { sticky: true }
                          ).openTooltip();
                        },
                        mouseout: (event) => {
                          event.target.setStyle({ color: "#f77f00", weight: Math.max(2, flow.value / 60) });
                        }
                      }}
                    />
                  ))}

                {showAutoClusters && autoClusters && (
                  <>
                    {autoClusters.clusters.map((cluster, idx) => (
                      <GeoJSON
                        key={`cluster-${idx}`}
                        data={{
                          type: "FeatureCollection",
                          features: cluster.grids
                        }}
                        style={{
                          color: "#8b5cf6",
                          weight: 3,
                          fillOpacity: 0.2,
                          fillColor: "#8b5cf6"
                        }}
                        onEachFeature={(feature, layer) => {
                          layer.bindTooltip(
                            `Cluster ${idx + 1}: ${cluster.grids.length} grid`,
                            { sticky: true }
                          );
                        }}
                      />
                    ))}
                  </>
                )}
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
                        Suspek: {facility.visits.suspect}
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

            {view === "gapAnalysis" && (
              <>
                <GeoJSON
                  data={regions}
                  style={(feature) => {
                    const diagnosisRate = feature.properties.notifRate * 1.5;
                    return {
                      color: "#374151",
                      weight: 1,
                      fillOpacity: 0.65,
                      fillColor: getGapColor(feature.properties.suspectedRate, diagnosisRate),
                    };
                  }}
                  onEachFeature={(feature, layer) => {
                    const diagnosisRate = feature.properties.notifRate * 1.5;
                    const gap = feature.properties.suspectedRate - diagnosisRate;
                    layer.on({
                      click: () => setSelectedRegion(feature.properties),
                    });
                    layer.bindTooltip(
                      `${feature.properties.name}: Gap ${gap.toFixed(1)}% (Suspek ${feature.properties.suspectedRate}% vs Diagnosis ~${diagnosisRate.toFixed(1)}%)`,
                      { sticky: true }
                    );
                  }}
                />

                {showGridLayer && (
                  <GeoJSON
                    data={grids}
                    style={(feature) => ({
                      color: "#6b7280",
                      weight: 0.5,
                      fillOpacity: 0.3,
                      fillColor: getRiskColor(feature.properties.riskScore),
                    })}
                    onEachFeature={(feature, layer) => {
                      layer.on({
                        click: () => setSelectedGrid(feature.properties),
                      });
                      layer.bindTooltip(
                        `Grid ${feature.properties.kelurahan}: risk ${feature.properties.riskScore}, visit rate ${feature.properties.visitRate}%`,
                        { sticky: true }
                      );
                    }}
                  />
                )}
              </>
            )}

            {view === "intervention" && (
              <>
                <GeoJSON
                  data={grids}
                  style={(feature) => ({
                    color: "#94a3b8",
                    weight: 0.5,
                    fillOpacity: 0.3,
                    fillColor: getRiskColor(feature.properties.riskScore),
                  })}
                  onEachFeature={(feature, layer) => {
                    layer.bindTooltip(
                      `Grid ${feature.properties.kelurahan}: risk ${feature.properties.riskScore}`,
                      { sticky: true }
                    );
                  }}
                />

                {interventionPoints.map((point) => (
                  <InterventionMarker
                    key={point.id}
                    position={point.position}
                    coverage={point.coverage}
                    onRemove={() => handleRemoveInterventionPoint(point.id)}
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
