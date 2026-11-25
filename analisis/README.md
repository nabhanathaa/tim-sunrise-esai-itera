# Analisis esai: data, notebook, dan skrip Google Earth Engine

Folder ini memuat bahan yang dipakai untuk menghasilkan angka di naskah esai dan data di aplikasi SIGAP.

| Berkas | Isi |
|---|---|
| `analisis_banjir_longsor_sumatera_v5.ipynb` | Notebook analisis lengkap (74 sel) beserta keluarannya: data dan target, Metode 1 (RUSLE dan tekanan hulu per sub-DAS), Metode 2 (model, blok spasial, SHAP dengan uji plasebo, validasi kejadian 2025), Metode 3 (TOPSIS dan uji bobot). |
| `data/master_panel_v4.csv` | Panel 154 kabupaten/kota × 2015–2025 (1.694 baris, 109 kolom). |
| `data/subdas_hulu_hilir.csv` | 693 sub-DAS HydroBASINS level 8 dengan akumulasi kehilangan hutan lereng curam di hulu. |
| `gee/gee_bagian1_kabkota_154.js` | Hutan, topografi, tutupan lahan, hujan, tanah, dan NDVI per kab/kota. |
| `gee/gee_bagian2_hujan_hutan_rusle.js` | Hujan ekstrem, hujan kejadian 2025, hutan lereng curam, HAND, genangan Sentinel-1. |
| `gee/gee_bagian3_rusle_terkoreksi_subdas.js` | RUSLE terkoreksi pada 90 m dan tabel sub-DAS untuk analisis hulu dan hilir. |
| `gee/gee_bagian4_imerg_harian.js` | Hujan IMERG harian 20 November–6 Desember 2025 untuk fitur Putar ulang. |

## Menjalankan notebook

```
pip install pandas numpy scipy scikit-learn xgboost shap matplotlib seaborn
jupyter notebook analisis_banjir_longsor_sumatera_v5.ipynb
```

Notebook membaca `data/master_panel_v4.csv` dari folder yang sama. Hasil acak dikunci dengan `SEED`, sehingga angka yang keluar sama dengan naskah.

## Menjalankan skrip Earth Engine

Buka https://code.earthengine.google.com, tempel isi skrip, ganti `ASSET` dengan aset batas 154 kabupaten/kota milik Anda, klik Run, lalu jalankan tugas ekspor di tab Tasks. Hasil CSV masuk ke Google Drive.

## Sumber data

DIBI BNPB, BPS, CHIRPS, GPM IMERG V07, Hansen Global Forest Change v1.13, Copernicus DEM, MERIT Hydro, HydroBASINS, SoilGrids, ESA WorldCover, MODIS, Sentinel-1, Sentinel-2, OpenStreetMap, dan Kemenkes. Rujukan lengkap ada di daftar pustaka naskah.
