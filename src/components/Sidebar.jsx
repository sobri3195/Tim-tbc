import { useMemo, useState } from "react";

const TIME_KEYS = [
  { value: "mingguan", label: "Minggu Ini" },
  { value: "bulanan", label: "Bulan Ini" },
];

const KPI_CARDS = [
  { label: "Avg Risk", value: "0.68", note: "+0.04 vs minggu lalu" },
  { label: "High-risk Areas", value: "14", note: "Top 20%" },
  { label: "Suspect–Diagnosis Gap", value: "18%", note: "Perlu follow-up" },
  { label: "Confidence", value: "0.72", note: "Data cukup stabil" },
];

const LAYER_OPTIONS = [
  {
    key: "riskSurface",
    label: "Hidden Cluster Score",
    helper: "Choropleth risiko agregat per wilayah.",
  },
  {
    key: "gapHeatmap",
    label: "Suspect–Diagnosis Gap",
    helper: "Sorot area under-detection.",
  },
  {
    key: "confidence",
    label: "Confidence Overlay",
    helper: "Validasi kualitas data dan stabilitas sinyal.",
  },
  {
    key: "clusters",
    label: "Cluster Boundaries",
    helper: "Polygon cluster hasil deteksi otomatis.",
  },
  {
    key: "facilities",
    label: "Fasilitas Kesehatan",
    helper: "Titik layanan + catchment radius.",
  },
];

const FILTER_CHIPS = [
  { key: "highRiskOnly", label: "High risk only", tooltip: "Hanya tampilkan area risiko tinggi." },
  { key: "showGaps", label: "Show gaps", tooltip: "Sorot gap suspek vs diagnosis." },
  { key: "lowConfidence", label: "Low confidence", tooltip: "Highlight area dengan kualitas data rendah." },
];

const SAMPLE_CLUSTERS = [
  {
    id: "CL-102",
    avgRisk: 0.82,
    gapIndex: 0.64,
    affected: 1240,
    confidence: 0.78,
    contributions: [
      { label: "Gap diagnosis", value: 38 },
      { label: "Mobilitas masuk", value: 26 },
      { label: "Kunjungan batuk", value: 18 },
      { label: "Kepadatan", value: 10 },
      { label: "Data quality", value: 8 },
    ],
  },
  {
    id: "CL-097",
    avgRisk: 0.76,
    gapIndex: 0.52,
    affected: 980,
    confidence: 0.71,
    contributions: [
      { label: "Mobilitas masuk", value: 34 },
      { label: "Gap diagnosis", value: 28 },
      { label: "Kunjungan batuk", value: 16 },
      { label: "Kepadatan", value: 14 },
      { label: "Data quality", value: 8 },
    ],
  },
  {
    id: "CL-088",
    avgRisk: 0.71,
    gapIndex: 0.47,
    affected: 760,
    confidence: 0.68,
    contributions: [
      { label: "Kunjungan batuk", value: 30 },
      { label: "Gap diagnosis", value: 24 },
      { label: "Mobilitas masuk", value: 22 },
      { label: "Kepadatan", value: 14 },
      { label: "Data quality", value: 10 },
    ],
  },
];

