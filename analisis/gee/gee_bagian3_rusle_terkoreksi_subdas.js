// =====================================================================
// GEE BAGIAN 3: RUSLE terkoreksi + sub-DAS hulu-hilir (esai banjir & longsor Sumatera)
// Menggantikan tabel G dan H pada bagian 2. Perubahan dibanding bagian 2:
//  1. K (EPIC): koefisien f_csand dikoreksi dari -0,256 menjadi -0,0256 (Williams 1995; Sharpley & Williams 1990).
//     Dengan -0,256 faktor tersebut selalu 0,2 sehingga K nyaris konstan (0,014-0,017).
//  2. R: Renard & Freimund (1994) bentuk lengkap. P <= 850 mm: 0,0483 P^1,61; P > 850 mm: 587,8 - 1,219 P + 0,004105 P^2.
//     Bentuk pangkat lama hanya berlaku untuk P <= 850 mm. R pangkat lama tetap diekspor (R_pangkat) sebagai uji kepekaan.
//  3. C: NDVI MODIS disaring kualitas (band SummaryQA <= 1); lahan terbangun (WorldCover 50) diberi A = 0
//     dan tubuh air (80) serta lahan basah (90) dikeluarkan dari perhitungan.
//  4. Zonal dihitung pada resolusi asli MERIT (90 m), bukan 250 m.
//  5. Sub-DAS: HydroSHEDS HydroBASINS level 8 untuk akumulasi hulu-hilir (K1 tabel sub-DAS, K2 irisan kab x sub-DAS).
// Cara pakai: Run, lalu tab Tasks > RUN ALL. Hasil ke folder EQ_Sumatera_GEE.
// =====================================================================

var ASSET = 'projects/teknbigdata/assets/sumatera_kabkota_154';   // <-- samakan dengan project/asset milikmu
var FOLDER = 'EQ_Sumatera_GEE';
var kab = ee.FeatureCollection(ASSET);
var kabId = kab.select(['kode_bps', 'nama', 'provinsi', 'kd_prov']);
var geom = kab.geometry();

function zonal(img, fc, scale, tileScale, reducer) {
  return img.reduceRegions({
    collection: fc, reducer: reducer || ee.Reducer.mean(), scale: scale, tileScale: tileScale || 4
  }).map(function (f) { return f.setGeometry(null); });
}

var chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY').filterBounds(geom).select('precipitation');
var chirpsProj = chirps.first().projection();
var merit = ee.Image('MERIT/Hydro/v1_0_1');
var meritProj = merit.select('elv').projection();
var hansen = ee.Image('UMD/hansen/global_forest_change_2025_v1_13');
var landMask = hansen.select('datamask').eq(1);
var lossYr = hansen.select('lossyear');
var demCol = ee.ImageCollection('COPERNICUS/DEM/GLO30').select('DEM');
var dem = demCol.mosaic().setDefaultProjection(demCol.first().projection());
var slope30 = ee.Terrain.slope(dem);
var wc = ee.ImageCollection('ESA/WorldCover/v200').first().select('Map');
var builtUp = wc.eq(50);
var erodible = wc.neq(80).and(wc.neq(90));   // tubuh air (80) dan lahan basah (90) dikeluarkan

// ---------- R ----------
function annualP(y) {
  y = ee.Number(y);
  return chirps.filter(ee.Filter.calendarRange(y, y, 'year')).sum().reproject(chirpsProj);
}
function R_RF(P) {   // Renard & Freimund (1994), MJ mm ha-1 jam-1 th-1
  var low = P.pow(1.61).multiply(0.0483);
  var high = P.multiply(-1.219).add(587.8).add(P.pow(2).multiply(0.004105));
  return low.where(P.gt(850), high);
}
function R_pow(P) { return P.pow(1.61).multiply(0.0483); }

