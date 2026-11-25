import { geoContains, geoDistance } from 'd3-geo'

// Mencari kab/kota yang memuat titik GPS (uji titik dalam poligon di perangkat)
export function cariKab(geo, lon, lat) {
  const f = geo.features.find(ft => geoContains(ft, [lon, lat]))
  return f ? String(f.properties.kode) : null
}
// Kab/kota terdekat bila titik jatuh di laut atau di luar Sumatera
export function terdekat(kab, lon, lat) {
  let best = null, dmin = Infinity
  kab.forEach(k => { const d = geoDistance([lon, lat], [k.lon, k.lat]); if (d < dmin) { dmin = d; best = k } })
  return { kab: best, km: dmin * 6371 }
}
export const jarakKm = (a, b) => geoDistance(a, b) * 6371
