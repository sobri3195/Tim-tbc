import { useEffect, useMemo, useState } from "react";
import MapView from "./components/MapView.jsx";
import MobilitySidebar from "./components/MobilitySidebar.jsx";
import { buildCentroidById } from "./utils/centroid.js";
import { computeImportRisk, getRiskValue } from "./utils/importRisk.js";
import { computeRiskScore } from "./utils/scoring.js";

export default function App() {
  const [areas, setAreas] = useState(null);
  const [flows, setFlows] = useState([]);
  const [ts, setTs] = useState({});
  const [timeKey, setTimeKey] = useState("");

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

  useEffect(() => {
    Promise.all([
      fetch("/data/areas.geojson").then((r) => r.json()),
      fetch("/data/flows.json").then((r) => r.json()).catch(() => []),
      fetch("/data/timeseries.json").then((r) => r.json()).catch(() => ({})),
    ]).then(([a, fl, t]) => {
      setAreas(a);
      setFlows(fl);
      setTs(t);
      const keys = Object.keys(t || {});
      if (keys.length) setTimeKey(keys[0]);
    });
  }, []);

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
    [flows, timeKey],
  );

  const maxVolumeForTime = useMemo(
    () => Math.max(0, ...flowsForTime.map((flow) => flow.volume || 0)),
    [flowsForTime],
  );

  const filteredFlows = useMemo(() => {
    return [...flowsForTime]
      .filter((flow) => (flow.volume || 0) >= filters.minVolume)
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, filters.maxArcs);
  }, [flowsForTime, filters.minVolume, filters.maxArcs]);

  const { importRiskById, contributionsByTo } = useMemo(
    () => computeImportRisk(filteredFlows, riskById),
    [filteredFlows, riskById],
  );

  const activeAreaId = hoveredAreaId || selectedAreaId;

  useEffect(() => {
    setSelectedFlow(null);
  }, [timeKey, filters.minVolume, filters.maxArcs]);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
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

      <div className="flex-1 min-h-[60vh] lg:min-h-0">
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
      </div>
    </div>
  );
}