const RECOMMENDATIONS = [
  { id: "R-01", location: "Grid A-12", reason: "High risk + gap", score: 0.84 },
  { id: "R-02", location: "Grid B-07", reason: "Low coverage", score: 0.78 },
  { id: "R-03", location: "Grid C-03", reason: "Near cluster CL-102", score: 0.74 },
  { id: "R-04", location: "Grid D-22", reason: "Low confidence", score: 0.71 },
  { id: "R-05", location: "Grid E-09", reason: "High mobility inflow", score: 0.69 },
];

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeKey, setTimeKey] = useState(TIME_KEYS[0].value);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const [filters, setFilters] = useState({
    highRiskOnly: false,
    showGaps: true,
    lowConfidence: false,
  });
  const [layers, setLayers] = useState({
    riskSurface: true,
    gapHeatmap: true,
    confidence: false,
    clusters: true,
    facilities: true,
  });
  const [riskThreshold, setRiskThreshold] = useState(0.65);
  const [epsKm, setEpsKm] = useState(0.9);
  const [minPts, setMinPts] = useState(3);
  const [clusterError, setClusterError] = useState("");
  const [planningMode, setPlanningMode] = useState("browse");
  const [interventionType, setInterventionType] = useState("Screening");
  const [interventionRadius, setInterventionRadius] = useState(1.5);
  const [showScoreModal, setShowScoreModal] = useState(false);

  const selectedCluster = useMemo(
    () => SAMPLE_CLUSTERS.find((cluster) => cluster.id === selectedClusterId) || null,
    [selectedClusterId]
  );

  const handleRunClusters = () => {
    if (riskThreshold < 0.4 || epsKm <= 0 || minPts < 2) {
      setClusterError("Parameter kurang valid. Naikkan threshold atau periksa eps/minPts.");
      return;
    }
    setClusterError("");
    setSelectedClusterId(SAMPLE_CLUSTERS[0]?.id ?? null);
  };

  return (
    <aside className="w-full lg:w-[380px] border-r bg-white flex flex-col h-full">
      <SidebarHeader
        timeKey={timeKey}
        onChangeTimeKey={setTimeKey}
        onReset={() => setSelectedArea(null)}
      />
      <SidebarTabs activeTab={activeTab} onChange={setActiveTab} />
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {activeTab === "overview" && (
          <OverviewPanel
            kpis={KPI_CARDS}
            layers={layers}
            onToggleLayer={(key) => setLayers((prev) => ({ ...prev, [key]: !prev[key] }))}
            filters={filters}
            onToggleFilter={(key) => setFilters((prev) => ({ ...prev, [key]: !prev[key] }))}
            selectedArea={selectedArea}
            onClearSelection={() => setSelectedArea(null)}
          />
        )}
        {activeTab === "clusters" && (
          <ClusterPanel
            riskThreshold={riskThreshold}
            epsKm={epsKm}
            minPts={minPts}
            onChangeRisk={setRiskThreshold}
            onChangeEps={setEpsKm}
            onChangeMinPts={setMinPts}
            onRun={handleRunClusters}
            clusterError={clusterError}
            clusters={SAMPLE_CLUSTERS}
            selectedCluster={selectedCluster}
            onSelectCluster={setSelectedClusterId}
          />
        )}
        {activeTab === "planning" && (
          <PlanningPanel
            mode={planningMode}
            onChangeMode={setPlanningMode}
            interventionType={interventionType}
            interventionRadius={interventionRadius}
            onChangeType={setInterventionType}
            onChangeRadius={setInterventionRadius}
            recommendations={RECOMMENDATIONS}
          />
        )}
      </div>
      <SidebarFooter onOpenScoreModal={() => setShowScoreModal(true)} />
      {showScoreModal && <ScoreModal onClose={() => setShowScoreModal(false)} />}
    </aside>
  );
}

