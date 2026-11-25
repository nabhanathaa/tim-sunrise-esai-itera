// =====================================================================
// GEE BAGIAN 4: hujan IMERG HARIAN per kab/kota, 20 Nov - 6 Des 2025
// Untuk fitur "Putar Ulang Senyar 2025" di aplikasi.
//   - 17 kolom h_YYYYMMDD = hujan harian (mm), WIB tidak dipakai: hari UTC
//   - 17 kolom i_YYYYMMDD = intensitas maksimum setengah-jam (mm/jam)
// Cek mutu: jumlah h_20251122..h_20251205 harus mendekati ev_imerg_total_mm (bagian 2).
// Cara pakai: Run, lalu di tab Tasks klik RUN. Hasil ke Google Drive folder EQ_Sumatera_GEE.
// File CSV hasilnya cukup disalin ke folder public/data aplikasi dengan nama imerg_harian.csv
// =====================================================================
var ASSET = 'projects/teknbigdata/assets/sumatera_kabkota_154';
var FOLDER = 'EQ_Sumatera_GEE';
var kab = ee.FeatureCollection(ASSET).select(['kode_bps', 'nama', 'provinsi']);

var start = ee.Date('2025-11-20');
var nDays = 17;   // 20 Nov - 6 Des 2025
var imerg = ee.ImageCollection('NASA/GPM_L3/IMERG_V07').select('precipitation'); // mm/jam, tiap 30 menit

var days = ee.List.sequence(0, nDays - 1);
var bands = days.map(function (i) {
  var d0 = start.advance(ee.Number(i), 'day');
  var c = imerg.filterDate(d0, d0.advance(1, 'day'));
  var tag = d0.format('YYYYMMdd');
  return ee.Image.cat([
    c.sum().multiply(0.5).rename(ee.String('h_').cat(tag)),   // mm/jam x 0,5 jam = mm
    c.max().rename(ee.String('i_').cat(tag))
  ]);
});
var img = ee.ImageCollection.fromImages(bands).toBands();
// toBands menambahkan awalan indeks "0_", "1_", ...; buang awalannya
var names = img.bandNames().map(function (b) { return ee.String(b).replace('^[0-9]+_', ''); });
img = img.rename(names);

var tab = img.reduceRegions({collection: kab, reducer: ee.Reducer.mean(), scale: 1000, tileScale: 4})
  .map(function (f) { return f.setGeometry(null); });

print('Contoh 3 baris:', tab.limit(3));
Export.table.toDrive({collection: tab, description: 'gee4_imerg_harian_20nov_6des2025', folder: FOLDER, fileFormat: 'CSV'});
