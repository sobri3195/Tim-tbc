# Intervention Planner - Dokumentasi Fitur

## 📋 Ringkasan

Fitur **Intervention Planner** adalah modul perencanaan intervensi TBC (Tuberkulosis) yang memungkinkan pengguna untuk:
- Menempatkan titik intervensi (Screening, Edukasi, Tracing) di peta
- Melihat cakupan area secara visual
- Mendapatkan rekomendasi prioritas area berisiko tinggi
- Mengelola rencana dengan undo/redo, import/export, dan autosave

---

## 🎯 UX Flow & Microcopy

### 1. Mode Switch (Browse / Planning)

```
┌─────────────────────────────────────┐
│  🔍 Browse    │  📍 Planning        │
│               │   (aktif)           │
└─────────────────────────────────────┘
```

**Browse Mode:**
- Cursor default
- Klik grid melihat detail
- Navigasi bebas

**Planning Mode:**
- Cursor crosshair
- Klik peta = tambah pin
- Form muncul untuk konfirmasi detail

### 2. Empty States

**Belum ada pin:**
```
📍
Belum ada titik intervensi
Aktifkan mode Planning untuk menambah
```

**Tidak ada rekomendasi:**
```
💡 Semua area berisiko sudah tercakup!
Tambahkan lebih banyak pin untuk cakupan luas.
```

**Import gagal:**
```
⚠️ Gagal mengimpor file. Pastikan format JSON benar.
```

### 3. Microcopy Patterns

| Konteks | Copy |
|---------|------|
| Tombol tambah | "Tambah ke Rencana" |
| Konfirmasi hapus | "Yakin ingin menghapus semua titik intervensi?" |
| Autosave | "Terakhir disimpan: 14:32:15" |
| Mode aktif | "Mode Planning Aktif - Klik pada peta untuk menambahkan" |
| Rekomendasi | "5 titik berisiko tinggi belum tercakup" |
| Coverage | "Grid Tercakup / Total Grid" |
| Populasi | "Estimasi Populasi Tercakup" |

### 4. Ethics Disclaimer (Selalu Terlihat)

```
🛡️ Pernyataan Etik
Alat ini untuk perencanaan program publik. Data yang ditampilkan 
ersifat agregat wilayah (grid/kelurahan). Tidak ada data personal 
atau alamat individu.
```

---