// ---------- K (EPIC) ----------
function soil030(name) {
  var img = ee.Image('projects/soilgrids-isric/' + name + '_mean');
  return img.select([name + '_0-5cm_mean', name + '_5-15cm_mean', name + '_15-30cm_mean']).reduce(ee.Reducer.mean());
}
var SAN = soil030('sand').divide(10);     // g/kg -> %
var SIL = soil030('silt').divide(10);
var CLA = soil030('clay').divide(10);
var C_org = soil030('soc').divide(100);   // dg/kg -> % karbon organik
var fcsand = SAN.multiply(-0.0256).multiply(ee.Image(1).subtract(SIL.divide(100))).exp().multiply(0.3).add(0.2);
var fclsi = SIL.divide(CLA.add(SIL)).pow(0.3);
var forgc = ee.Image(1).subtract(C_org.multiply(0.25).divide(C_org.add(C_org.multiply(-2.95).add(3.72).exp())));
var SN1 = ee.Image(1).subtract(SAN.divide(100));
var fhisand = ee.Image(1).subtract(SN1.multiply(0.7).divide(SN1.add(SN1.multiply(22.9).subtract(5.51).exp())));
var K = fcsand.multiply(fclsi).multiply(forgc).multiply(fhisand).multiply(0.1317).rename('K');   // t ha h ha-1 MJ-1 mm-1

// ---------- LS (Moore & Burch 1986), MERIT 90 m ----------
var slopeRad = ee.Terrain.slope(merit.select('elv')).multiply(Math.PI / 180);
var As = merit.select('upa').multiply(1e6).divide(90).min(300);   // luas tangkapan spesifik (m), dibatasi 300 m
var LS = As.divide(22.13).pow(0.4).multiply(slopeRad.sin().divide(0.0896).pow(1.3)).rename('LS');

// ---------- C (van der Knijff dkk. 1999) dari MODIS NDVI, disaring kualitas ----------
var modis = ee.ImageCollection('MODIS/061/MOD13Q1').filterBounds(geom);
function C_year(y) {
  y = ee.Number(y);
  var col = modis.filter(ee.Filter.calendarRange(y, y, 'year'))
    .map(function (img) { return img.select('NDVI').updateMask(img.select('SummaryQA').lte(1)); });
  // NDVI <= 0.05 (laut, awan sisa, badan air) dibuang, bukan dipaksa ke 0: nilai 0 memberi C = 1 (tanah terbuka),
  // dan itu menggelembungkan erosi di sel pesisir yang bercampur laut (mis. Tanjung Pinang, Batam, Sibolga).
  var nd = col.median().multiply(0.0001).updateMask(col.median().multiply(0.0001).gt(0.05)).min(0.95);
  return nd.multiply(-2).divide(ee.Image(1).subtract(nd)).exp().rename('C');
}

function rusle(Rimg, Cimg) {
  var A = Rimg.multiply(K).multiply(LS).multiply(Cimg);
  A = A.where(builtUp, 0).updateMask(erodible).updateMask(landMask);   // P = 1 (tanpa data konservasi)
  return A.rename('A_tha');
}
function zonal90(img) {
  return zonal(img.setDefaultProjection(meritProj), kabId, 90, 16);
}

// ---------- G2: statis (rata-rata 2015-2025) ----------
var years = ee.List.sequence(2015, 2025);
var Pmean = ee.ImageCollection(years.map(annualP)).mean().reproject(chirpsProj);
var Cmean = ee.ImageCollection(years.map(C_year)).mean().rename('C');
var Rrf = R_RF(Pmean).rename('R');
var A_rf = rusle(Rrf, Cmean);
var A_pow = rusle(R_pow(Pmean), Cmean).rename('A_tha_Rpangkat');
var imgG2 = ee.Image.cat([
  Rrf, R_pow(Pmean).rename('R_pangkat'), K, LS, Cmean, A_rf, A_pow,
  A_rf.gt(180).rename('frak_erosi_berat_gt180'),
  A_rf.gt(60).rename('frak_erosi_gt60')
]);
var tabG2 = zonal90(imgG2);
// G3: distribusi piksel A (median, p90, persentase piksel A > 180) karena rata-rata sangat dipengaruhi piksel ekstrem
var pctRed = ee.Reducer.median().combine({reducer2: ee.Reducer.percentile([90]), sharedInputs: true});
var imgG3 = ee.Image.cat([A_rf.rename('A_tha'), A_rf.gt(180).rename('frak_erosi_berat_gt180')]);
var tabG3 = imgG3.reduceRegions({collection: kabId, reducer: pctRed, scale: 90, tileScale: 16})
  .map(function (f) { return f.setGeometry(null); });
Export.table.toDrive({collection: tabG3, description: 'gee3_G3_rusle_persentil', folder: FOLDER, fileFormat: 'CSV'});