function SidebarHeader({ timeKey, onChangeTimeKey, onReset }) {
  return (
    <div className="border-b bg-white px-4 py-4 sticky top-0 z-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">TBC Hidden Cluster Map</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
            Privacy-Preserved
          </span>
        </div>
        <div className="text-xs text-slate-500 text-right">
          Command Center
          <div className="text-[11px]">Explore → Diagnose → Plan</div>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        <label className="text-xs font-semibold text-slate-600">Periode Analisis</label>
        <select
          value={timeKey}
          onChange={(event) => onChangeTimeKey(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {TIME_KEYS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            title="Kembali ke tampilan default"
          >
            Reset view
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            title="Fitur dummy untuk membagikan snapshot"
          >
            Share snapshot
          </button>
        </div>
      </div>
    </div>
  );
}

function SidebarTabs({ activeTab, onChange }) {
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "clusters", label: "Clusters" },
    { key: "planning", label: "Planning" },
  ];

  return (
    <div className="border-b bg-white px-4 py-3">
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`rounded-md px-2 py-2 text-xs font-semibold transition ${
              activeTab === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function OverviewPanel({ kpis, layers, onToggleLayer, filters, onToggleFilter, selectedArea, onClearSelection }) {
  return (
    <div className="space-y-5">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">KPI Snapshot</h2>
          <span className="text-xs text-slate-500">Auto-refresh tiap timeKey</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">{kpi.label}</p>
              <p className="text-lg font-semibold text-slate-900">{kpi.value}</p>
              <p className="text-[11px] text-slate-400">{kpi.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Layer Controls</h2>
          <span className="text-[11px] text-slate-400">Tip: Matikan layer berat</span>
        </div>
        <div className="space-y-3">
          {LAYER_OPTIONS.map((layer) => (
            <label key={layer.key} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
              <input
                type="checkbox"
                checked={layers[layer.key]}
                onChange={() => onToggleLayer(layer.key)}
                className="mt-1 h-4 w-4"
              />
              <div>
                <p className="text-sm font-medium text-slate-800">{layer.label}</p>
                <p className="text-xs text-slate-500">{layer.helper}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-800 mb-2">Filter Cepat</h2>
        <div className="flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.key}
              type="button"
              title={chip.tooltip}
              onClick={() => onToggleFilter(chip.key)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                filters[chip.key]
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-500 hover:text-slate-700"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Tip: Kombinasikan filter untuk fokus area prioritas tinggi.
        </p>
      </section>

      <section className="rounded-xl border border-dashed border-slate-300 p-3">
        <h3 className="text-sm font-semibold text-slate-800">Focus Area</h3>
        {selectedArea ? (
          <div className="mt-2 text-xs text-slate-600">
            <div className="font-medium">{selectedArea.name}</div>
            <div>Avg risk {selectedArea.avgRisk} · Gap {selectedArea.gapIndex}</div>
            <button
              type="button"
              onClick={onClearSelection}
              className="mt-2 text-[11px] text-slate-500 underline"
            >
              Lepaskan pilihan area
            </button>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            Belum ada area dipilih. Klik wilayah di peta untuk melihat ringkasan di sini.
          </p>
        )}
      </section>
    </div>
  );
}

function ClusterPanel({
  riskThreshold,
  epsKm,
  minPts,
  onChangeRisk,
  onChangeEps,
  onChangeMinPts,
  onRun,
  clusterError,
  clusters,
  selectedCluster,
  onSelectCluster,
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Parameter Deteksi</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">Risk Threshold</label>
            <input
              type="range"
              min="0.3"
              max="0.9"
              step="0.05"
              value={riskThreshold}
              onChange={(event) => onChangeRisk(Number(event.target.value))}
              className="w-full"
            />
            <p className="text-xs text-slate-500">Grid dengan risk ≥ {riskThreshold.toFixed(2)}.</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Eps (km)</label>
            <input
              type="number"
              min="0.2"
              step="0.1"
              value={epsKm}
              onChange={(event) => onChangeEps(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-500">Radius tetangga untuk mengikat grid berdekatan.</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Min Points</label>
            <input
              type="number"
              min="2"
              step="1"
              value={minPts}
              onChange={(event) => onChangeMinPts(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-500">Jumlah minimum grid agar jadi klaster.</p>
          </div>
          <button
            type="button"
            onClick={onRun}
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Temukan Klaster
          </button>
          {clusterError && (
            <p className="text-xs text-rose-600" role="alert">
              {clusterError}
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Cluster Ranked</h2>
          <span className="text-xs text-slate-400">Total {clusters.length}</span>
        </div>
        {clusters.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-500">
            Belum ada klaster. Jalankan deteksi atau turunkan threshold.
          </div>
        ) : (
          <div className="space-y-3">
            {clusters.map((cluster) => (
              <div
                key={cluster.id}
                className={`rounded-xl border p-3 transition ${
                  selectedCluster?.id === cluster.id
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Cluster {cluster.id}</p>
                    <p className="text-xs text-slate-500">
                      Avg Risk {cluster.avgRisk.toFixed(2)} · Gap {cluster.gapIndex.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">Est. affected {cluster.affected}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Confidence</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {cluster.confidence.toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectCluster(cluster.id)}
                  className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-white"
                >
                  Focus
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-2">Explainability</h2>
        {!selectedCluster ? (
          <p className="text-xs text-slate-500">
            Pilih klaster untuk melihat kontribusi faktor utama.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedCluster.contributions.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PlanningPanel({
  mode,
  onChangeMode,
  interventionType,
  interventionRadius,
  onChangeType,
  onChangeRadius,
  recommendations,
}) {
  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-sm font-semibold text-slate-800 mb-2">Mode</h2>
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          {["browse", "planning"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onChangeMode(value)}
              className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                mode === value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {value === "browse" ? "Browse" : "Planning"}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {mode === "planning"
            ? "Mode planning aktif. Klik peta untuk menambah titik." 
            : "Gunakan browse untuk eksplorasi cepat tanpa menambah rencana."}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Tambah Intervensi</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">Jenis Intervensi</label>
            <select
              value={interventionType}
              onChange={(event) => onChangeType(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="Screening">Screening</option>
              <option value="Edukasi">Edukasi</option>
              <option value="Tracing">Tracing</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Radius (km)</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={interventionRadius}
              onChange={(event) => onChangeRadius(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-500">Tip: gunakan 1–2 km untuk screening.</p>
          </div>
          <button
            type="button"
            className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            title="Dummy UI: tidak menyimpan ke backend"
          >
            Tambah ke Rencana
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-800">Coverage Meter</h2>
        <p className="text-xs text-slate-500">62% area berisiko telah tercakup.</p>
        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div className="h-2 w-[62%] rounded-full bg-emerald-500" />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-slate-500">
          <span>Coverage sekarang</span>
          <span>Target 75%</span>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Rekomendasi Titik Berikutnya</h2>
          <span className="text-xs text-slate-400">Top 5</span>
        </div>
        <div className="space-y-2">
          {recommendations.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{rec.location}</p>
                  <p className="text-xs text-slate-500">{rec.reason}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600">{rec.score}</span>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Focus
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-slate-900 px-2 py-1 text-xs text-white hover:bg-slate-800"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
        {recommendations.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-500">
            Belum ada rekomendasi. Tambah intervensi untuk memicu perhitungan ulang.
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
          title="Dummy UI export plan"
        >
          Export Plan
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
          title="Dummy UI import plan"
        >
          Import Plan
        </button>
      </section>
    </div>
  );
}

function SidebarFooter({ onOpenScoreModal }) {
  return (
    <div className="border-t bg-white px-4 py-4 sticky bottom-0">
      <p className="text-[11px] text-slate-500">
        Analisis ini menggunakan data agregat; tidak ada pelacakan individu atau alamat pribadi.
        Gunakan hasil hanya untuk prioritas program kesehatan publik.
      </p>
      <button
        type="button"
        onClick={onOpenScoreModal}
        className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
      >
        How this score works
      </button>
    </div>
  );
}

function ScoreModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Penjelasan Skor Risiko</h3>
            <p className="text-xs text-slate-500">Ringkasan untuk keperluan kolaborasi tim.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500"
          >
            Tutup
          </button>
        </div>
        <div className="mt-4 space-y-3 text-xs text-slate-600">
          <p>
            Skor hidden cluster dihitung dari kombinasi risiko historis, gap suspek-diagnosis,
            mobilitas agregat, dan kualitas data. Semua komponen dinormalisasi ke 0–1.
          </p>
          <p>
            Nilai tinggi menunjukkan area prioritas untuk eksplorasi, bukan diagnosis individu.
            Gunakan bersama konteks lapangan dan validasi tambahan.
          </p>
          <p className="text-[11px] text-slate-400">
            Tooltip tambahan tersedia pada setiap layer untuk melihat definisi singkat.
          </p>
        </div>
      </div>
    </div>
  );
}
