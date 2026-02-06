import { useMemo } from "react";

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

  return (
    <aside className="w-[360px] border-r bg-white p-4 overflow-auto">
      <div className="mb-3">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-slate-600">
          Privasi terjaga: alur mobilitas merupakan agregat wilayah, tanpa individu.
        </p>
      </div>

      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2">Layer Peta</h2>
        <label className="flex items-center gap-2 mb-2 text-sm">
          <input
            type="checkbox"
            checked={layers.flowArcs}
            onChange={(event) => setLayers({ ...layers, flowArcs: event.target.checked })}
          />
          <span>Flow Arcs (mobilitas agregat)</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={layers.importRisk}
            onChange={(event) => setLayers({ ...layers, importRisk: event.target.checked })}
          />
          <span>Import Risk Choropleth</span>
        </label>
      </section>

      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2">Filter Waktu & Intensitas</h2>
        <label className="text-xs text-slate-600">Periode analisis</label>
        <select
          className="w-full border rounded px-2 py-2 mb-3"
          value={timeKey}
          onChange={(event) => setTimeKey(event.target.value)}
        >
          {timeKeys.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>

        <div className="mb-3">
          <label className="text-sm">Minimum Volume</label>
          <input
            className="w-full"
            type="range"
            min="0"
            max={Math.max(maxVolume || 0, 1)}
            step="5"
            value={filters.minVolume}
            onChange={(event) =>
              setFilters({ ...filters, minVolume: Number(event.target.value) })
            }
          />
          <div className="text-xs text-slate-600">≥ {filters.minVolume}</div>
        </div>

        <div className="mb-1">
          <label className="text-sm">Maksimum Arc Ditampilkan</label>
          <input
            className="w-full"
            type="range"
            min="5"
            max="200"
            step="5"
            value={filters.maxArcs}
            onChange={(event) => setFilters({ ...filters, maxArcs: Number(event.target.value) })}
          />
          <div className="text-xs text-slate-600">Top {filters.maxArcs} arus terbesar</div>
        </div>
      </section>

      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2">Explainability: Top 5 Sumber Import Risk</h2>
        {!activeAreaId ? (
          <p className="text-xs text-slate-600">
            Arahkan kursor atau klik wilayah untuk melihat kontributor utama import risk.
          </p>
        ) : contributions.length ? (
          <div className="space-y-2">
            <div className="text-xs text-slate-600">
              Target: {areaNameById[activeAreaId] || activeAreaId}
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
                  className={`w-full text-left rounded border p-2 text-xs transition ${
                    isSelected ? "border-orange-400 bg-orange-50" : "border-slate-200"
                  }`}
                  onClick={() => onSelectFlow({ from: item.from, to: item.to })}
                >
                  <div className="font-semibold">
                    {areaNameById[item.from] || item.from}
                  </div>
                  <div className="text-slate-600">
                    Kontribusi: {formatPercent(percent)} · Volume: {item.volume}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-600">
            Tidak ada arus masuk untuk wilayah ini pada periode tersebut.
          </p>
        )}
      </section>

      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2">Legenda</h2>
        <div className="text-xs text-slate-600 mb-1">Skala Import Risk (0–1)</div>
        <div className="grid grid-cols-5 gap-1 mb-3">
          {["#ecfeff", "#a5f3fc", "#38bdf8", "#0ea5e9", "#075985"].map((color) => (
            <div key={color} className="h-3 rounded" style={{ background: color }} />
          ))}
        </div>
        <div className="text-xs text-slate-600 mb-1">Skala Volume Flow</div>
        <div className="flex items-center justify-between text-xs text-slate-700">
          <span>Rendah</span>
          <span>{maxVolume ? `≤ ${maxVolume}` : "-"}</span>
        </div>
      </section>

      <section className="mb-4 p-3 rounded border bg-slate-50">
        <h2 className="text-sm font-semibold mb-1">Rumus Import Risk</h2>
        <p className="text-xs text-slate-600">
          Import risk(to) = Σ [norm(volume_from_to) × risk(from)]. Volume dinormalisasi per
          timeKey, lalu hasilnya dinormalisasi lagi ke 0–1 untuk choropleth.
        </p>
      </section>

      {flowsEmpty && (
        <div className="mt-4 text-xs text-orange-700 bg-orange-50 border border-orange-200 p-2 rounded">
          Tidak ada flow agregat pada periode ini. Ubah timeKey atau turunkan minimum volume.
        </div>
      )}
    </aside>
  );
}
