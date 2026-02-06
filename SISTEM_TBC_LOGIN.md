# 🏥 Sistem Login & Manajemen Data Pasien TBC

Sistem baru telah ditambahkan ke aplikasi TBC Hidden Cluster Map dengan fitur login multi-role dan manajemen data pasien TBC.

## ✨ Fitur Baru

### 🔐 Sistem Login Multi-Role
- **Tanpa Backend**: Sistem autentikasi demo menggunakan localStorage
- **4 Role User**: Admin, Viewer, Kader, Pelapor
- **Data Dummy**: 5 akun demo siap pakai
- **Session Management**: Login persistence menggunakan sessionStorage

### 👥 Akun Demo

| Role | Username | Password | Akses |
|------|----------|----------|--------|
| 👑 Admin | `admin` | `admin123` | Full access - semua fitur |
| 👁️ Viewer | `viewer` | `viewer123` | View only - data dan laporan |
| 👨‍⚕️ Kader | `kader` | `kader123` | CRUD data pasien TBC |
| 📝 Pelapor | `pelapor` | `pelapor123` | Tambah & lihat data sendiri |

### 📊 Manajemen Data Pasien TBC

#### Fitur CRUD Lengkap:
- ✅ **Tambah Pasien**: Form input lengkap dengan validasi
- ✅ **Edit Pasien**: Update data pasien existing
- ✅ **Hapus Pasien**: Konfirmasi sebelum hapus
- ✅ **Cari & Filter**: Search by nama, ID, alamat, status
- ✅ **Statistik Real-time**: Dashboard dengan metrics

#### Data yang Disimpan:
- ID Pasien (auto-generate: TB-2024-XXX)
- Nama, Usia, Gender
- Alamat lengkap
- Tanggal diagnosis
- Status (Aktif/Pengembuhan/Sembuh)
- Keterangan & gejala
- Tanggal buat & update
- ID Kader/Pelapor

#### Role-Based Access Control:
- **Admin**: Melihat semua data, CRUD penuh
- **Viewer**: Melihat semua data tanpa edit
- **Kader**: Melihat & edit data pasien
- **Pelapor**: Tambah & lihat data sendiri

## 🎮 Cara Menggunakan

### 1. Login
- Buka aplikasi, akan muncul form login
- Gunakan akun demo atau klik "Tampilkan Akun Demo" untuk quick login
- Atau input manual: username/password sesuai tabel di atas

### 2. Navigasi
- **Sidebar kiri atas**: Info user, stats, switch user, logout
- **Sidebar kiri**: Menu navigasi (Mobilitas, Planner, Data Pasien)
- **Content area**: Map atau halaman manajemen pasien

### 3. Manajemen Pasien
- Klik "Data Pasien TBC" di sidebar
- Lihat statistik di bagian atas
- Gunakan fitur:
  - **Search**: Cari berdasarkan nama/ID/alamat
  - **Filter**: Filter berdasarkan status
  - **Tambah**: Tombol biru "Tambah Pasien Baru"
  - **Edit/Hapus**: Tombol di setiap item (untuk kader/admin)

### 4. Switch User
- Klik "🔄 Switch User" di user sidebar
- Pilih role yang berbeda untuk test akses
- Setiap role memiliki tampilan dan akses berbeda

## 🏗️ Struktur Kode Baru

```
src/
├── context/
│   ├── AuthContext.jsx      # Auth state management
│   └── PatientContext.jsx   # Patient data management
├── data/
│   └── users.js             # Dummy users & patient data
└── components/
    ├── LoginForm.jsx         # Login UI
    ├── UserSidebar.jsx      # User info & controls
    ├── MainSidebar.jsx      # Navigation sidebar
    └── PatientManagement.jsx # Patient CRUD UI
```

## 🔒 Data Persistence

- **User Session**: sessionStorage (hilang saat browser ditutup)
- **Patient Data**: localStorage (persist antar session)
- **No Backend**: Semua data tersimpan di browser

## 🚀 Fitur Teknis

### Authentication Flow:
1. Login form dengan validation
2. Session persistence
3. Role-based rendering
4. Permission-based access control

### Patient Management:
1. Context API untuk state management
2. Auto-generated patient IDs
3. Real-time search & filtering
4. Responsive UI untuk mobile & desktop

### UI/UX:
- Modern Material Design
- Responsive untuk semua screen size
- Loading states & error handling
- Confirmation dialogs untuk actions penting

## 📱 Responsive Design

- **Desktop**: Sidebar kiri untuk navigasi + user info
- **Mobile**: Bottom navigation + user sidebar collapsed
- **Tablet**: Hybrid layout dengan optimasi touch

## 🔄 State Management

Menggunakan React Context API:
- `AuthContext`: User authentication & session
- `PatientContext`: Patient data & CRUD operations
- Local storage untuk persistence
- Real-time updates across components

## 💡 Tips Penggunaan

1. **Test Different Roles**: Login dengan role berbeda untuk melihat perbedaan akses
2. **Data Persistence**: Patient data tersimpan di browser, coba refresh halaman
3. **Search & Filter**: Gunakan kombinasi search + filter untuk hasil optimal
4. **Mobile**: App fully responsive, coba resize browser atau gunakan mobile

## 🛠️ Development

Untuk developer yang ingin extend:

1. **Add New Role**: Tambah di `src/data/users.js`
2. **Modify Permissions**: Update permission logic di context
3. **Add Patient Fields**: Update form dan data structure
4. **Custom Views**: Tambahkan view baru di `VIEWS` object

---

**Sistem ini kompatibel dengan semua fitur existing TBC Hidden Cluster Map**