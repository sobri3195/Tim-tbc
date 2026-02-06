# TBC Hidden Cluster Map - 10 Fitur Unggulan

Sistem pemetaan berbasis web untuk deteksi klaster TBC (Tuberkulosis) tersembunyi dengan 10 fitur canggih, **sepenuhnya map-first tanpa backend**.

## 🌟 10 Fitur Unggulan

### 1. 🗺️ Layer Risiko "Hidden Cluster Score" (Choropleth + Grid)
**View:** Overview Map

Menampilkan dua layer visualisasi risiko:
- **Choropleth Layer**: Skor indeks hidden cluster per kecamatan (warna hijau: rendah, hijau tua: tinggi)
- **Grid Layer**: Grid 500m menampilkan skor risiko mikro untuk deteksi klaster detail
- Filter dinamis dengan slider ambang indeks (30-90)
- Tooltip menampilkan statistik agregat per wilayah

**Cara Pakai:**
1. Pilih tab "Overview Map"
2. Geser slider "Ambang indeks" untuk filter wilayah berisiko
3. Toggle "Grid Risiko (500m)" untuk melihat detail mikro
4. Klik wilayah untuk melihat statistik lengkap

---

### 2. 📊 Heatmap "Suspek vs Diagnosis Gap"
**View:** Gap Analysis

Heatmap yang menyoroti area dengan sinyal gejala/kunjungan tinggi tetapi diagnosis rendah - indikasi **under-detection**.

- Warna hijau: Gap rendah (deteksi baik)
- Warna oranye: Gap sedang
- Warna merah: Gap tinggi (under-detection signifikan)
- Tooltip menampilkan persentase gap: `Suspek Rate - Diagnosis Rate`

**Cara Pakai:**
1. Pilih tab "Gap Analysis"
2. Klik wilayah untuk melihat gap detail
3. Panel "Area Gap Tinggi" menampilkan 5 wilayah prioritas

---

### 3. 🌊 Mobility Flow Map (OD Arcs)
**View:** Cluster Explorer

Visualisasi arus mobilitas agregat antar grid menggunakan garis/arcs untuk memprediksi penyebaran dan "imported risk".

- Garis oranye menampilkan arcs Origin-Destination
- Ketebalan garis = intensitas mobilitas
- Hover untuk detail flow
- Filter minimum intensitas (40-200)

**Cara Pakai:**
1. Pilih tab "Cluster Explorer"
2. Geser "Minimum intensitas" untuk filter flow kuat
3. Toggle "Aliran Mobilitas (OD Arcs)" untuk show/hide
4. Hover garis untuk detail perjalanan

---

### 4. 🔄 Time Slider (Mingguan/Bulanan)
**View:** Cluster Explorer

Slider temporal yang mengubah **semua layer** (risiko, flow, kunjungan faskes) untuk analisis pola musiman dan kejadian.

- Slider bulan (navigasi temporal)
- Format: "Jan 2024", "Feb 2024", dll
- Flow map berubah sesuai bulan aktif
- Analisis trend musiman

**Cara Pakai:**
1. Pilih tab "Cluster Explorer"
2. Geser slider "Bulan aktif" untuk navigasi waktu
3. Amati perubahan flow dan intensitas mobilitas per bulan

---

### 5. 🤖 Cluster Auto-Discovery (DBSCAN-like, Frontend)
**View:** Cluster Explorer

Algoritma clustering otomatis (DBSCAN) yang mengelompokkan grid berisiko tinggi menjadi polygon cluster dengan statistik lengkap.

- Tombol "🔍 Temukan Klaster Otomatis"
- Deteksi cluster tanpa backend (JavaScript frontend)
- Statistik: jumlah grid, avg/max/min risk score per cluster
- Visualisasi polygon cluster dengan border ungu

**Cara Pakai:**
1. Pilih tab "Cluster Explorer"
2. Klik tombol "🔍 Temukan Klaster Otomatis"
3. Lihat statistik cluster yang terdeteksi di panel
4. Toggle "Tampilkan Cluster di Peta" untuk visualisasi

**Algoritma:**
- DBSCAN dengan epsilon = 0.05, minPoints = 2
- Hanya grid dengan risk score ≥ 0.6 yang dianalisis

---

### 6. 🔍 Confidence & Data Quality Overlay
**View:** Overview Map

Overlay "confidence" menampilkan tingkat kelengkapan data (tinggi/sedang/rendah) berdasarkan:
- Jumlah faskes di area
- Stabilitas sinyal
- Visit rate consistency
- Risk score availability

**Legend:**
- Hijau: Data quality tinggi (≥80%)
- Oranye: Data quality sedang (50-79%)
- Merah: Data quality rendah (<50%)

**Cara Pakai:**
1. Pilih tab "Overview Map"
2. Toggle "🔍 Fitur 6: Data Quality Overlay"
3. Tooltip menampilkan persentase quality per grid
4. Gunakan untuk validasi area analisis

---

### 7. 🏥 Facility Catchment & Burden View
**View:** Facility View

Klik faskes untuk melihat:
- **Catchment radius**: Area jangkauan pelayanan (circle mock)
- **Beban kunjungan**: Kunjungan batuk, suspek, diagnosis, treatment
- **Gap rujukan**: Selisih suspek vs diagnosis
- **Conversion rate**: Persentase diagnosis dari suspek

**Cara Pakai:**
1. Pilih tab "Facility View"
2. Klik marker faskes atau pilih dari daftar
3. Toggle "Catchment Radius" untuk visualisasi coverage
4. Panel "Detail Beban & Gap" menampilkan analisis lengkap

