export default function Legend({ selected }) {
  return (
    <div className="absolute right-3 top-3 w-[320px] rounded border bg-white p-3 shadow">
      <div className="text-sm font-semibold mb-1">Legenda</div>
      <div className="text-xs text-slate-600 mb-2">Risiko Hidden Cluster (0–1)</div>

      <div className="grid grid-cols-5 gap-1 mb-3">
        {["#fee2e2","#fca5a5","#ef4444","#b91c1c","#7f1d1d"].map((c) => (
          <div key={c} className="h-3 rounded" style={{ background: c }} />
        ))}
      </div>

      <div className="text-sm font-semibold mb-1">Explain (klik area)</div>
      {!selected ? (
        <div className="text-xs text-slate-600">
          Klik wilayah untuk melihat ringkasan sinyal: suspect, diagnosis, kunjungan, dan skor risiko.
        </div>
      ) : (
        <div className="text-xs text-slate-700 space-y-1">
          <div className="font-semibold">{selected.properties?.name}</div>
          <div>Risk: {(selected.properties?.risk ?? 0).toFixed(2)}</div>
          <div>Suspect visits: {selected.properties?.suspectVisits ?? "-"}</div>
          <div>TB diagnosed: {selected.properties?.tbDiagnosed ?? "-"}</div>
          <div>Facility visits: {selected.properties?.facilityVisits ?? "-"}</div>
          <div>Density idx: {selected.properties?.densityIdx ?? "-"}</div>
        </div>
      )}
    </div>
  );
}
