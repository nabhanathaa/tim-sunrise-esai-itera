// =====================================================================
// GEE BAGIAN 2: variabel yang melengkapi bagian 1 (esai banjir & longsor Sumatera)
//   D. Hujan ekstrem tahunan 2015-2025 (CHIRPS): Rx1day, Rx3day, hari >= 50 mm, hari >= 100 mm
//   E. Hujan saat kejadian 22 Nov - 5 Des 2025 (CHIRPS + GPM IMERG V07 setengah-jam)
//   F. Kehilangan hutan di lereng curam (> 15 derajat) per tahun 2015-2025 (Hansen GFC 2025 v1.13)
//   G. Kerentanan statis: HAND (MERIT Hydro) + RUSLE jangka panjang (R, K, LS, C, A)
//   H. RUSLE tahunan 2015-2025 (R_t dan C_t berubah per tahun)
//   I. Kejadian 2025 (Aceh, Sumut, Sumbar): genangan Sentinel-1 dan indikasi longsor Sentinel-2
//   J. Raster genangan 2025 (GeoTIFF 30 m) untuk peta naskah
// Cara pakai: Run, lalu di tab Tasks klik RUN ALL. Hasil ke Google Drive folder EQ_Sumatera_GEE.
// =====================================================================

var ASSET = 'projects/teknbigdata/assets/sumatera_kabkota_154';
var FOLDER = 'EQ_Sumatera_GEE';
var kab = ee.FeatureCollection(ASSET);
var kabId = kab.select(['kode_bps', 'nama', 'provinsi', 'kd_prov']);
var geom = kab.geometry();

function zonal(img, fc, scale, tileScale, reducer) {
  return img.reduceRegions({
    collection: fc,
    reducer: reducer || ee.Reducer.mean(),
    scale: scale,
    tileScale: tileScale || 4
  }).map(function (f) { return f.setGeometry(null); });
}
// Rata-rata dari resolusi asli ke grid tetap 100 m (scale pada reproject dalam METER).
function agg100(img) {
  return img.reduceResolution({reducer: ee.Reducer.mean(), maxPixels: 65535})
    .reproject({crs: 'EPSG:4326', scale: 100});
}

// ---------- Data dasar ----------
var chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY').filterBounds(geom).select('precipitation');
var chirpsProj = chirps.first().projection();
var hansen = ee.Image('UMD/hansen/global_forest_change_2025_v1_13');
var landMask = hansen.select('datamask').eq(1);
var lossYr = hansen.select('lossyear');
var demCol = ee.ImageCollection('COPERNICUS/DEM/GLO30').select('DEM');
var dem = demCol.mosaic().setDefaultProjection(demCol.first().projection());
var slope30 = ee.Terrain.slope(dem);
var merit = ee.Image('MERIT/Hydro/v1_0_1');

// =====================================================================
// D. Hujan ekstrem tahunan (indeks ETCCDI: Rx1day, Rx3day; R50mm, R100mm)
//    Dihitung pada grid asli CHIRPS (~5,5 km) lalu dirata-ratakan per kab/kota.
// =====================================================================
function rainExtremes(y) {
  y = ee.Number(y);
  var start = ee.Date.fromYMD(y, 1, 1);
  var end = start.advance(1, 'year');
  var c = chirps.filterDate(start, end);
  var days = c.toList(400);
  var n = c.size();
  // jumlah 3 hari bergulir
  var s3 = ee.ImageCollection(ee.List.sequence(0, n.subtract(3)).map(function (i) {
    i = ee.Number(i);
    return ee.Image(days.get(i)).add(ee.Image(days.get(i.add(1)))).add(ee.Image(days.get(i.add(2))));
  }));
  var img = ee.Image.cat([
    c.max().rename('rx1day_mm'),
    s3.max().rename('rx3day_mm'),
    c.map(function (d) { return d.gte(50); }).sum().rename('hari_ge50mm'),
    c.map(function (d) { return d.gte(100); }).sum().rename('hari_ge100mm')
  ]).reproject(chirpsProj);
  return zonal(img, kabId, 1000, 4).map(function (f) { return f.set('tahun', y); });
}
var tabD = ee.FeatureCollection(ee.List.sequence(2015, 2025).map(rainExtremes)).flatten();

