export default function Sidebar({
  title,
  timeKey,
  timeKeys,
  setTimeKey,
  layers,
  setLayers,
  filters,
  setFilters,
}) {
  return (
    <aside className="w-[360px] border-r bg-white p-4 overflow-auto">
      <div className="mb-3">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-slate-600">
          Privasi-terjaga: hanya data agregat, tanpa identitas individu.
        </p>
      </div>

      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2">Waktu</h2>
        <select
          className="w-full border rounded px-2 py-2"
          value={timeKey}
          onChange={(e) => setTimeKey(e.target.value)}
        >
          {timeKeys.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </section>

      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2">Layer</h2>

        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={layers.choropleth}
            onChange={(e) => setLayers({ ...layers, choropleth: e.target.checked })}
          />
          <span>Risiko Hidden Cluster (Choropleth)</span>
        </label>

        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={layers.facilities}
            onChange={(e) => setLayers({ ...layers, facilities: e.target.checked })}
          />
          <span>Fasilitas Kesehatan</span>
        </label>

        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={layers.flows}
            onChange={(e) => setLayers({ ...layers, flows: e.target.checked })}
          />
          <span>Mobilitas (OD Flows)</span>
        </label>
      </section>

      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2">Filter</h2>

        <div className="mb-3">
          <label className="text-sm">Minimum Risk</label>
          <input
            className="w-full"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={filters.minRisk}
            onChange={(e) => setFilters({ ...filters, minRisk: Number(e.target.value) })}
          />
          <div className="text-xs text-slate-600">≥ {filters.minRisk.toFixed(2)}</div>
        </div>

        <div className="mb-3">
          <label className="text-sm">Minimum Flow Volume</label>
          <input
            className="w-full"
            type="range"
            min="0"
            max="300"
            step="10"
            value={filters.minVolume}
            onChange={(e) => setFilters({ ...filters, minVolume: Number(e.target.value) })}
          />
          <div className="text-xs text-slate-600">≥ {filters.minVolume}</div>
        </div>
      </section>

      <section className="mt-6 p-3 rounded border bg-slate-50">
        <h2 className="text-sm font-semibold mb-1">Catatan Etik & Privasi</h2>
        <ul className="text-xs text-slate-700 list-disc pl-4 space-y-1">
          <li>Tidak menampilkan data individu (hanya agregat wilayah/grid).</li>
          <li>Nilai kecil sebaiknya di-bucket (mis. 0–4) saat data nyata.</li>
          <li>Layer ini untuk prioritas program, bukan diagnosis individu.</li>
        </ul>
      </section>
    </aside>
  );
}
