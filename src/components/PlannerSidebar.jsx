import { useState, useCallback, useRef, useEffect } from "react";

const INTERVENTION_TYPES = [
  { value: "Screening", label: "Screening", color: "#3b82f6", icon: "🔍", desc: "Deteksi dini kasus TBC" },
  { value: "Edukasi", label: "Edukasi", color: "#10b981", icon: "📚", desc: "Sosialisasi pencegahan TBC" },
  { value: "Tracing", label: "Tracing", color: "#f59e0b", icon: "👣", desc: "Pelacakan kontak erat" },
];

const RADIUS_OPTIONS = [
  { value: 0.5, label: "500 m", desc: "Area terbatas" },
  { value: 1, label: "1 km", desc: "Area standar" },
  { value: 1.5, label: "1.5 km", desc: "Area luas" },
  { value: 2, label: "2 km", desc: "Area sangat luas" },
  { value: 3, label: "3 km", desc: "Area maksimal" },
];

const TRAVEL_TIME_OPTIONS = [
  { value: null, label: "Tidak diatur", desc: "Tanpa batasan waktu" },
  { value: 15, label: "15 menit", desc: "Jarak dekat" },
  { value: 30, label: "30 menit", desc: "Jarak sedang" },
  { value: 45, label: "45 menit", desc: "Jarak jauh" },
  { value: 60, label: "60 menit", desc: "Jarak sangat jauh" },
];

const DATA_FLOW_STEPS = [
  { id: 1, label: "Pilih Tipe", icon: "1️⃣", desc: "Tentukan jenis intervensi" },
  { id: 2, label: "Atur Area", icon: "2️⃣", desc: "Set radius dan waktu" },
  { id: 3, label: "Tambah Catatan", icon: "3️⃣", desc: "Opsional: detail tambahan" },
  { id: 4, label: "Simpan", icon: "4️⃣", desc: "Konfirmasi lokasi di peta" },
];

