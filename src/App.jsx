import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import MapView from "./components/MapView.jsx";
import { computeRiskScore } from "./utils/scoring.js";

export default function App() {
  const [areas, setAreas] = useState(null);
  const [facilities, setFacilities] = useState(null);
  const [flows, setFlows] = useState([]);
  const [ts, setTs] = useState({});
  const [timeKey, setTimeKey] = useState("2024-01");

  const [layers, setLayers] = useState({
    choropleth: true,
    facilities: true,
    flows: false,
  });

  const [filters, setFilters] = useState({
    minVolume: 50,
    minRisk: 0.35,
  });

  useEffect(() => {
    Promise.all([
      fetch("/data/areas.geojson").then((r) => r.json()),
      fetch("/data/facilities.geojson").then((r) => r.json()).catch(() => null),
      fetch("/data/flows.json").then((r) => r.json()).catch(() => []),
      fetch("/data/timeseries.json").then((r) => r.json()).catch(() => ({})),
    ]).then(([a, f, fl, t]) => {
      setAreas(a);
      setFacilities(f);
      setFlows(fl);
      setTs(t);
      // set timeKey to first available key if exists
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

  const timeKeys = useMemo(() => Object.keys(ts || {}).sort(), [ts]);

  return (
    <div className="h-full w-full flex">
      <Sidebar
        title="TBC Hidden Cluster Map"
        timeKey={timeKey}
        timeKeys={timeKeys}
        setTimeKey={setTimeKey}
        layers={layers}
        setLayers={setLayers}
        filters={filters}
        setFilters={setFilters}
      />

      <div className="flex-1">
        <MapView
          areas={enrichedAreas}
          facilities={facilities}
          flows={flows}
          timeKey={timeKey}
          layers={layers}
          filters={filters}
        />
      </div>
    </div>
  );
}