// =====================================================================
// E. Hujan saat kejadian Siklon Senyar (22 Nov - 5 Des 2025)
// =====================================================================
var evStart = '2025-11-22', evEnd = '2025-12-06';
var chEv = chirps.filterDate(evStart, evEnd);
var imerg = ee.ImageCollection('NASA/GPM_L3/IMERG_V07').filterDate(evStart, evEnd).select('precipitation'); // mm/jam, tiap 30 menit
var imgE = ee.Image.cat([
  chEv.sum().reproject(chirpsProj).rename('ev_chirps_total_mm'),
  chEv.max().reproject(chirpsProj).rename('ev_chirps_max1hari_mm'),
  imerg.sum().multiply(0.5).rename('ev_imerg_total_mm'),          // mm/jam x 0,5 jam
  imerg.max().rename('ev_imerg_intensitas_maks_mmjam')
]);
var tabE = zonal(imgE, kabId, 1000, 4);

// =====================================================================
// F. Kehilangan hutan di lereng curam (> 15 derajat), fraksi luas darat kab/kota
// =====================================================================
var steep = slope30.gt(15);
function stackList(list) {
  list = ee.List(list);
  return ee.Image(list.slice(1).iterate(function (img, acc) {
    return ee.Image(acc).addBands(ee.Image(img));
  }, ee.Image(list.get(0))));
}
var lossSteep = stackList(ee.List.sequence(2015, 2025).map(function (y) {
  y = ee.Number(y);
  return lossYr.eq(y.subtract(2000)).unmask(0).and(steep).updateMask(landMask)
    .rename(ee.String('loss_curam_').cat(y.format('%d')));
}))
  .addBands(steep.updateMask(landMask).rename('frak_lereng_curam'))
  .addBands(hansen.select('treecover2000').gte(30).and(steep).updateMask(landMask).rename('frak_hutan_curam_2000'));
var tabF = zonal(agg100(lossSteep), kabId, 100, 8);

