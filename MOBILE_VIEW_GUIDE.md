# Panduan Mobile View & Bottom Navigation

Dokumen ini menjelaskan link yang dipakai untuk tampilan mobile dan bottom navigation pada aplikasi **TBC Hidden Cluster Map**.

## 1. Link Utama Mobile View

Gunakan URL berikut untuk membuka tampilan aplikasi (desktop dan mobile):

- **`/app`** → otomatis diarahkan ke **`/app/planner`**

Pada layar kecil (mobile), **bottom navigation** akan muncul otomatis di bagian bawah layar.

## 2. Link per Tampilan (Bottom Navigation)

Bottom navigation menggunakan link berikut:

| Menu | Link | Deskripsi |
| --- | --- | --- |
| Mobilitas | `/app/mobility` | Peta mobilitas + flow arcs + heatmap gap suspek | 
| Planner | `/app/planner` | Perencanaan intervensi + cakupan | 
| Data Pasien | `/app/patients` | Manajemen data pasien (role-based) |

## 3. Cara Menguji di Lokal

1. Jalankan aplikasi:
   ```bash
   npm run dev
   ```
2. Buka URL:
   - `http://localhost:5173/app` → tampilan mobile/desktop utama
3. Simulasikan mobile view di DevTools (mode responsif) untuk melihat bottom navigation.

## 4. Catatan Implementasi

- Routing menggunakan **React Router**.
- Jika URL tidak dikenali, aplikasi otomatis mengarahkan ke **`/app/planner`**.
- Bottom navigation memanggil `onViewChange()` yang sekaligus mengubah URL agar dapat di-share.
