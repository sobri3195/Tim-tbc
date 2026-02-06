export default function ClusterSidebar({
  title,
  riskThreshold,
  epsKm,
  minPts,
  setRiskThreshold,
  setEpsKm,
  setMinPts,
  onRun,
  showPoints,
  showHulls,
  setShowPoints,
  setShowHulls,
  clusters,
  selectedClusterId,
  onSelectCluster,
  dataStatus,
}) {
  const sortedClusters = [...clusters].sort((a, b) => b.stats.confidence - a.stats.confidence);

  return (
    <aside className="w-full lg:w-[360px] border-b lg:border-b-0 lg:border-r bg-white p-4 overflow-auto">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-slate-600">Agregat saja, tidak ada data individu.</p>
      </div>

      <section className="mb-4 rounded border bg-slate-50 p-3">
        <h2 className="text-sm font-semibold mb-1">Privasi</h2>
        <p className="text-xs text-slate-700">
          Analisis hanya menggunakan agregat grid. Tidak ada penelusuran individu atau alamat pribadi.
        </p>
      </section>

      <section className="mb-5">
        <h2 className="text-sm font-semibold mb-2">Cluster Parameters</h2>

        <div className="mb-3">
          <label className="text-sm">Risk Threshold</label>
          <input
            className="w-full"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={riskThreshold}
            onChange={(e) => setRiskThreshold(Number(e.target.value))}
          />
          <div className="text-xs text-slate-600">Grid dengan risk ≥ {riskThreshold.toFixed(2)}</div>
        </div>

        <div className="mb-3">
          <label className="text-sm">Eps (km)</label>
          <input
            className="w-full border rounded px-2 py-2"
            type="number"
            min="0.1"
            step="0.1"
            value={epsKm}
            onChange={(e) => setEpsKm(Number(e.target.value))}
          />
          <div className="text-xs text-slate-600">Radius tetangga untuk DBSCAN-like.</div>
        </div>

        <div className="mb-4">
          <label className="text-sm">Min Points</label>
          <input
            className="w-full border rounded px-2 py-2"
            type="number"
            min="2"
            step="1"
            value={minPts}
            onChange={(e) => setMinPts(Number(e.target.value))}
          />
          <div className="text-xs text-slate-600">Jumlah minimum grid agar jadi cluster.</div>
        </div>

        <button
          className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800"
          type="button"
          onClick={onRun}
        >
          Temukan Klaster
        </button>
      </section>

      <section className="mb-5">
        <h2 className="text-sm font-semibold mb-2">Layer Controls</h2>
        <label className="flex items-center gap-2 mb-2">
          <input type="checkbox" checked={showPoints} onChange={(e) => setShowPoints(e.target.checked)} />
          <span>Tampilkan titik grid berisiko</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showHulls} onChange={(e) => setShowHulls(e.target.checked)} />
          <span>Tampilkan polygon cluster (hull)</span>
        </label>
      </section>

      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2">Hasil Cluster (Ranking)</h2>

        {!dataStatus.isReady && (
          <div className="text-xs text-slate-600">Data grid belum tersedia. Pastikan file data terisi.</div>
        )}

        {dataStatus.isReady && clusters.length === 0 && (
          <div className="text-xs text-slate-600">
            Tidak ada cluster yang lolos threshold. Coba turunkan risk threshold atau eps.
          </div>
        )}

        {sortedClusters.map((cluster, idx) => (
          <button
            key={`cluster-item-${cluster.id}`}
            type="button"
            onClick={() => onSelectCluster(cluster.id)}
            className={`w-full text-left border rounded p-2 mb-2 ${
              selectedClusterId === cluster.id ? "border-slate-900 bg-slate-50" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">#{idx + 1} · Cluster {cluster.id}</div>
              <div className="text-xs text-slate-600">Confidence {cluster.stats.confidence.toFixed(2)}</div>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Avg risk {cluster.stats.avgRisk.toFixed(2)} · Gap {cluster.stats.gapIndex.toFixed(2)}
            </div>
            <div className="text-xs text-slate-600">
              Suspect {cluster.stats.sumSuspect} · Diagnosis {cluster.stats.sumDiag}
            </div>
          </button>
        ))}
      </section>
    </aside>
  );
}