// =====================================================================
// G. Kerentanan statis: HAND dan RUSLE jangka panjang
// =====================================================================
// HAND (Height Above Nearest Drainage), MERIT Hydro 90 m: dataran rendah dekat sungai = rawan genangan
var hnd = merit.select('hnd');
// --- R: erosivitas hujan, Renard & Freimund (1994): R = 0,0483 P^1,61 (MJ mm ha-1 jam-1 th-1), P = hujan tahunan (mm)
function annualP(y) {
  y = ee.Number(y);
  return chirps.filter(ee.Filter.calendarRange(y, y, 'year')).sum();
}
function R_of(P) { return P.pow(1.61).multiply(0.0483); }
var Pmean = ee.ImageCollection(ee.List.sequence(2015, 2025).map(annualP)).mean().reproject(chirpsProj);
var Rmean = R_of(Pmean).rename('R');
// --- K: EPIC (Williams 1995) dari SoilGrids 0-30 cm; hasil x 0,1317 -> t ha jam ha-1 MJ-1 mm-1
function soil030(name) {
  var img = ee.Image('projects/soilgrids-isric/' + name + '_mean');
  return img.select([name + '_0-5cm_mean', name + '_5-15cm_mean', name + '_15-30cm_mean']).reduce(ee.Reducer.mean());
}
var SAN = soil030('sand').divide(10);   // g/kg -> %
var SIL = soil030('silt').divide(10);
var CLA = soil030('clay').divide(10);
var C_org = soil030('soc').divide(100); // dg/kg -> %
var fcsand = SAN.multiply(-0.256).multiply(ee.Image(1).subtract(SIL.divide(100))).exp().multiply(0.3).add(0.2);
var fclsi = SIL.divide(CLA.add(SIL)).pow(0.3);
var forgc = ee.Image(1).subtract(C_org.multiply(0.25).divide(C_org.add(C_org.multiply(-2.95).add(3.72).exp())));
var SN1 = ee.Image(1).subtract(SAN.divide(100));
var fhisand = ee.Image(1).subtract(SN1.multiply(0.7).divide(SN1.add(SN1.multiply(22.9).subtract(5.51).exp())));
var K = fcsand.multiply(fclsi).multiply(forgc).multiply(fhisand).multiply(0.1317).rename('K');
// --- LS: Moore & Burch (1986) dengan akumulasi aliran MERIT (upa, km2); panjang lereng efektif dibatasi 300 m
var slopeRad = ee.Terrain.slope(merit.select('elv')).multiply(Math.PI / 180);
var As = merit.select('upa').multiply(1e6).divide(90).min(300);   // luas tangkapan spesifik (m)
var LS = As.divide(22.13).pow(0.4).multiply(slopeRad.sin().divide(0.0896).pow(1.3)).rename('LS');
// --- C: dari NDVI MODIS MOD13Q1 250 m (van der Knijff dkk. 1999): C = exp(-2 NDVI / (1 - NDVI))
var modis = ee.ImageCollection('MODIS/061/MOD13Q1').filterBounds(geom).select('NDVI');
function C_year(y) {
  y = ee.Number(y);
  var nd = modis.filter(ee.Filter.calendarRange(y, y, 'year')).median().multiply(0.0001).max(0).min(0.95);
  return nd.multiply(-2).divide(ee.Image(1).subtract(nd)).exp();
}
var Cmean = ee.ImageCollection(ee.List.sequence(2015, 2025).map(C_year)).mean().rename('C');
// --- A = R K LS C P, P = 1 (asumsi: tidak ada data praktik konservasi seragam)
var A = Rmean.multiply(K).multiply(LS).multiply(Cmean).rename('A_tha');
var imgG = ee.Image.cat([
  hnd.rename('hand_m'),
  hnd.lt(5).rename('frak_hand_lt5m'),
  Rmean, K, LS, Cmean, A,
  A.gt(180).rename('frak_erosi_berat_gt180')   // kelas berat-sangat berat (> 180 t/ha/th)
]);
var tabG = zonal(imgG, kabId, 250, 8);

// =====================================================================
// H. RUSLE tahunan (R_t dan C_t berubah; K, LS tetap)
// =====================================================================
var tabH = ee.FeatureCollection(ee.List.sequence(2015, 2025).map(function (y) {
  y = ee.Number(y);
  var Rt = R_of(annualP(y).reproject(chirpsProj));
  var Ct = C_year(y);
  var At = Rt.multiply(K).multiply(LS).multiply(Ct);
  var img = ee.Image.cat([Rt.rename('R_t'), Ct.rename('C_t'), At.rename('A_t_tha'), At.gt(180).rename('frak_erosi_berat_t')]);
  return zonal(img, kabId, 250, 8).map(function (f) { return f.set('tahun', y); });
})).flatten();

// =====================================================================
// I. Kejadian 2025 di Aceh, Sumatera Utara, Sumatera Barat
// =====================================================================
var evKab = kabId.filter(ee.Filter.inList('kd_prov', [11, 12, 13]));
var evGeom = evKab.geometry();
// I-1. Genangan Sentinel-1 (metode change detection UN-SPIDER Recommended Practice, VH)
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  .filterBounds(evGeom).select('VH')
  .map(function (img) { return img.focalMean(50, 'circle', 'meters').copyProperties(img, ['system:time_start']); });
var pre = s1.filterDate('2025-09-15', '2025-11-21').median();
var post = s1.filterDate('2025-11-24', '2025-12-11').min();  // min: genangan terluas dalam jendela
var ratio = post.divide(pre);                               // dB negatif: rasio > 1,25 = lebih gelap (air)
var gsw = ee.Image('JRC/GSW1_4/GlobalSurfaceWater');
var flood = ratio.gt(1.25)
  .updateMask(gsw.select('seasonality').unmask(0).lt(10))   // buang air permanen/musiman panjang
  .updateMask(ee.Terrain.slope(merit.select('elv')).lt(5))   // genangan tidak di lereng > 5 derajat
  .updateMask(hnd.lt(20));                                  // dan dekat jaringan drainase
