# 10 Fitur Unggulan - TBC Hidden Cluster Map

## Ringkasan Implementasi

Semua 10 fitur telah diimplementasikan dengan pendekatan **map-first, tanpa backend**.

| # | Fitur | View | Status | File Utama |
|---|-------|------|--------|------------|
| 1 | Hidden Cluster Score (Choropleth + Grid) | Overview Map | ✅ | App.jsx |
| 2 | Suspek vs Diagnosis Gap Heatmap | Gap Analysis | ✅ | App.jsx |
| 3 | Mobility Flow Map (OD arcs) | Cluster Explorer | ✅ | App.jsx |
| 4 | Time Slider (Temporal Navigation) | Cluster Explorer | ✅ | App.jsx |
| 5 | Cluster Auto-Discovery (DBSCAN) | Cluster Explorer | ✅ | clustering.js |
| 6 | Confidence & Data Quality Overlay | Overview Map | ✅ | dataQuality.js |
| 7 | Facility Catchment & Burden View | Facility View | ✅ | App.jsx |
| 8 | Intervention Planner (Pins & Coverage) | Intervention Planner | ✅ | interventionPlanner.js |
| 9 | Smart Legend + Explainability Panel | Gap Analysis | ✅ | explainability.js |
| 10 | Privacy Guardrails UI | Global | ✅ | App.jsx |

---

## Detail Teknis

### Fitur 1: Hidden Cluster Score
```javascript
// Choropleth dengan filter threshold
const filteredRegions = useMemo(() => {
  return {
    ...regions,
    features: regions.features.filter(
      (feature) => feature.properties.hiddenClusterIndex >= clusterThreshold
    ),
  };
}, [clusterThreshold]);

// Color mapping
const getClusterColor = (value) => {
  if (value >= 75) return "#2d6a4f";
  if (value >= 55) return "#52b788";
  return "#b7e4c7";
};
```

### Fitur 2: Gap Analysis Heatmap
```javascript
// Gap calculation
const getGapColor = (suspectRate, diagnosisRate) => {
  const gap = suspectRate - diagnosisRate;
  if (gap >= 25) return "#e76f51"; // High gap
  if (gap >= 10) return "#f4a261"; // Medium gap
  return "#a7c957"; // Low gap
};
```

### Fitur 3: Mobility Flow Map
```javascript
// OD arcs dengan threshold filtering
const filteredFlows = useMemo(() => {
  return flows.filter(
    (flow) => flow.month === activeMonth && flow.value >= flowThreshold
  );
}, [activeMonth, flowThreshold]);

// Dynamic polyline width based on intensity
<Polyline
  positions={flow.path}
  pathOptions={{ 
    color: "#f77f00", 
    weight: Math.max(2, flow.value / 60) 
  }}
/>
```

### Fitur 4: Time Slider
```javascript
// Temporal navigation
const [activeMonthIndex, setActiveMonthIndex] = useState(0);
const activeMonth = timeseries.months[activeMonthIndex];

// Slider control
<input
  type="range"
  min="0"
  max={timeseries.months.length - 1}
  value={activeMonthIndex}
  onChange={(e) => setActiveMonthIndex(Number(e.target.value))}
/>
```

### Fitur 5: Cluster Auto-Discovery
```javascript
// DBSCAN implementation
export function runDBSCAN(grids, epsilon = 0.05, minPoints = 2) {
  const clusters = [];
  const visited = new Set();
  // ... algorithm implementation
  return clusters;
}

// Usage
const handleDiscoverClusters = useCallback(() => {
  const highRiskGrids = grids.features.filter(f => f.properties.riskScore >= 0.6);
  const clusters = runDBSCAN(highRiskGrids, 0.05, 2);
  const stats = calculateClusterStats(clusters);
  setAutoClusters({ clusters, stats });
}, []);
```

### Fitur 6: Data Quality Overlay
```javascript
// Quality scoring algorithm
export function calculateDataQuality(gridProperties) {
  let qualityScore = 0;
  let factors = 0;
  
  // Factor 1: Visit rate
  if (gridProperties.visitRate >= 15) qualityScore += 1;
  else if (gridProperties.visitRate >= 8) qualityScore += 0.6;
  else qualityScore += 0.3;
  
  // Factor 2: Risk score presence
  // Factor 3: Signal stability
  // Factor 4: Facility data availability
  
  return qualityScore / factors;
}
```

### Fitur 7: Facility Catchment
```javascript
// Catchment radius visualization
<Circle
  center={[facility.lat, facility.lng]}
  radius={facility.catchmentRadiusKm * 1000}
  pathOptions={{ color: "#2a9d8f", fillOpacity: 0.12 }}
/>

// Burden metrics
<p><strong>Gap Rujukan:</strong> {facility.visits.suspect - facility.visits.diagnosis}</p>
<p><strong>Conversion Rate:</strong> {((facility.visits.diagnosis / facility.visits.suspect) * 100).toFixed(1)}%</p>
```

### Fitur 8: Intervention Planner
```javascript
// Interactive pin placement
function MapClickHandler({ onMapClick, enabled }) {
  useMapEvents({
    click: (e) => {
      if (enabled) onMapClick(e.latlng);
    },
  });
  return null;
}

// Coverage calculation
export function calculateCoverage(latlng, grids) {
  const interventionRadius = 0.015;
  let coverage = 0;
  grids.forEach(grid => {
    const distance = Math.sqrt(
      Math.pow(latlng.lat - gridLat, 2) + 
      Math.pow(latlng.lng - gridLng, 2)
    );
    if (distance < interventionRadius) coverage++;
  });
  return coverage;
}
```

