// =====================================================================
// GEE: variabel per kab/kota (154 kab/kota Sumatera) untuk esai banjir & longsor
// Cara pakai (Code Editor, code.earthengine.google.com):
//  1. Assets > NEW > Table upload > "Shape files (.shp, .shx, .dbf, .prj, or .zip)"
//     > pilih sumatera_kabkota_154_v2_shp.zip. Tunggu tugas upload selesai di tab Tasks.
//  2. Ganti ASSET di bawah dengan ID asset itu (format users/<akun>/<nama> atau projects/teknbigdata/assets/<nama>).
//  3. Klik Run. Lalu buka tab Tasks > RUN pada semua task (A, B, dan C per tahun 2015-2025); gunakan RUN ALL.
//  4. Hasil CSV masuk ke Google Drive folder EQ_Sumatera_GEE.
// Catatan: skala 1 km untuk semua variabel (rata-rata area per kab/kota).
// =====================================================================

var ASSET = 'users/GANTI_AKUN/sumatera_kabkota_154';  // <-- GANTI
var FOLDER = 'EQ_Sumatera_GEE';
var SCALE = 1000;

var kab = ee.FeatureCollection(ASSET);
var geom = kab.geometry();
var years = ee.List.sequence(2015, 2025);

// Gabungkan ee.List berisi image menjadi satu image multi-band
// (ee.Image.cat tidak menerima ee.List; penyebab error "Invalid type List<Image>").
function stackList(list) {
  list = ee.List(list);
  return ee.Image(list.slice(1).iterate(function (img, acc) {
    return ee.Image(acc).addBands(ee.Image(img));
  }, ee.Image(list.get(0))));
}

// ---------- 1. Curah hujan tahunan, CHIRPS daily (mm/tahun), 2015-2025 ----------
var chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY');
var precip = stackList(years.map(function (y) {
  y = ee.Number(y);
  return chirps.filter(ee.Filter.calendarRange(y, y, 'year')).sum()
    .rename(ee.String('precip_').cat(y.format('%d')));
}));

// ---------- 2. NDVI median tahunan, Sentinel-2 L1C Harmonized (10 m), 2015-2025 ----------
// L1C (TOA) dipakai karena SR (L2A) hampir kosong sebelum 2017 (uji: 28 vs 2.617 citra untuk 2015-2016).
// Awan dibuang dengan Cloud Score+ (cs_cdf >= 0.6). Tahun 2015 hanya Juli-Desember.
// RINGAN: satu task per tahun, rata-rata per kab/kota langsung pada skala 100 m (mengambil sampel tiap 100 m;
// untuk NDVI kontinu ini penaksir tak bias). Kolom 'count' = jumlah piksel valid, untuk audit kekosongan awan.
// (Versi sebelumnya memakai reduceResolution 10->100 m untuk semua tahun sekaligus: terlalu berat, gagal "Internal error 13".)
var csPlus = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED');
var s2raw = ee.ImageCollection('COPERNICUS/S2_HARMONIZED').filterBounds(geom);
function ndviTable(yr) {
  var col = s2raw.filterDate(yr + '-01-01', (yr + 1) + '-01-01')
    .linkCollection(csPlus, ['cs_cdf'])
    .map(function (img) { return img.updateMask(img.select('cs_cdf').gte(0.6)).select(['B8', 'B4']); });
  var nd = col.median().normalizedDifference(['B8', 'B4']).rename('ndvi');
  return nd.reduceRegions({
    collection: kab.select(['kode_bps', 'nama']),
    reducer: ee.Reducer.mean().combine({reducer2: ee.Reducer.count(), sharedInputs: true}),
    scale: 100,
    tileScale: 16
  }).map(function (f) { return f.setGeometry(null).set('tahun', yr); });
}

// ---------- 3. Kehilangan hutan per tahun (fraksi piksel), Hansen GFC 2015-2025 ----------
// Versi 2025 v1.13 (terverifikasi terbaca di GEE): lossyear 1-25 = tahun 2001-2025.
var hansen = ee.Image('UMD/hansen/global_forest_change_2025_v1_13');
var lossYr = hansen.select('lossyear');
var landMask = hansen.select('datamask').eq(1);  // 1 = darat bermata data
var loss = stackList(ee.List.sequence(2015, 2025).map(function (y) {
  y = ee.Number(y);
  // lossyear tertopeng (masked) di piksel tanpa kehilangan, sehingga mean mentah salah ~10x
  // (terbukti pada uji Simeulue: 6,9% vs 0,69% yang benar menurut luas piksel). unmask(0) + hanya piksel darat.
  return lossYr.eq(y.subtract(2000)).unmask(0).updateMask(landMask)
    .rename(ee.String('loss_').cat(y.format('%d')));
}));
var tc2000 = hansen.select('treecover2000').rename('treecover2000');  // tutupan hutan 2000 (%)

// ---------- 4. Topografi, DEM Copernicus GLO-30 ----------
// mosaic() menghilangkan proyeksi; tanpa setDefaultProjection kemiringan (slope) bernilai kosong.
var demCol = ee.ImageCollection('COPERNICUS/DEM/GLO30').select('DEM');
var dem = demCol.mosaic().setDefaultProjection(demCol.first().projection());
var topo = ee.Image.cat([
  dem.rename('elev_m'),
  ee.Terrain.slope(dem).rename('slope_deg')
]);

