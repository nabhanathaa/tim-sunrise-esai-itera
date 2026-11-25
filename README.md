# SIGAP · Sistem Informasi Hulu–Hilir untuk Pemulihan

Aplikasi web progresif (PWA) untuk esai **Essay Quest DateraQuest 2.0 (ITERA)**, subtema Lingkungan dan Agrikultur.
Aplikasi ini menghubungkan hutan lereng curam yang hilang di hulu dengan kabupaten/kota yang terdampak banjir bandang
dan longsor di hilir, lalu menerjemahkannya menjadi prioritas pemulihan (R3P) untuk 154 kabupaten/kota Sumatera.

> Nama "SIGAP" masih sementara. Untuk menggantinya, ubah **satu berkas saja**: `src/config.js`
> (nama, kepanjangan, slogan). Judul tab, layar masuk, chatbot, dan manifest PWA ikut berubah.

## Tampilan

Aplikasi dirancang seperti aplikasi HP. Di laptop/desktop tampil di dalam bingkai ponsel dengan panel penjelasan
di kiri-kanan (tombol **Buka layar penuh** tersedia); di HP tampil layar penuh dan bisa dipasang ke layar utama (PWA, luring).

## Pengguna (4 peran) dan fitur

| Peran | Beranda menampilkan | Fitur utama |
|---|---|---|
| Warga & relawan | Siaga hujan wilayahnya (prakiraan langsung per jam) | Lapor kejadian, panduan dan kontak darurat |
| Petugas BPBD | Antrean verifikasi laporan | Verifikasi/tolak/minta info, peta dampak, putar ulang Senyar |
| Perencana R3P (Bappeda/BNPB) | Peringkat prioritas wilayahnya | TOPSIS dengan bobot yang bisa diubah, ekspor CSV |
| Pengelola DAS (BPDAS/KPH) | Tekanan hulu wilayahnya | Rantai hulu–hilir, kab/kota penyumbang kehilangan hutan |

| Menu | Isi |
|---|---|
| Peta | 154 kab/kota, 5 lapisan (korban 2025, prioritas R3P, tekanan hulu, hujan 3 hari langsung, erosi RUSLE), garis aliran dari hulu, titik laporan |
| Lapor (tombol tengah) | GPS asli dari perangkat + deteksi kab/kota otomatis, foto (dikompres) dan video, detail kejadian, skor kepercayaan 6 cek |
| Laporan | Antrean verifikasi, detail bukti, riwayat, rute Google Maps, ekspor CSV, notifikasi dua arah |
| Siaga | Prakiraan hujan Open-Meteo per jam untuk wilayah sendiri dan peta siaga 154 kab/kota (kategori BMKG) |
| Putar ulang | Animasi harian 20 Nov–6 Des 2025 dari catatan DIBI; lapisan hujan IMERG bila CSV tersedia |
| Prioritas R3P, Rantai hulu, Profil wilayah | Hasil analisis esai per kab/kota |
| Tanya | Asisten berbasis aturan yang menjawab dari data aplikasi (bekerja luring, tidak mengarang angka) |
| Panduan, Metode, Akun | Kontak darurat, tas siaga, rumus dan sumber data, ganti peran, hapus data contoh |

**Catatan kejujuran prototipe**

- Masuk, OTP, laporan, dan notifikasi disimpan di perangkat (localStorage/IndexedDB). SMS OTP belum tersambung; kode uji coba `2025`.
  Buka dua tab (warga dan BPBD) untuk melihat alur laporan → verifikasi → notifikasi berjalan langsung.
- Empat laporan bertanda **CONTOH** dibuat untuk demo dan bisa dihapus di Akun.
- Tingkat siaga adalah indikasi aplikasi dari prakiraan Open-Meteo, bukan peringatan resmi BMKG/BPBD.

## Menjalankan di laptop

Butuh Node.js 22 (https://nodejs.org).

```bash
npm install
npm run dev      # buka http://localhost:5173
npm run build    # hasil di folder dist/
```

## Data

Semua data ada di `public/data/` dan dihasilkan dari notebook analisis v4/v5:

- `kab.json` — atribut 154 kab/kota (dampak 2025, tekanan hulu, RUSLE, kriteria TOPSIS, kestabilan peringkat)
- `kab.geojson` — batas kab/kota (disederhanakan)
- `tahunan.json` — total DIBI per tahun 2015–2025
- `dibi_senyar.json` — catatan kejadian banjir/longsor DIBI 20 Nov–6 Des 2025 per tanggal
- `imerg_harian.csv` *(opsional)* — hujan IMERG harian per kab/kota. Jalankan `tools/gee_kabkota_154_bagian4_imerg_harian.js`
  di Google Earth Engine, unduh CSV dari Drive, ganti namanya menjadi `imerg_harian.csv`, dan taruh di `public/data/`.
  Lapisan "Hujan kumulatif IMERG" pada Putar Ulang otomatis aktif.

`tools/siapkan_data.py` membangun ulang `kab.json` dan berkas lain dari `master_panel_v4.csv`.
