import { useEffect, useMemo, useState, useCallback } from "react";
import MapView from "./components/MapView.jsx";
import MobilitySidebar from "./components/MobilitySidebar.jsx";
import PlannerSidebar from "./components/PlannerSidebar.jsx";
import PlannerLayer from "./components/PlannerLayer.jsx";
import AreaLayer from "./components/AreaLayer.jsx";
import { MapContainer, TileLayer } from "react-leaflet";
import { buildCentroidById } from "./utils/centroid.js";
import { computeImportRisk, getRiskValue } from "./utils/importRisk.js";
import { computeRiskScore } from "./utils/scoring.js";
import {
  calculateCoverageStats,
  getCoverageSets,
} from "./utils/coverage.js";
import {
  generateRecommendations,
} from "./utils/recommend.js";
import {
  createEmptyPlan,
  createPin,
  savePlan,
  loadPlan,
  downloadPlan,
  importPlanFromFile,
  saveToHistory,
  undo,
  canUndo as checkCanUndo,
} from "./utils/storage.js";

// View modes
const VIEWS = {
  MOBILITY: "mobility",
  PLANNER: "planner",
};

export default function App() {
  // ==================== DATA LOADING ====================
  const [areas, setAreas] = useState(null);
  const [flows, setFlows] = useState([]);
  const [ts, setTs] = useState({});
  const [grids, setGrids] = useState([]);
  const [timeKey, setTimeKey] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/data/areas.geojson").then((r) => r.json()),
      fetch("/data/flows.json").then((r) => r.json()).catch(() => []),
      fetch("/data/timeseries.json").then((r) => r.json()).catch(() => ({})),
      fetch("/data/grid.geojson").then((r) => r.json()).catch(() => ({ features: [] })),
    ]).then(([a, fl, t, g]) => {
      setAreas(a);
      setFlows(fl);
      setTs(t);
      setGrids(g.features || []);
      const keys = Object.keys(t || {});
      if (keys.length) setTimeKey(keys[0]);
    });
  }, []);

  // ==================== VIEW STATE ====================
  const [currentView, setCurrentView] = useState(VIEWS.PLANNER);

  // ==================== MOBILITY VIEW STATE ====================
  const [layers, setLayers] = useState({
    flowArcs: true,
    importRisk: true,
  });

  const [filters, setFilters] = useState({
    minVolume: 10,
    maxArcs: 80,
  });

  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [hoveredAreaId, setHoveredAreaId] = useState(null);
  const [selectedFlow, setSelectedFlow] = useState(null);

  // ==================== PLANNER STATE ====================
  const [plannerMode, setPlannerMode] = useState("browse"); // "browse" | "planning"
  const [plan, setPlan] = useState(() => loadPlan() || createEmptyPlan());
  const [selectedPinId, setSelectedPinId] = useState(null);
  const [zoomTarget, setZoomTarget] = useState(null);
  const [highlightedRecommendation, setHighlightedRecommendation] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [canUndoState, setCanUndoState] = useState(false);

  // Show coverage layer
  const [showCoverage, setShowCoverage] = useState(true);

  // ==================== COMPUTED VALUES ====================
  const timeKeys = useMemo(() => Object.keys(ts || {}), [ts]);
  const centroidById = useMemo(() => buildCentroidById(areas), [areas]);

  const riskById = useMemo(() => {
    const snapshot = ts?.[timeKey] || {};
    return Object.keys(snapshot).reduce((acc, id) => {
      acc[id] = getRiskValue(snapshot[id], computeRiskScore);
      return acc;
    }, {});
  }, [ts, timeKey]);

  const flowsForTime = useMemo(
    () => (flows || []).filter((flow) => flow.t === timeKey),
    [flows, timeKey]
  );

  const maxVolumeForTime = useMemo(
    () => Math.max(0, ...flowsForTime.map((flow) => flow.volume || 0)),
    [flowsForTime]
  );

  const filteredFlows = useMemo(() => {
    return [...flowsForTime]
      .filter((flow) => (flow.volume || 0) >= filters.minVolume)
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, filters.maxArcs);
  }, [flowsForTime, filters.minVolume, filters.maxArcs]);

  const { importRiskById, contributionsByTo } = useMemo(
    () => computeImportRisk(filteredFlows, riskById),
    [filteredFlows, riskById]
  );

  const activeAreaId = hoveredAreaId || selectedAreaId;

  // ==================== COVERAGE & RECOMMENDATIONS ====================
  const coverageStats = useMemo(() => {
    return calculateCoverageStats(grids, plan.pins, ts, timeKey);
  }, [grids, plan.pins, ts, timeKey]);

  const coverageSets = useMemo(() => {
    return getCoverageSets(grids, plan.pins);
  }, [grids, plan.pins]);

  const recommendations = useMemo(() => {
    return generateRecommendations(grids, ts, timeKey, coverageSets.covered, 5);
  }, [grids, ts, timeKey, coverageSets.covered]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    setSelectedFlow(null);
  }, [timeKey, filters.minVolume, filters.maxArcs]);

  // Autosave plan
  useEffect(() => {
    const success = savePlan(plan);
    if (success) {
      setLastSaved(new Date());
    }
  }, [plan]);

  // Check undo availability
  useEffect(() => {
    setCanUndoState(checkCanUndo());
  }, [plan]);

  // ==================== PLANNER ACTIONS ====================
  const handleAddPin = useCallback(
    (pinData) => {
      // Save to history before change
      saveToHistory(plan);

      const newPin = createPin(pinData.position || pinData, {
        type: pinData.type || "Screening",
        radiusKm: pinData.radiusKm || 1,
        travelTimeMinutes: pinData.travelTimeMinutes || null,
        notes: pinData.notes || "",
      });

      setPlan((prev) => ({
        ...prev,
        pins: [...prev.pins, newPin],
      }));

      setSelectedPinId(newPin.id);
    },
    [plan]
  );

  const handleRemovePin = useCallback(
    (pinId) => {
      saveToHistory(plan);
      setPlan((prev) => ({
        ...prev,
        pins: prev.pins.filter((p) => p.id !== pinId),
      }));
      if (selectedPinId === pinId) {
        setSelectedPinId(null);
      }
    },
    [plan, selectedPinId]
  );

  const handleUndo = useCallback(() => {
    const previousPlan = undo();
    if (previousPlan) {
      setPlan(previousPlan);
    }
  }, []);

  const handleClear = useCallback(() => {
    saveToHistory(plan);
    setPlan(createEmptyPlan());
    setSelectedPinId(null);
  }, [plan]);

  const handleExport = useCallback(() => {
    downloadPlan(plan, `intervention-plan-${new Date().toISOString().split("T")[0]}.json`);
  }, [plan]);

  const handleImport = useCallback(async (file) => {
    const imported = await importPlanFromFile(file);
    if (imported) {
      saveToHistory(plan);
      setPlan(imported);
      return true;
    }
    return false;
  }, [plan]);

  const handleZoomToPin = useCallback((pin) => {
    setZoomTarget(pin);
  }, []);

  const handleZoomToRecommendation = useCallback((rec) => {
    setHighlightedRecommendation(rec);
    setZoomTarget(rec);
  }, []);

  const handleAcceptRecommendation = useCallback(
    (rec) => {
      handleAddPin({
        position: rec.position,
        type: "Screening",
        radiusKm: 1,
        notes: `Rekomendasi #${rec.rank}: ${rec.reason}`,
      });
      setHighlightedRecommendation(null);
    },
    [handleAddPin]
  );

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* View Switcher Header (mobile) */}
      <div className="lg:hidden bg-white border-b p-2 flex gap-2">
        <button
          onClick={() => setCurrentView(VIEWS.MOBILITY)}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
            currentView === VIEWS.MOBILITY
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          🌊 Mobilitas
        </button>
        <button
          onClick={() => setCurrentView(VIEWS.PLANNER)}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
            currentView === VIEWS.PLANNER
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          🎯 Planner
        </button>
      </div>

      {/* Sidebar */}
      {currentView === VIEWS.MOBILITY ? (
        <MobilitySidebar
          title="TBC Hidden Cluster Map"
          timeKey={timeKey}
          timeKeys={timeKeys}
          setTimeKey={setTimeKey}
          layers={layers}
          setLayers={setLayers}
          filters={filters}
          setFilters={setFilters}
          areas={areas}
          activeAreaId={activeAreaId}
          contributionsByTo={contributionsByTo}
          selectedFlow={selectedFlow}
          onSelectFlow={setSelectedFlow}
          maxVolume={maxVolumeForTime}
          flowsEmpty={flowsForTime.length === 0}
        />
      ) : (
        <PlannerSidebar
          mode={plannerMode}
          setMode={setPlannerMode}
          pins={plan.pins}
          onAddPin={handleAddPin}
          onRemovePin={handleRemovePin}
          onZoomToPin={handleZoomToPin}
          coverageStats={coverageStats}
          recommendations={recommendations}
          onAcceptRecommendation={handleAcceptRecommendation}
          onZoomToRecommendation={handleZoomToRecommendation}
          onUndo={handleUndo}
          canUndo={canUndoState}
          onClear={handleClear}
          onExport={handleExport}
          onImport={handleImport}
          lastSaved={lastSaved}
          selectedPinId={selectedPinId}
          onSelectPin={setSelectedPinId}
        />
      )}

      {/* Map Container */}
      <div className="flex-1 min-h-[60vh] lg:min-h-0 relative">
        {currentView === VIEWS.MOBILITY ? (
          <MapView
            areas={areas}
            centroidById={centroidById}
            flows={filteredFlows}
            importRiskById={importRiskById}
            layers={layers}
            activeAreaId={activeAreaId}
            onHoverArea={setHoveredAreaId}
            onSelectArea={setSelectedAreaId}
            selectedFlow={selectedFlow}
            flowsEmpty={flowsForTime.length === 0}
          />
        ) : (
          <PlannerMap
            areas={areas}
            grids={grids}
            timeseriesData={ts}
            timeKey={timeKey}
            mode={plannerMode}
            pins={plan.pins}
            selectedPinId={selectedPinId}
            onSelectPin={setSelectedPinId}
            onAddPin={handleAddPin}
            onRemovePin={handleRemovePin}
            showCoverage={showCoverage}
            coverageSets={coverageSets}
            recommendations={recommendations}
            highlightedRecommendation={highlightedRecommendation}
            onAcceptRecommendation={handleAcceptRecommendation}
            zoomTarget={zoomTarget}
            onZoomComplete={() => setZoomTarget(null)}
            onHoverArea={setHoveredAreaId}
            onSelectArea={setSelectedAreaId}
            activeAreaId={activeAreaId}
          />
        )}

        {/* View Switcher (desktop) - Floating */}
        <div className="hidden lg:flex absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg border p-1 gap-1">
          <button
            onClick={() => setCurrentView(VIEWS.MOBILITY)}
            className={`py-2 px-4 rounded-md text-sm font-medium transition ${
              currentView === VIEWS.MOBILITY
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            🌊 Mobilitas
          </button>
          <button
            onClick={() => setCurrentView(VIEWS.PLANNER)}
            className={`py-2 px-4 rounded-md text-sm font-medium transition ${
              currentView === VIEWS.PLANNER
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            🎯 Planner
          </button>
        </div>

        {/* Coverage Toggle (Planner only) */}
        {currentView === VIEWS.PLANNER && (
          <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg border p-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showCoverage}
                onChange={(e) => setShowCoverage(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Tampilkan Layer Cakupan</span>
            </label>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span>Tercakup</span>
              <span className="w-3 h-3 rounded-full bg-red-500 ml-2"></span>
              <span>Belum tercakup</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Planner-specific map component
function PlannerMap({
  areas,
  grids,
  timeseriesData,
  timeKey,
  mode,
  pins,
  selectedPinId,
  onSelectPin,
  onAddPin,
  onRemovePin,
  showCoverage,
  coverageSets,
  recommendations,
  highlightedRecommendation,
  onAcceptRecommendation,
  zoomTarget,
  onZoomComplete,
  onHoverArea,
  onSelectArea,
  activeAreaId,
}) {
  const center = [-5.145, 119.42];
  const zoom = 13;

  return (
    <MapContainer className="h-full w-full" center={center} zoom={zoom} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Base areas layer */}
      <AreaLayer
        areas={areas}
        onHoverArea={onHoverArea}
        onSelectArea={onSelectArea}
        activeAreaId={activeAreaId}
      />

      {/* Planner layers */}
      <PlannerLayer
        mode={mode}
        grids={grids}
        timeseriesData={timeseriesData}
        timeKey={timeKey}
        pins={pins}
        selectedPinId={selectedPinId}
        onSelectPin={onSelectPin}
        onAddPin={onAddPin}
        onRemovePin={onRemovePin}
        showCoverage={showCoverage}
        coverageSets={coverageSets}
        recommendations={recommendations}
        highlightedRecommendation={highlightedRecommendation}
        onAcceptRecommendation={onAcceptRecommendation}
        zoomTarget={zoomTarget}
        onZoomComplete={onZoomComplete}
      />
    </MapContainer>
  );
}