// ---------- 5. Tanah, SoilGrids 250 m: rata-rata 0-30 cm ----------
// Satuan: sand/clay/silt dalam g/kg; SOC dalam dg/kg (1 dg/kg = 0,1 g/kg). Diubah di analisis.
var d030 = ['0-5cm_mean', '5-15cm_mean', '15-30cm_mean'];
function soilMean(asset, prefix) {
  var img = ee.Image(asset);
  var bands = d030.map(function (d) { return prefix + '_' + d; });
  return img.select(bands).reduce(ee.Reducer.mean()).rename(prefix + '_0_30');
}
var soil = ee.Image.cat([
  soilMean('projects/soilgrids-isric/sand_mean', 'sand'),
  soilMean('projects/soilgrids-isric/clay_mean', 'clay'),
  soilMean('projects/soilgrids-isric/silt_mean', 'silt'),
  soilMean('projects/soilgrids-isric/soc_mean', 'soc')
]);

// ---------- 6. Tutupan lahan, ESA WorldCover 2021 v200 (fraksi per kelas) ----------
var wc = ee.ImageCollection('ESA/WorldCover/v200').first().select('Map');
var wcClasses = [10, 20, 30, 40, 50, 60, 80, 90, 95];
var landcover = ee.Image.cat(wcClasses.map(function (c) {
  return wc.eq(c).rename('lc_' + c);
}));

// ---------- 7. Permukaan air permanen, JRC Global Surface Water (fraksi) ----------
var gsw = ee.Image('JRC/GSW1_4/GlobalSurfaceWater');
// occurrence tertopeng di piksel yang tidak pernah berair; tanpa unmask(0), mean ~1 (salah). Terbukti di audit CSV.
var water = gsw.select('occurrence').gt(0).unmask(0).updateMask(landMask).rename('water_occ_gt0');

// ---------- Gabung semua variabel dan hitung rata-rata per kab/kota ----------
// Dipecah jadi 2 ekspor: (A) variabel ringan, (B) NDVI Sentinel-2 yang berat (11 tahun x median citra).
// PENTING (akurasi): citra beresolusi tinggi (Hansen/WorldCover 30 m, S2 10 m, DEM 30 m) tidak boleh
// langsung direduksi pada skala 1 km, karena EE hanya mengambil sampel piksel (uji: fraksi kehilangan
// hutan 2025 Simeulue menjadi ~6,8% padahal histogram piksel menunjukkan <1%). Maka dirata-ratakan dulu
// dari resolusi aslinya ke grid tetap 100 m (reduceResolution), baru dirata-ratakan per kab/kota.
function agg100(img) {
  // maxPixels dinaikkan ke 65535: NDVI butuh 4.397 piksel input per sel 100 m (batas lama 4096 membuat task C gagal).
  return img.reduceResolution({reducer: ee.Reducer.mean(), maxPixels: 65535})
    .reproject({crs: 'EPSG:4326', scale: 100});  // scale dalam METER menurut dokumentasi GEE (grid ~100 m)
}
function zonal(img, scale, tileScale) {
  return img.reduceRegions({
    collection: kab,
    reducer: ee.Reducer.mean(),
    scale: scale,
    tileScale: tileScale
  }).map(function (f) { return f.setGeometry(null); });  // buang geometri agar CSV ringan
}

// A: kehilangan hutan, tutupan pohon 2000, DEM/slope, tutupan lahan, air (resolusi 30 m -> 100 m)
var fine = agg100(ee.Image.cat([loss, tc2000, topo, landcover, water]));
// B: hujan CHIRPS (5 km) dan SoilGrids (250 m): sampel pada 250 m cukup
var coarse = ee.Image.cat([precip, soil]);

print('Band A (halus):', fine.bandNames());
print('Band SoilGrids (cek nama):', ee.Image('projects/soilgrids-isric/sand_mean').bandNames());

var tableA = zonal(fine, 100, 8);
var tableB = zonal(coarse, 250, 4);
print('Contoh baris B (hujan, tanah):', tableB.first());

Export.table.toDrive({collection: tableA, description: 'gee_kabkota_154_A_hutan_topo_lc', folder: FOLDER, fileFormat: 'CSV'});
Export.table.toDrive({collection: tableB, description: 'gee_kabkota_154_B_hujan_tanah', folder: FOLDER, fileFormat: 'CSV'});
// C: satu task NDVI per tahun (2015-2025) -> klik RUN ALL di tab Tasks
for (var yr = 2015; yr <= 2025; yr++) {
  Export.table.toDrive({
    collection: ndviTable(yr),
    description: 'gee_kabkota_154_C_ndvi_' + yr,
    folder: FOLDER,
    fileFormat: 'CSV'
  });
}

// ---------- Peta cek cepat (dipotong ke Sumatera; hitam di peta sebelumnya = laut bernilai 0 pada DEM global) ----------
Map.centerObject(kab, 5);
Map.addLayer(precip.select('precip_2025').clip(geom), {min: 1000, max: 6000, palette: ['white', 'blue']}, 'Hujan 2025');
Map.addLayer(kab.style({color: 'red', fillColor: '00000000', width: 1}), {}, 'Batas kab/kota');