**Metrics:**
- Gap Rujukan = Suspek - Diagnosis
- Conversion Rate = (Diagnosis / Suspek) × 100%

---

### 8. 📍 Intervention Planner (Pins & Coverage)
**View:** Intervention Planner

Mode perencanaan intervensi: taruh titik kegiatan (screening, edukasi, tracing) dan sistem menghitung estimasi cakupan populasi area berisiko.

**Fitur:**
- Mode pin interaktif (klik peta)
- Circle coverage radius (1km)
- Hitung grid tercakup otomatis
- Coverage rate real-time
- Hapus titik individu

**Cara Pakai:**
1. Pilih tab "Intervention Planner"
2. Klik tombol "🎯 Aktifkan Mode Pin"
3. Klik peta untuk taruh titik intervensi
4. Lihat "Coverage Summary" untuk total cakupan
5. Hapus titik dari panel "Daftar Titik Intervensi"

**Metrics:**
- Total Titik Intervensi
- Grid Tercakup / Total Grid
- Coverage Rate (%)

---

### 9. 🧠 Smart Legend + Explainability Panel
**View:** Gap Analysis

Panel "Kenapa area ini tinggi?" menampilkan kontribusi faktor dalam bentuk bar chart horizontal:
- **Mobilitas**: Arus perjalanan masuk/keluar
- **Kepadatan**: Tingkat kunjungan faskes
- **Kunjungan Faskes**: Rate kunjungan batuk kronis
- **Gap Diagnosis**: Selisih suspek vs diagnosis

**Cara Pakai:**
1. Pilih tab "Gap Analysis"
2. Klik grid di peta
3. Panel "🧠 Fitur 9: Smart Explainability" menampilkan breakdown faktor
4. Bar chart menunjukkan kontribusi relatif setiap faktor (%)

**Visualisasi:**
- Gradient bar biru-ungu
- Persentase kontribusi per faktor
- Label deskriptif

---

### 10. 🔒 Privacy Guardrails UI
**Global:** Semua Views

Banner dan tooltip yang menegaskan:
- ✅ Data agregat (grid/kelurahan)
- ✅ Tidak menampilkan individu
- ✅ Tidak ada alamat personal
- ✅ Minimum cell count diterapkan

**Implementasi:**
- Privacy banner di top sidebar (semua view)
- Tooltip "Data agregat" pada hover layer
- Alert peringatan privasi di Overview
- Cell count minimum enforcement

---

## 🚀 Teknologi

- **React 18** - UI library
- **React Leaflet 4** - Map visualization
- **Leaflet 1.9** - Map engine
- **Vite 5** - Build tool & dev server
- **Frontend-only** - No backend required

## 📦 Setup & Development

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 📂 Struktur Project

```
src/
├── App.jsx                    # Main component dengan 10 fitur
├── main.jsx                   # Entry point
├── styles.css                 # Styling lengkap
├── mapIcons.js               # Leaflet icon config
├── data/
│   ├── regions.json          # Data kecamatan (choropleth)
│   ├── grids.json            # Data grid 500m (risk score)
│   ├── flows.json            # Data mobilitas (OD flows)
│   ├── facilities.json       # Data faskes (catchment)
│   └── timeseries.json       # Data temporal (time slider)
└── utils/
    ├── clustering.js         # DBSCAN algorithm
    ├── dataQuality.js        # Quality scoring
    ├── explainability.js     # Factor contribution
    └── interventionPlanner.js # Coverage calculation
```

## 🎨 Design Principles

1. **Map-First**: Semua fitur berbasis peta
2. **No Backend**: Pure frontend (React + JSON)
3. **Privacy by Design**: Agregasi built-in
4. **Interactive**: Real-time filtering & exploration
5. **Explainable**: Transparency dalam analisis

## 📊 Data Format

### regions.json
```json
{
  "type": "FeatureCollection",
  "features": [{
    "properties": {
      "id": "r-01",
      "name": "Kecamatan Utara",
      "hiddenClusterIndex": 78,
      "notifRate": 43,
      "suspectedRate": 62
    },
    "geometry": { "type": "Polygon", "coordinates": [...] }
  }]
}
```

### grids.json
```json
{
  "type": "FeatureCollection",
  "features": [{
    "properties": {
      "gridId": "g-01",
      "kelurahan": "Melati",
      "riskScore": 0.72,
      "visitRate": 33
    },
    "geometry": { "type": "Polygon", "coordinates": [...] }
  }]
}
```

### flows.json
```json
[
  {
    "id": "f-01",
    "fromGrid": "g-01",
    "toGrid": "g-05",
    "value": 120,
    "month": "2024-01",
    "path": [[-6.1, 106.82], [-6.15, 106.85]]
  }
]
```

## 🛡️ Privacy & Ethics

Aplikasi ini dibangun dengan prinsip **Privacy by Design**:
- Semua data dalam bentuk agregat (grid/kelurahan)
- Tidak ada data personal atau alamat individu
- Minimum cell count enforcement
- Banner privasi di semua view
- Transparency dalam metodologi

## 📝 License

MIT License - Untuk keperluan public health surveillance

## 🤝 Contributing

Pull requests welcome! Untuk perubahan besar, diskusikan di Issues terlebih dahulu.

## 📞 Support

Untuk pertanyaan atau bantuan, buka Issue di GitHub repository.

---

**Built with ❤️ for TB elimination**
