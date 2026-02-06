# Quick Start Guide

## 🚀 Getting Started in 3 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Open browser to `http://localhost:5173`

### 3. Explore 10 Features

#### Tab 1: Overview Map
- ✅ **Fitur 1**: Hidden Cluster Score choropleth
- ✅ **Fitur 6**: Data Quality Overlay
- **Try:** Adjust "Ambang indeks" slider, toggle layers

#### Tab 2: Cluster Explorer
- ✅ **Fitur 3**: Mobility Flow Map (OD arcs)
- ✅ **Fitur 4**: Time Slider (navigate months)
- ✅ **Fitur 5**: Cluster Auto-Discovery (DBSCAN)
- **Try:** Click "Temukan Klaster Otomatis", adjust time slider

#### Tab 3: Facility View
- ✅ **Fitur 7**: Facility Catchment & Burden
- **Try:** Click facility markers, see coverage circles

#### Tab 4: Gap Analysis
- ✅ **Fitur 2**: Suspek vs Diagnosis Gap Heatmap
- ✅ **Fitur 9**: Smart Explainability Panel
- **Try:** Click grid to see factor breakdown

#### Tab 5: Intervention Planner
- ✅ **Fitur 8**: Intervention Pin Placement
- **Try:** Click "Aktifkan Mode Pin", click map to add points

#### Global
- ✅ **Fitur 10**: Privacy Guardrails (visible in all tabs)

---

## 📊 Sample Workflows

### Workflow 1: Find Hidden Clusters
1. Go to **Overview Map**
2. Set "Ambang indeks" to 70
3. Click dark green regions
4. Switch to **Cluster Explorer**
5. Click "🔍 Temukan Klaster Otomatis"
6. Review detected clusters

### Workflow 2: Analyze Under-Detection
1. Go to **Gap Analysis**
2. Look for red regions (high gap)
3. Click region to see details
4. Click grid in that region
5. Review explainability factors
6. Note high "Gap Diagnosis" contribution

### Workflow 3: Plan Intervention
1. Go to **Intervention Planner**
2. Click "🎯 Aktifkan Mode Pin"
3. Click map on high-risk areas
4. Monitor "Coverage Summary" panel
5. Aim for 70%+ coverage rate
6. Export screenshot for planning meeting

### Workflow 4: Facility Burden Analysis
1. Go to **Facility View**
2. Click facility from list or map
3. Review "Detail Beban & Gap" panel
4. Check conversion rate
5. Identify facilities with high gap
6. Prioritize for support/training

### Workflow 5: Temporal Analysis
1. Go to **Cluster Explorer**
2. Set "Minimum intensitas" to 80
3. Slide "Bulan aktif" through months
4. Watch flow patterns change
5. Identify seasonal peaks
6. Note imported risk corridors

---

## 🎯 Key Interactions

| Action | Result |
|--------|--------|
| Hover region/grid | Tooltip with stats |
| Click region | Load in sidebar panel |
| Adjust slider | Real-time filter |
| Toggle layer | Show/hide on map |
| Click "Temukan Klaster" | Run DBSCAN algorithm |
| Click grid (Gap Analysis) | Show explainability |
| Click map (Intervention mode) | Add pin point |

---

## 🎨 Visual Guide

### Color Schemes

**Hidden Cluster Index:**
- 🟢 Light green (0-54): Low risk
- 🟢 Medium green (55-74): Medium risk
- 🟢 Dark green (75+): High risk

**Risk Score Grid:**
- 🔵 Light blue (0-0.4): Low risk
- 🔵 Medium blue (0.41-0.7): Medium risk
- 🔵 Dark blue (0.71+): High risk

**Gap Heatmap:**
- 🟢 Green: Low gap (good detection)
- 🟠 Orange: Medium gap
- 🔴 Red: High gap (under-detection)

**Data Quality:**
- 🟢 Green: High quality (≥80%)
- 🟠 Orange: Medium quality (50-79%)
- 🔴 Red: Low quality (<50%)

---

## 💡 Tips & Tricks

### Performance
- Toggle off unused layers for better performance
- Use threshold sliders to reduce data points
- Disable flow layer when not needed

### Analysis
- Combine multiple views for comprehensive analysis
- Use time slider to identify seasonal patterns
- Cross-reference gap analysis with cluster detection

### Interpretation
- Red gaps in Gap Analysis = priority areas
- High mobility + high gap = rapid spread risk
- Low data quality = verify findings with ground truth

---

## 🔧 Troubleshooting

**Map not loading?**
- Check browser console for errors
- Verify internet connection (OpenStreetMap tiles)
- Clear browser cache

**Clusters not detected?**
- Try lowering risk threshold
- Ensure grid layer is enabled
- Check if high-risk grids exist

**Intervention pins not working?**
- Verify "Mode Pin" button is active (green)
- Click directly on map (not sidebar)
- Check console for errors

---

## 📱 Browser Support

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+

---

## 🎓 Understanding the Data

### Data Aggregation Levels

1. **Kecamatan (Region)**: Administrative district level
   - Hidden cluster index
   - Notif rate
   - Suspected rate

2. **Grid 500m**: Micro-level cells
   - Risk score
   - Visit rate
   - Mobility patterns

3. **Facility**: Health facility points
   - Catchment area
   - Visit burden
   - Conversion rates

### Privacy & Ethics

All data is:
- ✅ Aggregated (no individuals)
- ✅ Anonymized (no addresses)
- ✅ Minimum cell count enforced
- ✅ Transparent methodology

---

## 📚 Further Reading

- `README.md` - Comprehensive documentation
- `FEATURES.md` - Technical implementation details
- `src/App.jsx` - Main component source
- `src/utils/` - Algorithm implementations

---

**Ready to detect hidden TB clusters? Start with "Overview Map"!** 🔍
