import { useMemo, useState, useCallback } from "react";

export default function MobilitySidebar({
  title,
  timeKey,
  timeKeys,
  setTimeKey,
  layers,
  setLayers,
  filters,
  setFilters,
  areas,
  activeAreaId,
  contributionsByTo,
  selectedFlow,
  onSelectFlow,
  maxVolume,
  flowsEmpty,
}) {
  const [collapsedSections, setCollapsedSections] = useState({});

  const areaNameById = useMemo(() => {
    if (!areas?.features?.length) return {};
    return areas.features.reduce((acc, feature) => {
      const id = feature.properties?.id;
      if (id) acc[id] = feature.properties?.name || id;
      return acc;
    }, {});
  }, [areas]);

  const contributions = useMemo(() => {
    if (!activeAreaId) return [];
    const list = contributionsByTo?.[activeAreaId] || [];
    return [...list].sort((a, b) => b.contribution - a.contribution).slice(0, 5);
  }, [activeAreaId, contributionsByTo]);

  const totalContribution = useMemo(
    () => contributions.reduce((sum, item) => sum + item.contribution, 0),
    [contributions],
  );

  const formatPercent = (value) => `${(value * 100).toFixed(1)}%`;

  const toggleSection = useCallback((sectionId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  return (
    <aside className="w-full lg:w-[380px] border-r bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-white">
        <h1 className="text-lg font-bold text-slate-800">🌊 Mobilitas & Risiko</h1>
        <p className="text-xs text-slate-500 mt-1">
          Privasi terjaga: alur mobilitas merupakan agregat wilayah, tanpa individu.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Layer Peta Section */}
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection("layers")}
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between border-b"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🗺️</span>
              <h3 className="font-semibold text-sm text-slate-800">Layer Peta</h3>
            </div>
            <span className="text-slate-400 transform transition-transform" style={{ transform: collapsedSections.layers ? "rotate(-90deg)" : "" }}>▼</span>
          </button>

          {!collapsedSections.layers && (
            <div className="p-3 space-y-3 bg-white">
              <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.flowArcs}
                  onChange={(event) => setLayers({ ...layers, flowArcs: event.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <div className="flex-1">
                  <span className="font-medium text-sm text-slate-700">Flow Arcs</span>
                  <p className="text-xs text-slate-500">Mobilitas agregat antar wilayah</p>
                </div>
                <span className="text-2xl opacity-50">〰️</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.importRisk}
                  onChange={(event) => setLayers({ ...layers, importRisk: event.target.checked })}
                  className="w-5 h-5 text-orange-600 rounded"
                />
                <div className="flex-1">
                  <span className="font-medium text-sm text-slate-700">Import Risk</span>
                  <p className="text-xs text-slate-500">Skor risiko per wilayah</p>
                </div>
                <span className="text-2xl opacity-50">🎨</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-slate-200 hover:border-red-300 hover:bg-red-50 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.gapHeatmap}
                  onChange={(event) => setLayers({ ...layers, gapHeatmap: event.target.checked })}
                  className="w-5 h-5 text-red-600 rounded"
                />
                <div className="flex-1">
                  <span className="font-medium text-sm text-slate-700">Heatmap Gap Suspek</span>
                  <p className="text-xs text-slate-500">Intensitas gap suspek vs diagnosis</p>
                </div>
                <span className="text-2xl opacity-50">🔥</span>
              </label>
            </div>
          )}
        </div>

        {/* Filter Waktu & Intensitas Section */}
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection("filters")}
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between border-b"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              <h3 className="font-semibold text-sm text-slate-800">Filter Waktu & Intensitas</h3>
            </div>
            <span className="text-slate-400 transform transition-transform" style={{ transform: collapsedSections.filters ? "rotate(-90deg)" : "" }}>▼</span>
          </button>

          {!collapsedSections.filters && (
            <div className="p-4 space-y-4 bg-white">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">📅</span>
                  Periode Analisis
                </label>
                <select
                  className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none transition"
                  value={timeKey}
                  onChange={(event) => setTimeKey(event.target.value)}
                >
                  {timeKeys.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-700">Minimum Volume</label>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">≥ {filters.minVolume}</span>
                </div>
                <input
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  type="range"
                  min="0"
                  max={Math.max(maxVolume || 0, 1)}
                  step="5"
                  value={filters.minVolume}
                  onChange={(event) =>
                    setFilters({ ...filters, minVolume: Number(event.target.value) })
                  }
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-700">Maksimum Arc</label>
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded">Top {filters.maxArcs}</span>
                </div>
                <input
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={filters.maxArcs}
                  onChange={(event) => setFilters({ ...filters, maxArcs: Number(event.target.value) })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Explainability Section */}
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection("explainability")}
            className="w-full px-4 py-3 bg-gradient-to-r from-orange-50 to-white hover:from-orange-100 hover:to-orange-50 transition flex items-center justify-between border-b"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🧠</span>
              <div>
                <h3 className="font-semibold text-sm text-slate-800">Sumber Import Risk</h3>
                <p className="text-xs text-slate-500">Top 5 kontributor utama</p>
              </div>
            </div>
            <span className="text-slate-400 transform transition-transform" style={{ transform: collapsedSections.explainability ? "rotate(-90deg)" : "" }}>▼</span>
          </button>

          {!collapsedSections.explainability && (
            <div className="p-3 bg-white">
              {!activeAreaId ? (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-3xl">🗺️</span>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Pilih Wilayah</p>
                  <p className="text-xs text-slate-500">
                    Arahkan kursor atau klik wilayah untuk melihat kontributor utama.
                  </p>
                </div>
              ) : contributions.length ? (
                <div className="space-y-2">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Target:</p>
                    <p className="text-sm font-bold text-slate-800">{areaNameById[activeAreaId] || activeAreaId}</p>
                  </div>
                  {contributions.map((item) => {
                    const percent = totalContribution
                      ? item.contribution / totalContribution
                      : 0;
                    const isSelected =
                      selectedFlow &&
                      selectedFlow.from === item.from &&
                      selectedFlow.to === item.to;
                    return (
                      <button
                        type="button"
                        key={`${item.from}-${item.to}`}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-orange-400 bg-orange-50 shadow-sm"
                            : "border-slate-200 hover:border-orange-300 hover:bg-orange-50/50"
                        }`}
                        onClick={() => onSelectFlow({ from: item.from, to: item.to })}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-slate-800 truncate">
                              {areaNameById[item.from] || item.from}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-600">Volume: {item.volume}</span>
                              <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                                {formatPercent(percent)}
                              </span>
                            </div>
                          </div>
                          {isSelected && <span className="text-orange-500">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-slate-500">
                    Tidak ada arus masuk untuk wilayah ini pada periode tersebut.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legenda Section */}
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection("legend")}
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between border-b"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h3 className="font-semibold text-sm text-slate-800">Legenda</h3>
            </div>
            <span className="text-slate-400 transform transition-transform" style={{ transform: collapsedSections.legend ? "rotate(-90deg)" : "" }}>▼</span>
          </button>

          {!collapsedSections.legend && (
            <div className="p-4 space-y-4 bg-white">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-2 block">Skala Import Risk (0–1)</label>
                <div className="flex items-center gap-1">
                  {["#ecfeff", "#a5f3fc", "#38bdf8", "#0ea5e9", "#075985"].map((color) => (
                    <div
                      key={color}
                      className="flex-1 h-6 rounded transition-transform hover:scale-105"
                      style={{ background: color }}
                      title={`Risk level: ${color}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Rendah</span>
                  <span>Tinggi</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-2 block">Skala Volume Flow</label>
                <div className="bg-gradient-to-r from-blue-200 to-blue-600 h-6 rounded"></div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Rendah</span>
                  <span>{maxVolume ? `≤ ${maxVolume}` : "-"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-sm text-slate-800 mb-2 flex items-center gap-2">
            <span className="text-lg">📐</span>
            Rumus Import Risk
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">
              Import risk(to) = Σ [norm(volume_from_to) × risk(from)]
            </code>
            <br /><br />
            Volume dinormalisasi per timeKey, lalu hasilnya dinormalisasi lagi ke 0–1 untuk choropleth.
          </p>
        </div>

        {flowsEmpty && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-orange-800">Data Tidak Ditemukan</p>
                <p className="text-xs text-orange-700 mt-1">
                  Tidak ada flow agregat pada periode ini. Ubah timeKey atau turunkan minimum volume.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