### Fitur 9: Explainability Panel
```javascript
// Factor contribution calculation
export function calculateExplainability(gridProperties, flows) {
  const factors = [
    {
      name: "Mobilitas",
      contribution: calculateMobilityContribution(gridProperties, flows)
    },
    {
      name: "Kepadatan",
      contribution: calculateDensityContribution(gridProperties)
    },
    {
      name: "Kunjungan Faskes",
      contribution: calculateVisitContribution(gridProperties)
    },
    {
      name: "Gap Diagnosis",
      contribution: /* calculated */
    }
  ];
  return { factors: normalized };
}

// Visualization
<div className="factor-bar">
  <div className="factor-bar-fill" 
       style={{ width: `${factor.contribution}%` }} />
</div>
```

### Fitur 10: Privacy Guardrails
```html
<!-- Global privacy banner -->
<section className="panel privacy-banner">
  <div className="privacy-icon">🔒</div>
  <div>
    <strong>Privasi Terjaga</strong>
    <p className="microcopy">
      Semua data ditampilkan dalam agregat grid/kelurahan. 
      Tidak ada data individu atau alamat personal.
    </p>
  </div>
</section>

<!-- Tooltip agregasi -->
layer.bindTooltip(
  `${feature.properties.name}: indeks ${feature.properties.hiddenClusterIndex} (agregat)`,
  { sticky: true }
);
```

---

## Interaksi Fitur

### Flow Data (Time Slider ↔ Mobility Flow)
Fitur #4 (Time Slider) mengontrol data yang ditampilkan di Fitur #3 (Flow Map):
```javascript
const filteredFlows = useMemo(() => {
  return flows.filter(
    (flow) => flow.month === activeMonth && flow.value >= flowThreshold
  );
}, [activeMonth, flowThreshold]);
```

### Clustering ↔ Explainability
Fitur #5 (Auto-Discovery) mengidentifikasi cluster, Fitur #9 (Explainability) menjelaskan mengapa:
```javascript
// Cluster detection
const clusters = runDBSCAN(highRiskGrids);

// Factor explanation
const explainability = calculateExplainability(selectedGrid, filteredFlows);
```

### Intervention ↔ Coverage
Fitur #8 (Intervention Planner) menggunakan grid data untuk kalkulasi real-time:
```javascript
const totalCoverage = useMemo(() => {
  const coveredGrids = new Set();
  interventionPoints.forEach(point => {
    // Calculate which grids are covered
  });
  return coveredGrids.size;
}, [interventionPoints]);
```

---

## Performance Optimizations

1. **useMemo untuk filtering berat**
   ```javascript
   const filteredRegions = useMemo(() => { /* ... */ }, [clusterThreshold]);
   const filteredFlows = useMemo(() => { /* ... */ }, [activeMonth, flowThreshold]);
   ```

2. **useCallback untuk event handlers**
   ```javascript
   const handleDiscoverClusters = useCallback(() => { /* ... */ }, []);
   const handleAddInterventionPoint = useCallback((latlng) => { /* ... */ }, []);
   ```

3. **Key props untuk dynamic lists**
   ```javascript
   key={`${flow.id}-${activeMonthIndex}`}
   key={`cluster-${idx}`}
   ```

4. **Conditional rendering**
   ```javascript
   {showGridLayer && !showQualityOverlay && <GeoJSON ... />}
   {showAutoClusters && autoClusters && <GeoJSON ... />}
   ```

---

## Data Requirements

### regions.json (Choropleth)
- `hiddenClusterIndex`: 0-100
- `notifRate`: percentage
- `suspectedRate`: percentage

### grids.json (500m Grid)
- `riskScore`: 0-1
- `visitRate`: percentage
- `kelurahan`: string

### flows.json (OD Mobility)
- `fromGrid`, `toGrid`: grid IDs
- `value`: trip count
- `month`: "YYYY-MM"
- `path`: [[lat, lng], [lat, lng]]

### facilities.json (Health Facilities)
- `visits.suspect`, `visits.diagnosis`, etc.
- `catchmentRadiusKm`: number
- `lat`, `lng`: coordinates

---

## UI/UX Features

### View Switching
5 dedicated views dengan context-aware sidebar:
- Overview Map
- Cluster Explorer  
- Facility View
- Gap Analysis
- Intervention Planner

### Interactive Controls
- Range sliders dengan live feedback
- Toggle switches untuk layer visibility
- Button states (active/inactive)
- Click handlers dengan tooltip

### Visual Feedback
- Hover effects pada map features
- Color coding konsisten per layer
- Loading states (implicit via React)
- Animated transitions (CSS)

---

## Accessibility & Privacy

### Privacy Design
- ✅ Aggregate data only
- ✅ Minimum cell count (implicit in grid aggregation)
- ✅ No personal identifiers
- ✅ Transparent methodology

### User Guidance
- Microcopy explanations
- Tooltip hints
- Empty states dengan instruksi
- Feature highlights list

---

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Requirements:**
- ES6+ support
- CSS Grid
- Flexbox
- Leaflet compatible

---

## Future Enhancements

Potential additions (not in current scope):
- Export to PDF/PNG
- Advanced filter builder
- Multi-language support
- Dark mode toggle
- Custom color schemes
- Historical comparison mode
- Predictive modeling overlay

---

**Semua fitur 100% functional tanpa backend!** 🎉