flood = flood.updateMask(flood.connectedPixelCount(8).gte(8)).selfMask();
var wc = ee.ImageCollection('ESA/WorldCover/v200').first().select('Map');
var km2 = ee.Image.pixelArea().divide(1e6);
// I-2. Indikasi longsor Sentinel-2 SR: penurunan NDVI tajam di lereng curam berhutan (perlu verifikasi visual)
var csPlus = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED');
function s2ndvi(a, b) {
  return ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED').filterBounds(evGeom).filterDate(a, b)
    .linkCollection(csPlus, ['cs_cdf'])
    .map(function (img) { return img.updateMask(img.select('cs_cdf').gte(0.6)); })
    .median().normalizedDifference(['B8', 'B4']);
}
var ndviPre = s2ndvi('2025-06-01', '2025-11-21');
var ndviPost = s2ndvi('2025-12-01', '2026-03-01');
var slide = ndviPre.subtract(ndviPost).gt(0.3).and(ndviPre.gt(0.6)).and(slope30.gt(15)).selfMask();
slide = slide.updateMask(slide.connectedPixelCount(20).gte(10));   // minimal 10 piksel (0,1 ha)
var imgI = ee.Image.cat([
  km2.updateMask(flood).rename('genangan_km2'),
  km2.updateMask(flood).updateMask(wc.eq(50)).rename('genangan_terbangun_km2'),
  km2.updateMask(flood).updateMask(wc.eq(40)).rename('genangan_pertanian_km2'),
  km2.updateMask(slide).rename('indikasi_longsor_km2')
]);
var tabI = zonal(imgI, evKab, 20, 16, ee.Reducer.sum());

// =====================================================================
// Ekspor
// =====================================================================
Export.table.toDrive({collection: tabD, description: 'gee_D_hujan_ekstrem_2015_2025', folder: FOLDER, fileFormat: 'CSV'});
Export.table.toDrive({collection: tabE, description: 'gee_E_hujan_kejadian_2025', folder: FOLDER, fileFormat: 'CSV'});
Export.table.toDrive({collection: tabF, description: 'gee_F_hutan_lereng_curam', folder: FOLDER, fileFormat: 'CSV'});
Export.table.toDrive({collection: tabG, description: 'gee_G_hand_rusle_statis', folder: FOLDER, fileFormat: 'CSV'});
Export.table.toDrive({collection: tabH, description: 'gee_H_rusle_tahunan', folder: FOLDER, fileFormat: 'CSV'});
Export.table.toDrive({collection: tabI, description: 'gee_I_genangan_longsor_2025', folder: FOLDER, fileFormat: 'CSV'});
Export.image.toDrive({
  image: flood.unmask(0).toByte().clip(evGeom), description: 'gee_J_raster_genangan_2025_30m', folder: FOLDER,
  region: evGeom.bounds(), scale: 30, crs: 'EPSG:4326', maxPixels: 1e13
});

// ---------- Cek cepat (Console) ----------
print('Contoh E (hujan kejadian):', tabE.limit(3));
print('Contoh G (HAND, RUSLE):', tabG.limit(3));
print('Jumlah citra S1 pra / pasca:', s1.filterDate('2025-09-15', '2025-11-21').size(), s1.filterDate('2025-11-24', '2025-12-11').size());
Map.centerObject(evKab, 6);
Map.addLayer(flood.clip(evGeom), {palette: ['0000ff']}, 'Genangan S1 2025');
Map.addLayer(slide.clip(evGeom), {palette: ['ff0000']}, 'Indikasi longsor 2025');
Map.addLayer(kab.style({color: 'black', fillColor: '00000000', width: 1}), {}, 'Batas kab/kota');