// ---------- H2: tahunan (satu task per tahun) ----------
function tabH2(y) {
  var Rt = R_RF(annualP(y)).rename('R_t');
  var Ct = C_year(y);
  var At = rusle(Rt, Ct);
  var img = ee.Image.cat([Rt, Ct.rename('C_t'), At.rename('A_t_tha'), At.gt(180).rename('frak_erosi_berat_t')]);
  return zonal90(img).map(function (f) { return f.set('tahun', y); });
}

// ---------- K: sub-DAS HydroBASINS level 8 ----------
var basins = ee.FeatureCollection('WWF/HydroSHEDS/v1/Basins/hybas_8').filterBounds(geom);
var ids = basins.aggregate_array('HYBAS_ID').sort();
basins = basins.map(function (f) { return f.set('idx', ids.indexOf(f.get('HYBAS_ID')).add(1)); });
var idxImg = basins.reduceToImage(['idx'], ee.Reducer.first()).rename('idx').toInt();
// K1: atribut sub-DAS: erosi (A rata-rata), hilang hutan di lereng curam 2015-2025, topologi hulu-hilir
var lossSteep1525 = lossYr.gte(15).and(lossYr.lte(25)).unmask(0).and(slope30.gt(15)).updateMask(landMask).rename('loss_curam_1525');
var forest2000Steep = hansen.select('treecover2000').gte(30).and(slope30.gt(15)).updateMask(landMask).rename('hutan_curam_2000');
var imgK = ee.Image.cat([A_rf, lossSteep1525, forest2000Steep, slope30.rename('slope_deg'), ee.Image.pixelArea().divide(1e6).rename('km2_piksel')]);
// Dipecah jadi 2 task (idx 1-350 dan 351-693) dan skala 250 m: versi 90 m melebihi batas waktu (error code 3).
var tabK1a = imgK.reduceRegions({
  collection: basins.filter(ee.Filter.lte('idx', 350)), reducer: ee.Reducer.mean(), scale: 250, tileScale: 16
});
var tabK1b = imgK.reduceRegions({
  collection: basins.filter(ee.Filter.gt('idx', 350)), reducer: ee.Reducer.mean(), scale: 250, tileScale: 16
});
var k1Map = function (f) {
  return ee.Feature(null, {
    idx: f.get('idx'), HYBAS_ID: f.get('HYBAS_ID'), NEXT_DOWN: f.get('NEXT_DOWN'), MAIN_BAS: f.get('MAIN_BAS'),
    SUB_AREA: f.get('SUB_AREA'), UP_AREA: f.get('UP_AREA'), ENDO: f.get('ENDO'), COAST: f.get('COAST'),
    A_tha: f.get('A_tha'), loss_curam_1525: f.get('loss_curam_1525'), hutan_curam_2000: f.get('hutan_curam_2000'),
    slope_deg: f.get('slope_deg')
  });
};
// K2: histogram sub-DAS di setiap kab/kota (jumlah piksel 250 m per idx)
var tabK2 = idxImg.reduceRegions({
  collection: kabId, reducer: ee.Reducer.frequencyHistogram(), scale: 250, tileScale: 8
}).map(function (f) { return f.setGeometry(null); });

// ---------- Ekspor ----------
Export.table.toDrive({collection: tabG2, description: 'gee3_G2_rusle_statis_terkoreksi', folder: FOLDER, fileFormat: 'CSV'});
for (var yr = 2015; yr <= 2025; yr++) {
  Export.table.toDrive({collection: tabH2(yr), description: 'gee3_H2_rusle_' + yr, folder: FOLDER, fileFormat: 'CSV'});
}
Export.table.toDrive({collection: tabK1a.map(k1Map), description: 'gee3_K1a_subdas_idx1-350', folder: FOLDER, fileFormat: 'CSV'});
Export.table.toDrive({collection: tabK1b.map(k1Map), description: 'gee3_K1b_subdas_idx351-693', folder: FOLDER, fileFormat: 'CSV'});
Export.table.toDrive({collection: tabK2, description: 'gee3_K2_kab_x_subdas', folder: FOLDER, fileFormat: 'CSV'});

print('Jumlah sub-DAS (HydroBASINS L8):', basins.size());
print('Contoh G2:', tabG2.limit(3));
Map.centerObject(kab, 5);
Map.addLayer(K.clip(geom), {min: 0.01, max: 0.06, palette: ['ffffcc', 'fd8d3c', '800026']}, 'K (EPIC terkoreksi)');
Map.addLayer(basins.style({color: 'blue', fillColor: '00000000', width: 1}), {}, 'Sub-DAS L8');