## 📐 Struktur Data (Plan JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TBC Intervention Plan",
  "type": "object",
  "required": ["version", "createdAt", "updatedAt", "name", "pins"],
  "properties": {
    "version": {
      "type": "string",
      "description": "Schema version",
      "enum": ["1.0"]
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp"
    },
    "name": {
      "type": "string",
      "description": "Nama rencana intervensi"
    },
    "description": {
      "type": "string",
      "description": "Deskripsi opsional"
    },
    "pins": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Pin"
      }
    },
    "settings": {
      "type": "object",
      "properties": {
        "defaultRadiusKm": {
          "type": "number",
          "default": 1.0
        },
        "defaultType": {
          "type": "string",
          "enum": ["Screening", "Edukasi", "Tracing"],
          "default": "Screening"
        }
      }
    }
  },
  "definitions": {
    "Pin": {
      "type": "object",
      "required": ["id", "type", "position", "radiusKm", "createdAt"],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^pin_[0-9]+_[a-z0-9]+$"
        },
        "type": {
          "type": "string",
          "enum": ["Screening", "Edukasi", "Tracing"]
        },
        "position": {
          "type": "array",
          "minItems": 2,
          "maxItems": 2,
          "items": {
            "type": "number"
          },
          "description": "[latitude, longitude]"
        },
        "radiusKm": {
          "type": "number",
          "minimum": 0.1,
          "maximum": 10
        },
        "travelTimeMinutes": {
          "type": ["number", "null"],
          "description": "Estimasi waktu tempuh (mock)"
        },
        "notes": {
          "type": "string"
        },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        }
      }
    }
  }
}
```

### Contoh Instance

```json
{
  "version": "1.0",
  "createdAt": "2024-01-15T08:30:00.000Z",
  "updatedAt": "2024-01-15T09:45:00.000Z",
  "name": "Rencana Intervensi Q1 2024",
  "description": "Fokus area dengan gap diagnosis tinggi",
  "pins": [
    {
      "id": "pin_1705312200000_abc123",
      "type": "Screening",
      "position": [-5.145, 119.42],
      "radiusKm": 1.0,
      "travelTimeMinutes": 30,
      "notes": "Dekat pasar, akses mudah",
      "createdAt": "2024-01-15T08:30:00.000Z"
    },
    {
      "id": "pin_1705312800000_def456",
      "type": "Edukasi",
      "position": [-5.152, 119.435],
      "radiusKm": 1.5,
      "travelTimeMinutes": null,
      "notes": "Kerjasama dengan kader kesehatan",
      "createdAt": "2024-01-15T08:40:00.000Z"
    }
  ],
  "settings": {
    "defaultRadiusKm": 1.0,
    "defaultType": "Screening"
  }
}
```

---

## 🧮 Algoritma Coverage & Rekomendasi

### 1. Haversine Distance

```javascript
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat/2)² + 
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
            Math.sin(dLng/2)²;
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in km
}
```

### 2. Coverage Check

```javascript
function isGridCovered(grid, pins) {
  const [gridLng, gridLat] = grid.geometry.coordinates;
  
  return pins.some(pin => {
    const distance = haversineDistance(
      pin.position[0], pin.position[1], // pin lat, lng
      gridLat, gridLng
    );
    return distance <= pin.radiusKm;
  });
}
```

### 3. Coverage Statistics

```javascript
function calculateCoverageStats(grids, pins, timeseriesData, timeKey) {
  const snapshot = timeseriesData[timeKey];
  const riskThreshold = 0.5;
  
  let coveredCount = 0;
  let highRiskCovered = 0;
  let highRiskTotal = 0;
  let estimatedPopulation = 0;
  
  grids.forEach(grid => {
    const isCovered = isGridCovered(grid, pins);
    const gridData = snapshot[grid.properties.id] || {};
    const riskScore = calculateRiskScore(gridData);
    const densityIdx = gridData.densityIdx || 0.5;
    
    // Estimate population (proxy)
    const basePopPerGrid = 500;
    const estimatedPop = Math.round(basePopPerGrid * densityIdx);
    
    if (isCovered) {
      coveredCount++;
      estimatedPopulation += estimatedPop;
    }
    
    if (riskScore >= riskThreshold) {
      highRiskTotal++;
      if (isCovered) highRiskCovered++;
    }
  });
  
  return {
    coveragePercent: (coveredCount / grids.length) * 100,
    highRiskCoveragePercent: (highRiskCovered / highRiskTotal) * 100,
    estimatedPopulation
  };
}
```

### 4. Risk Score Calculation

```javascript
function calculateGridRisk(gridData) {
  const suspectRate = Math.min(gridData.suspectVisits / 30, 1);
  const diagnosisRate = Math.min(gridData.tbDiagnosed / 6, 1);
  const visitRate = Math.min(gridData.facilityVisits / 100, 1);
  
  // Diagnosis gap (under-detection indicator)
  const diagnosisGap = Math.max(0, gridData.suspectVisits - gridData.tbDiagnosed * 3);
  const gapRate = Math.min(diagnosisGap / 20, 1);
  
  // Weighted calculation
  return suspectRate * 0.35 + 
         diagnosisRate * 0.25 + 
         gapRate * 0.25 + 
         visitRate * 0.15;
}
```

### 5. Priority Score Formula

```javascript
// Main formula: score = risk * (1 - coverage) * densityIdx
function calculatePriorityScore(grid, gridData, isCovered) {
  const risk = calculateGridRisk(gridData);
  const densityIdx = gridData.densityIdx || 0.5;
  const coverageFactor = isCovered ? 0 : 1;
  
  let score = risk * coverageFactor * densityIdx;
  
  // Boost for high-risk uncovered areas
  if (risk > 0.7 && !isCovered) {
    score *= 1.2;
  }
  
  return score;
}
```

### 6. Generate Recommendations

```javascript
function generateRecommendations(grids, timeseriesData, timeKey, coveredSet, count = 5) {
  const snapshot = timeseriesData[timeKey];
  
  // Calculate scores for all grids
  const scoredGrids = grids.map(grid => {
    const gridId = grid.properties.id;
    const gridData = snapshot[gridId] || {};
    const isCovered = coveredSet.has(gridId);
    
    return {
      gridId,
      grid,
      score: calculatePriorityScore(grid, gridData, isCovered),
      risk: calculateGridRisk(gridData),
      densityIdx: gridData.densityIdx || 0.5,
      isCovered
    };
  });
  
  // Sort, filter covered, take top N
  return scoredGrids
    .filter(item => !item.isCovered && item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((item, index) => ({
      rank: index + 1,
      gridId: item.gridId,
      position: [item.grid.geometry.coordinates[1], item.grid.geometry.coordinates[0]],
      score: Math.round(item.score * 100) / 100,
      risk: Math.round(item.risk * 100) / 100,
      reason: generateReason(item) // Human-readable explanation
    }));
}
```

### 7. Geographical Diversification

```javascript
function diversifyRecommendations(recommendations) {
  if (recommendations.length <= 1) return recommendations;
  
  const diversified = [recommendations[0]]; // Always include top
  
  for (let i = 1; i < recommendations.length; i++) {
    const rec = recommendations[i];
    let tooClose = false;
    
    // Check distance to already selected recommendations
    for (const selected of diversified) {
      const distance = haversineDistance(
        rec.position[0], rec.position[1],
        selected.position[0], selected.position[1]
      );
      
      if (distance < 0.3) { // 300m minimum spacing
        tooClose = true;
        break;
      }
    }
    
    if (!tooClose) diversified.push(rec);
    if (diversified.length >= 5) break;
  }
  
  return diversified;
}
```

---

## 🗂️ File Structure

```
src/
├── components/
│   ├── PlannerSidebar.jsx      # Sidebar dengan Plan Builder
│   ├── PlannerLayer.jsx        # Layer peta untuk intervensi
│   └── AreaLayer.jsx           # Layer area administratif
├── utils/
│   ├── coverage.js             # Algoritma coverage & Haversine
│   ├── recommend.js            # Algoritma rekomendasi
│   └── storage.js              # LocalStorage & import/export
├── App.jsx                     # Integrasi view switcher
└── ...

public/
└── data/
    ├── grid.geojson            # Data grid 500m
    └── timeseries.json         # Data temporal dengan densityIdx
```

---

## 🔒 Privacy & Ethics Checklist

- [x] Data agregat (grid/kelurahan level)
- [x] Tidak ada data personal atau alamat individu
- [x] Banner etik selalu terlihat
- [x] Disclaimer: alat perencanaan program, bukan pelacakan
- [x] No backend - data tidak keluar dari browser
- [x] Export JSON tidak mengandung PII

---

## 🎨 Warna & Visualisasi

### Pin Types
| Tipe | Warna | Icon |
|------|-------|------|
| Screening | #3b82f6 (Biru) | 🔍 |
| Edukasi | #10b981 (Hijau) | 📚 |
| Tracing | #f59e0b (Kuning) | 👣 |

### Coverage Layer
| Status | Warna | Opacity |
|--------|-------|---------|
| Tercakup | #22c55e (Hijau) | 0.4 |
| Belum tercakup (high risk) | #ef4444 (Merah) | 0.5 |
| Belum tercakup (medium risk) | #f97316 (Oranye) | 0.4 |
| Belum tercakup (low risk) | #9ca3af (Abu) | 0.3 |

### Rekomendasi
| Element | Warna |
|---------|-------|
| Marker | #8b5cf6 (Ungu) |
| Highlighted grid | #7c3aed (Ungu gelap) |
| Score badge | Ungu dengan teks putih |

---

## 📱 Responsive Breakpoints

- **Desktop (>1024px)**: Sidebar 380px, map mengisi sisa
- **Tablet (768-1024px)**: Sidebar 320px
- **Mobile (<768px)**: View switcher di atas, sidebar full width di bawah atau modal
