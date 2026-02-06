import { useCallback, useEffect, useMemo, useState } from "react";
import ClusterSidebar from "./components/ClusterSidebar.jsx";
import MapView from "./components/MapView.jsx";
import { computeRiskScore } from "./utils/scoring.js";
import { runDbscan } from "./utils/dbscan.js";

export default function App() {
  const [areas, setAreas] = useState(null);
  const [grid, setGrid] = useState(null);
  const [facilities, setFacilities] = useState(null);
  const [flows, setFlows] = useState([]);
  const [ts, setTs] = useState({});
  const [timeKey, setTimeKey] = useState("2024-01");

  const [layers] = useState({
    choropleth: true,
    facilities: true,
    flows: false,
  });

  const [filters] = useState({
    minVolume: 50,
    minRisk: 0.35,
  });

  const [clusterParams, setClusterParams] = useState({
    riskThreshold: 0.6,
    epsKm: 0.7,
    minPts: 3,
  });

  const [clusterOptions, setClusterOptions] = useState({
    showPoints: true,
    showHulls: true,
  });

  const [clusters, setClusters] = useState([]);
  const [selectedClusterId, setSelectedClusterId] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/areas.geojson").then((r) => r.json()),
      fetch("/data/grid.geojson").then((r) => r.json()).catch(() => null),
      fetch("/data/facilities.geojson").then((r) => r.json()).catch(() => null),
      fetch("/data/flows.json").then((r) => r.json()).catch(() => []),
      fetch("/data/timeseries.json").then((r) => r.json()).catch(() => ({})),
    ]).then(([a, g, f, fl, t]) => {
      setAreas(a);
      setGrid(g);
      setFacilities(f);
      setFlows(fl);
      setTs(t);
      const keys = Object.keys(t || {});
      if (keys.length) setTimeKey(keys[0]);
    });
  }, []);

  const enrichedAreas = useMemo(() => {
    if (!areas) return null;
    const snapshot = ts?.[timeKey] || {};
    return {
      ...areas,
      features: areas.features.map((feat) => {
        const id = feat.properties?.id;
        const row = snapshot[id] || {};
        const risk = computeRiskScore(row);
        return {
          ...feat,
          properties: {
            ...feat.properties,
            ...row,
            risk,
          },
        };
      }),
    };
  }, [areas, ts, timeKey]);

  const gridPoints = useMemo(() => {
    if (!grid?.features?.length) return [];
    const snapshot = ts?.[timeKey] || {};
    return grid.features.map((feat) => {
      const id = feat.properties?.id;
      const row = snapshot[id] || {};
      const [lng, lat] = feat.geometry.coordinates;
      return {
        id,
        lat,
        lng,
        risk: computeRiskScore(row),
        suspectVisits: row.suspectVisits || 0,
        tbDiagnosed: row.tbDiagnosed || 0,
        facilityVisits: row.facilityVisits || 0,
        densityIdx: row.densityIdx || 0,
      };
    });
  }, [grid, ts, timeKey]);

  const candidatePoints = useMemo(
    () => gridPoints.filter((p) => p.risk >= clusterParams.riskThreshold),
    [gridPoints, clusterParams.riskThreshold],
  );

  const clusterIdMap = useMemo(() => {
    const map = new Map();
    clusters.forEach((cluster) => {
      cluster.points.forEach((p) => {
        map.set(p.id, cluster.id);
      });
    });
    return map;
  }, [clusters]);

  const displayPoints = useMemo(
    () => candidatePoints.map((p) => ({ ...p, clusterId: clusterIdMap.get(p.id) })),
    [candidatePoints, clusterIdMap],
  );

  const handleRunClusters = useCallback(() => {
    if (!candidatePoints.length) {
      setClusters([]);
      setSelectedClusterId(null);
      return;
    }
    const newClusters = runDbscan(candidatePoints, clusterParams.epsKm, clusterParams.minPts);
    setClusters(newClusters);
    setSelectedClusterId(null);
  }, [candidatePoints, clusterParams.epsKm, clusterParams.minPts]);

  const dataStatus = useMemo(
    () => ({ isReady: Boolean(grid?.features?.length) && Boolean(ts && Object.keys(ts).length) }),
    [grid, ts],
  );

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      <ClusterSidebar
        title="TBC Hidden Cluster Map"
        riskThreshold={clusterParams.riskThreshold}
        epsKm={clusterParams.epsKm}
        minPts={clusterParams.minPts}
        setRiskThreshold={(value) => setClusterParams((prev) => ({ ...prev, riskThreshold: value }))}
        setEpsKm={(value) => setClusterParams((prev) => ({ ...prev, epsKm: value }))}
        setMinPts={(value) => setClusterParams((prev) => ({ ...prev, minPts: value }))}
        onRun={handleRunClusters}
        showPoints={clusterOptions.showPoints}
        showHulls={clusterOptions.showHulls}
        setShowPoints={(value) => setClusterOptions((prev) => ({ ...prev, showPoints: value }))}
        setShowHulls={(value) => setClusterOptions((prev) => ({ ...prev, showHulls: value }))}
        clusters={clusters}
        selectedClusterId={selectedClusterId}
        onSelectCluster={setSelectedClusterId}
        dataStatus={dataStatus}
      />

      <div className="flex-1 min-h-[60vh] lg:min-h-0">
        <MapView
          areas={enrichedAreas}
          facilities={facilities}
          flows={flows}
          timeKey={timeKey}
          layers={layers}
          filters={filters}
          candidates={displayPoints}
          clusters={clusters}
          clusterOptions={clusterOptions}
          selectedClusterId={selectedClusterId}
          onSelectCluster={setSelectedClusterId}
        />
      </div>
    </div>
  );
}