export default function PlannerSidebar({
  // Mode
  mode,
  setMode,

  // Pins
  pins,
  onAddPin,
  onRemovePin,
  onUpdatePin,
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPinId, setEditingPinId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    type: "Screening",
    radiusKm: 1,
    travelTimeMinutes: null,
    notes: "",
  });
  const [importError, setImportError] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const fileInputRef = useRef(null);

  const handleAddClick = useCallback(() => {
    setIsEditMode(false);
    setEditingPinId(null);
    setCurrentStep(1);
    setShowForm(true);
    onSelectPin(null);
    setFormData({
      type: "Screening",
      radiusKm: 1,
      travelTimeMinutes: null,
      notes: "",
    });
  }, [onSelectPin]);

  const handleEditClick = useCallback(
    (pin) => {
      setIsEditMode(true);
      setEditingPinId(pin.id);
      setCurrentStep(1);
      setShowForm(true);
      setFormData({
        type: pin.type,
        radiusKm: pin.radiusKm,
        travelTimeMinutes: pin.travelTimeMinutes || null,
        notes: pin.notes || "",
      });
    },
    []
  );

  const handleFormSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (isEditMode && editingPinId) {
        onUpdatePin?.(editingPinId, formData);
      } else {
        onAddPin(formData);
      }
      setShowForm(false);
      setIsEditMode(false);
      setEditingPinId(null);
      setCurrentStep(1);
      setFormData({
        type: "Screening",
        radiusKm: 1,
        travelTimeMinutes: null,
        notes: "",
      });
    },
    [onAddPin, onUpdatePin, formData, isEditMode, editingPinId]
  );

  const handleCancelForm = useCallback(() => {
    setShowForm(false);
    setIsEditMode(false);
    setEditingPinId(null);
    setCurrentStep(1);
    setFormData({
      type: "Screening",
      radiusKm: 1,
      travelTimeMinutes: null,
      notes: "",
    });
  }, []);

  const toggleSection = useCallback((sectionId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

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
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 transition"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{isEditMode ? "✏️" : "➕"}</span>
              <span className="font-semibold text-sm text-slate-800">
                {isEditMode ? "Edit Intervensi" : "Tambah Intervensi"}
              </span>
            </div>
            <span className="text-slate-400 transform transition-transform" style={{ transform: showForm ? "rotate(180deg)" : "" }}>▼</span>
          </button>

          {showForm && (
            <form onSubmit={handleFormSubmit} className="p-4 space-y-4 border-t bg-white">
              {/* Data Flow Steps Indicator */}
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600">Alur Pendataan</span>
                  <span className="text-xs text-slate-400">Langkah {currentStep} dari {DATA_FLOW_STEPS.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  {DATA_FLOW_STEPS.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                          currentStep > step.id
                            ? "bg-green-500 text-white"
                            : currentStep === step.id
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {currentStep > step.id ? "✓" : step.icon}
                      </div>
                      {index < DATA_FLOW_STEPS.length - 1 && (
                        <div
                          className={`w-4 h-0.5 transition-all ${
                            currentStep > step.id ? "bg-green-500" : "bg-slate-200"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-center">
                  <span className="text-xs font-medium text-blue-700">{DATA_FLOW_STEPS[currentStep - 1].label}</span>
                  <p className="text-xs text-slate-500">{DATA_FLOW_STEPS[currentStep - 1].desc}</p>
                </div>
              </div>

              {/* Step 1: Tipe Intervensi */}
              <div className={`transition-all ${currentStep !== 1 ? "opacity-50" : ""}`}>
                <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                  Tipe Intervensi
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {INTERVENTION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, type: type.value });
                        setCurrentStep(2);
                      }}
                      className={`p-3 rounded-lg text-sm font-medium transition-all border-2 ${
                        formData.type === type.value
                          ? "border-current shadow-md transform scale-[1.02]"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      style={{
                        color: type.color,
                        backgroundColor:
                          formData.type === type.value ? `${type.color}10` : "white",
                        borderColor: formData.type === type.value ? type.color : "",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div className="text-left">
                          <div className="font-semibold">{type.label}</div>
                          <div className="text-xs opacity-70">{type.desc}</div>
                        </div>
                        {formData.type === type.value && <span className="ml-auto text-lg">✓</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Atur Area */}
              <div className={`transition-all ${currentStep !== 2 ? "opacity-50" : ""}`}>
                <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                  Radius Cakupan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {RADIUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, radiusKm: opt.value })}
                      className={`p-2 rounded-lg text-xs font-medium transition-all border-2 text-center ${
                        formData.radiusKm === opt.value
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-semibold text-slate-700 mt-4 mb-2 flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">⏱️</span>
                  Waktu Tempuh (opsional)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TRAVEL_TIME_OPTIONS.map((opt) => (
                    <button
                      key={opt.value ?? "null"}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          travelTimeMinutes: opt.value,
                        })
                      }
                      className={`p-2 rounded-lg text-xs font-medium transition-all border-2 text-center ${
                        (formData.travelTimeMinutes || null) === opt.value
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Catatan */}
              <div className={`transition-all ${currentStep !== 3 ? "opacity-50" : ""}`}>
                <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs">3</span>
                  Catatan Tambahan
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Tambahkan catatan atau detail penting..."
                  rows={3}
                  className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition resize-none"
                />
              </div>

              {/* Step 4: Simpan */}
              <div className={`transition-all ${currentStep !== 4 ? "opacity-50" : ""}`}>
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📍</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-700">
                        {isEditMode ? "Update Intervensi" : "Konfirmasi Lokasi"}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {isEditMode
                          ? "Klik Simpan untuk memperbarui data intervensi yang dipilih."
                          : mode === "planning"
                          ? "Klik pada peta untuk menentukan lokasi, atau klik Simpan untuk menambahkan dengan posisi saat ini."
                          : "Aktifkan mode Planning untuk memilih lokasi di peta."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-2 pt-2">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition flex items-center justify-center gap-2"
                  >
                    ← Kembali
                  </button>
                )}
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    Lanjut →
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition shadow-md flex items-center justify-center gap-2"
                    >
                      {isEditMode ? "💾 Update" : "✅ Simpan"}
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Recommendations Section */}
        {recommendations && recommendations.length > 0 && (
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => toggleSection("recommendations")}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-white hover:from-purple-100 hover:to-purple-50 transition flex items-center justify-between border-b"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">💡</span>
                <div>
                  <h3 className="font-semibold text-sm text-slate-800">Rekomendasi Prioritas</h3>
                  <p className="text-xs text-slate-500">{recommendations.length} titik berisiko tinggi</p>
                </div>
              </div>
              <span className="text-slate-400 transform transition-transform" style={{ transform: collapsedSections.recommendations ? "rotate(-90deg)" : "" }}>▼</span>
            </button>

            {!collapsedSections.recommendations && (
              <div className="p-2 space-y-2 max-h-72 overflow-y-auto bg-white">
                {recommendations.map((rec) => (
                  <div
                    key={rec.gridId}
                    className="p-3 rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:from-purple-100 hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold shadow-sm"
                          title={`Prioritas #${rec.rank}`}
                        >
                          {rec.rank}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800">{rec.gridId}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{rec.reason}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                          {rec.score.toFixed(2)}
                        </span>
                        <span className="text-xs text-red-600 mt-1">
                          {(rec.risk * 100).toFixed(0)}% risiko
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleRecommendationClick(rec)}
                        className="flex-1 py-2 px-3 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition flex items-center justify-center gap-1"
                      >
                        🔍 Lihat
                      </button>
                      <button
                        onClick={() => handleAcceptRecommendation(rec)}
                        className="flex-1 py-2 px-3 text-xs font-medium bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition shadow-sm flex items-center justify-center gap-1"
                      >
                        ➕ Tambah
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pin List */}
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection("pinList")}
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between border-b"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📍</span>
              <h3 className="font-semibold text-sm text-slate-800">
                Daftar Titik Intervensi ({pins.length})
              </h3>
            </div>
            <span className="text-slate-400 transform transition-transform" style={{ transform: collapsedSections.pinList ? "rotate(-90deg)" : "" }}>▼</span>
          </button>

          {!collapsedSections.pinList && (
            <div className="p-2 bg-white">
              {pins.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-3xl">📍</span>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Belum ada titik intervensi</p>
                  <p className="text-xs text-slate-400 mb-3">
                    {mode === "planning"
                      ? "Klik pada peta atau tambah manual"
                      : "Aktifkan mode Planning untuk menambah"}
                  </p>
                  <button
                    onClick={handleAddClick}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                  >
                    ➕ Tambah Titik
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {pins.map((pin, index) => {
                    const typeInfo = getTypeInfo(pin.type);
                    const isSelected = selectedPinId === pin.id;

                    return (
                      <div
                        key={pin.id}
                        className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className="flex items-center gap-2 flex-1"
                            onClick={() => {
                              onSelectPin(pin.id);
                              onZoomToPin(pin);
                            }}
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm"
                              style={{ backgroundColor: typeInfo.color, color: "white" }}
                            >
                              {typeInfo.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                  {typeInfo.label}
                                </p>
                                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-xs rounded">
                                  #{index + 1}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <span>📐</span> {pin.radiusKm} km
                                </span>
                                {pin.travelTimeMinutes && (
                                  <span className="flex items-center gap-1">
                                    <span>⏱️</span> {pin.travelTimeMinutes} menit
                                  </span>
                                )}
                              </div>
                              {pin.notes && (
                                <p className="text-xs text-slate-600 mt-1 truncate">
                                  📝 {pin.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(pin);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemovePin(pin.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Hapus"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Coverage Summary */}
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection("coverage")}
            className="w-full px-4 py-3 bg-gradient-to-r from-green-50 to-white hover:from-green-100 hover:to-green-50 transition flex items-center justify-between border-b"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h3 className="font-semibold text-sm text-slate-800">Ringkasan Cakupan</h3>
            </div>
            <span className="text-slate-400 transform transition-transform" style={{ transform: collapsedSections.coverage ? "rotate(-90deg)" : "" }}>▼</span>
          </button>

          {!collapsedSections.coverage && (
            <div className="p-4 space-y-4 bg-white">
              {coverageStats ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
                      <p className="text-3xl font-bold text-blue-700">{pins.length}</p>
                      <p className="text-xs font-medium text-blue-600 mt-1">Total Titik</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
                      <p className="text-3xl font-bold text-green-700">
                        {coverageStats.coveragePercent}%
                      </p>
                      <p className="text-xs font-medium text-green-600 mt-1">Cakupan Total</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-slate-700">Grid Tercakup</span>
                        <span className="font-bold text-slate-800">
                          {formatNumber(coverageStats.coveredGrids)} /{" "}
                          {formatNumber(coverageStats.totalGrids)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${coverageStats.coveragePercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-slate-700">Area Berisiko Tercakup</span>
                        <span className="font-bold text-orange-600">
                          {coverageStats.highRiskCoveragePercent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${coverageStats.highRiskCoveragePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg">
                        👥
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-600 mb-1">Estimasi Populasi Tercakup</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {formatNumber(coverageStats.estimatedPopulation)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          dari total {formatNumber(coverageStats.totalPopulation)} jiwa
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-3xl">📊</span>
                  </div>
                  <p className="text-sm text-slate-500">Tambahkan pin untuk melihat statistik</p>
                </div>
              )}
            </div>
          )}
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
