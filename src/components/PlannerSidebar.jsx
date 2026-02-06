import { useState, useCallback, useRef, useEffect } from "react";

const INTERVENTION_TYPES = [
  { value: "Screening", label: "Screening", color: "#3b82f6", icon: "🔍" },
  { value: "Edukasi", label: "Edukasi", color: "#10b981", icon: "📚" },
  { value: "Tracing", label: "Tracing", color: "#f59e0b", icon: "👣" },
];

const RADIUS_OPTIONS = [
  { value: 0.5, label: "500 m" },
  { value: 1, label: "1 km" },
  { value: 1.5, label: "1.5 km" },
  { value: 2, label: "2 km" },
  { value: 3, label: "3 km" },
];

const TRAVEL_TIME_OPTIONS = [
  { value: null, label: "Tidak diatur" },
  { value: 15, label: "15 menit" },
  { value: 30, label: "30 menit" },
  { value: 45, label: "45 menit" },
  { value: 60, label: "60 menit" },
];

export default function PlannerSidebar({
  // Mode
  mode,
  setMode,

  // Pins
  pins,
  onAddPin,
  onRemovePin,
  onReorderPins,
  onZoomToPin,

  // Coverage stats
  coverageStats,

  // Recommendations
  recommendations,
  onAcceptRecommendation,
  onZoomToRecommendation,

  // Actions
  onUndo,
  canUndo,
  onClear,
  onExport,
  onImport,
  lastSaved,

  // UI state
  selectedPinId,
  onSelectPin,
}) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "Screening",
    radiusKm: 1,
    travelTimeMinutes: null,
    notes: "",
  });
  const [importError, setImportError] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const handleAddClick = useCallback(() => {
    setShowForm(true);
    onSelectPin(null);
  }, [onSelectPin]);

  const handleFormSubmit = useCallback(
    (e) => {
      e.preventDefault();
      onAddPin(formData);
      setShowForm(false);
      setFormData({
        type: "Screening",
        radiusKm: 1,
        travelTimeMinutes: null,
        notes: "",
      });
    },
    [onAddPin, formData]
  );

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImportError(null);
      const success = await onImport(file);

      if (!success) {
        setImportError("Gagal mengimpor file. Pastikan format JSON benar.");
      }

      // Reset file input
      e.target.value = "";
    },
    [onImport]
  );

  const handleClearConfirm = useCallback(() => {
    onClear();
    setShowClearConfirm(false);
  }, [onClear]);

  const handleRecommendationClick = useCallback(
    (rec) => {
      onZoomToRecommendation?.(rec);
    },
    [onZoomToRecommendation]
  );

  const handleAcceptRecommendation = useCallback(
    (rec) => {
      onAcceptRecommendation?.(rec);
    },
    [onAcceptRecommendation]
  );

  const getTypeInfo = (type) =>
    INTERVENTION_TYPES.find((t) => t.value === type) || INTERVENTION_TYPES[0];

  const formatNumber = (num) => num?.toLocaleString("id-ID") || "0";

  return (
    <aside className="w-full lg:w-[380px] border-r bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-white">
        <h1 className="text-lg font-bold text-slate-800">🎯 Intervention Planner</h1>
        <p className="text-xs text-slate-500 mt-1">
          Alat perencanaan program TBC — bukan pelacakan individu
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Ethics Disclaimer Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <div className="flex items-start gap-2">
            <span className="text-lg">🛡️</span>
            <div>
              <strong className="block mb-1">Pernyataan Etik</strong>
              <p>
                Alat ini untuk perencanaan program publik. Data yang ditampilkan bersifat agregat
                wilayah (grid/kelurahan). Tidak ada data personal atau alamat individu.
              </p>
            </div>
          </div>
        </div>

        {/* Mode Switch */}
        <div className="bg-slate-100 rounded-lg p-1 flex">
          <button
            onClick={() => setMode("browse")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
              mode === "browse"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            🔍 Browse
          </button>
          <button
            onClick={() => setMode("planning")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
              mode === "planning"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            📍 Planning
          </button>
        </div>

        {mode === "planning" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>Mode Planning Aktif</strong>
            <p className="text-xs mt-1">Klik pada peta untuk menambahkan titik intervensi</p>
          </div>
        )}

        {/* Add Intervention Form */}
        <div className="border rounded-lg overflow-hidden">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition"
          >
            <span className="font-medium text-sm">➕ Tambah Intervensi Manual</span>
            <span className="text-slate-400">{showForm ? "▲" : "▼"}</span>
          </button>

          {showForm && (
            <form onSubmit={handleFormSubmit} className="p-4 space-y-3 border-t">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Tipe Intervensi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {INTERVENTION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`py-2 px-2 rounded-lg text-xs font-medium transition border ${
                        formData.type === type.value
                          ? "border-current bg-opacity-10"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      style={{
                        color: type.color,
                        backgroundColor:
                          formData.type === type.value ? `${type.color}20` : "white",
                      }}
                    >
                      <span className="block text-lg mb-1">{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Radius Cakupan
                </label>
                <select
                  value={formData.radiusKm}
                  onChange={(e) =>
                    setFormData({ ...formData, radiusKm: parseFloat(e.target.value) })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {RADIUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Estimasi Waktu Tempuh (opsional)
                </label>
                <select
                  value={formData.travelTimeMinutes || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      travelTimeMinutes: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {TRAVEL_TIME_OPTIONS.map((opt) => (
                    <option key={opt.value ?? "null"} value={opt.value ?? ""}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Catatan (opsional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Tambahkan catatan singkat..."
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Tambah ke Rencana
              </button>
            </form>
          )}
        </div>

        {/* Recommendations Section */}
        {recommendations && recommendations.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-white border-b">
              <h3 className="font-medium text-sm text-slate-800">💡 Rekomendasi Prioritas</h3>
              <p className="text-xs text-slate-500">5 titik berisiko tinggi belum tercakup</p>
            </div>
            <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
              {recommendations.map((rec) => (
                <div
                  key={rec.gridId}
                  className="p-3 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold"
                        title={`Prioritas #${rec.rank}`}
                      >
                        {rec.rank}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{rec.gridId}</p>
                        <p className="text-xs text-slate-500">{rec.reason}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-purple-700">
                      {rec.score.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleRecommendationClick(rec)}
                      className="flex-1 py-1.5 px-2 text-xs bg-white border rounded hover:bg-slate-50 transition"
                    >
                      🔍 Lihat di Peta
                    </button>
                    <button
                      onClick={() => handleAcceptRecommendation(rec)}
                      className="flex-1 py-1.5 px-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                    >
                      ➕ Tambah Pin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pin List */}
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
            <h3 className="font-medium text-sm text-slate-800">
              📍 Daftar Titik Intervensi ({pins.length})
            </h3>
          </div>

          {pins.length === 0 ? (
            <div className="p-6 text-center">
              <span className="text-4xl block mb-2">📍</span>
              <p className="text-sm text-slate-500">Belum ada titik intervensi</p>
              <p className="text-xs text-slate-400 mt-1">
                {mode === "planning"
                  ? "Klik pada peta atau tambah manual"
                  : "Aktifkan mode Planning untuk menambah"}
              </p>
            </div>
          ) : (
            <div className="divide-y max-h-64 overflow-y-auto">
              {pins.map((pin, index) => {
                const typeInfo = getTypeInfo(pin.type);
                const isSelected = selectedPinId === pin.id;

                return (
                  <div
                    key={pin.id}
                    className={`p-3 hover:bg-slate-50 transition cursor-pointer ${
                      isSelected ? "bg-blue-50 border-l-4 border-blue-500" : ""
                    }`}
                    onClick={() => {
                      onSelectPin(pin.id);
                      onZoomToPin(pin);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                          style={{ backgroundColor: typeInfo.color, color: "white" }}
                        >
                          {typeInfo.icon}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {typeInfo.label} #{index + 1}
                          </p>
                          <p className="text-xs text-slate-500">
                            {pin.radiusKm} km
                            {pin.travelTimeMinutes && ` · ${pin.travelTimeMinutes} menit`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemovePin(pin.id);
                        }}
                        className="text-slate-400 hover:text-red-500 transition p-1"
                        title="Hapus"
                      >
                        ✕
                      </button>
                    </div>
                    {pin.notes && (
                      <p className="text-xs text-slate-500 mt-1 ml-7 line-clamp-2">{pin.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Coverage Summary */}
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-white border-b">
            <h3 className="font-medium text-sm text-slate-800">📊 Ringkasan Cakupan</h3>
          </div>
          <div className="p-4 space-y-3">
            {coverageStats ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-slate-800">{pins.length}</p>
                    <p className="text-xs text-slate-500">Total Titik</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-slate-800">
                      {coverageStats.coveragePercent}%
                    </p>
                    <p className="text-xs text-slate-500">Cakupan Total</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Grid Tercakup</span>
                    <span className="font-medium">
                      {formatNumber(coverageStats.coveredGrids)} /{" "}
                      {formatNumber(coverageStats.totalGrids)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${coverageStats.coveragePercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Area Berisiko Tercakup</span>
                    <span className="font-medium">
                      {coverageStats.highRiskCoveragePercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${coverageStats.highRiskCoveragePercent}%` }}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600">Estimasi Populasi Tercakup</p>
                  <p className="text-lg font-bold text-blue-700">
                    {formatNumber(coverageStats.estimatedPopulation)} jiwa
                  </p>
                  <p className="text-xs text-slate-500">
                    dari total {formatNumber(coverageStats.totalPopulation)} jiwa
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">Tambahkan pin untuk melihat statistik</p>
              </div>
            )}
          </div>
        </div>

        {/* Import Error */}
        {importError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            ⚠️ {importError}
          </div>
        )}

        {/* Clear Confirmation */}
        {showClearConfirm && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800 mb-2">
              Yakin ingin menghapus semua titik intervensi?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClearConfirm}
                className="flex-1 py-1.5 px-3 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-1.5 px-3 text-xs border rounded hover:bg-slate-50 transition"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t bg-slate-50 p-4 space-y-3">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="py-2 px-3 text-sm border rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            ↩️ Undo
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={pins.length === 0}
            className="py-2 px-3 text-sm border rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            🗑️ Clear
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExport}
            disabled={pins.length === 0}
            className="py-2 px-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            📥 Export JSON
          </button>
          <button
            onClick={handleImportClick}
            className="py-2 px-3 text-sm border rounded-lg hover:bg-white transition flex items-center justify-center gap-1"
          >
            📤 Import JSON
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Autosave Status */}
        {lastSaved && (
          <p className="text-center text-xs text-slate-400">
            Terakhir disimpan: {lastSaved.toLocaleTimeString("id-ID")}
          </p>
        )}
      </div>
    </aside>
  );
}
