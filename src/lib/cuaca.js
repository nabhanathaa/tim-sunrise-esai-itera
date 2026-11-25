import { useEffect, useState } from 'react'

// Prakiraan hujan langsung dari Open-Meteo (gratis, tanpa kunci API, model ECMWF/GFS/ICON).
// Satu permintaan memuat banyak titik: koordinat dipisah koma, hasilnya berupa array.
const API = 'https://api.open-meteo.com/v1/forecast'
const KC = 'sigap-cuaca-v1'

// Kategori hujan harian BMKG (mm/hari)
export const KATEGORI = [
  { min: 150, label: 'Ekstrem', kelas: 'k5', warna: '#E5484D' },
  { min: 100, label: 'Sangat lebat', kelas: 'k4', warna: '#F07A3A' },
  { min: 50, label: 'Lebat', kelas: 'k3', warna: '#F2A93B' },
  { min: 20, label: 'Sedang', kelas: 'k2', warna: '#2C9BD8' },
  { min: 5, label: 'Ringan', kelas: 'k1', warna: '#7CC8E8' },
  { min: -1, label: 'Sangat ringan', kelas: 'k0', warna: '#9FB3AC' }
]
export const kategori = mm => KATEGORI.find(k => (mm ?? 0) >= k.min)

// Tingkat siaga aplikasi: hujan harian maksimum 3 hari dipadukan dengan tekanan hulu.
// Ini indikasi untuk perhatian dini, BUKAN peringatan resmi BMKG/BPBD.
export function siaga(maxHarian, huluTinggi) {
  if (maxHarian >= 150) return { lv: 3, label: 'Awas', kelas: 'red' }
  if (maxHarian >= 100 || (maxHarian >= 50 && huluTinggi)) return { lv: 2, label: 'Siaga', kelas: 'orange' }
  if (maxHarian >= 50 || (maxHarian >= 20 && huluTinggi)) return { lv: 1, label: 'Waspada', kelas: 'amber' }
  return { lv: 0, label: 'Normal', kelas: 'green' }
}

const simpan = (k, v) => { try { localStorage.setItem(`${KC}-${k}`, JSON.stringify({ t: Date.now(), v })) } catch { /* abaikan */ } }
const ambil = k => { try { return JSON.parse(localStorage.getItem(`${KC}-${k}`) || 'null') } catch { return null } }

export async function prakiraanTitik(lat, lon) {
  const q = new URLSearchParams({
    latitude: lat.toFixed(3), longitude: lon.toFixed(3), timezone: 'Asia/Jakarta', forecast_days: '3', past_days: '1',
    hourly: 'precipitation,precipitation_probability',
    daily: 'precipitation_sum,precipitation_probability_max,weather_code',
    current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m'
  })
  const r = await fetch(`${API}?${q}`); if (!r.ok) throw new Error('cuaca')
  return r.json()
}

export async function prakiraanBanyak(titik) {
  const q = new URLSearchParams({
    latitude: titik.map(t => t.lat.toFixed(2)).join(','), longitude: titik.map(t => t.lon.toFixed(2)).join(','),
    timezone: 'Asia/Jakarta', forecast_days: '3', daily: 'precipitation_sum,precipitation_probability_max'
  })
  const r = await fetch(`${API}?${q}`); if (!r.ok) throw new Error('cuaca')
  const j = await r.json()
  return Array.isArray(j) ? j : [j]
}

// Hook: prakiraan satu titik (cache 30 menit, tetap tampil saat luring)
export function usePrakiraan(lat, lon, kunci) {
  const [s, setS] = useState(() => { const c = ambil(kunci); return c ? { data: c.v, t: c.t, cache: true } : { muat: true } })
  useEffect(() => {
    if (lat == null) return
    const c = ambil(kunci)
    if (c && Date.now() - c.t < 30 * 60e3) { setS({ data: c.v, t: c.t }); return }
    let hidup = true
    setS(x => ({ ...x, muat: true }))
    prakiraanTitik(lat, lon).then(v => { simpan(kunci, v); hidup && setS({ data: v, t: Date.now() }) })
      .catch(() => hidup && setS(x => x.data ? { ...x, muat: false, luring: true } : { gagal: true }))
    return () => { hidup = false }
  }, [lat, lon, kunci])
  return s
}

// Hook: prakiraan 3 hari untuk seluruh 154 kab/kota (sekali permintaan)
export function usePrakiraanSumatra(kab) {
  const [s, setS] = useState(() => { const c = ambil('sumatra'); return c ? { data: c.v, t: c.t } : { muat: true } })
  useEffect(() => {
    if (!kab) return
    const c = ambil('sumatra')
    if (c && Date.now() - c.t < 60 * 60e3) return
    let hidup = true
    prakiraanBanyak(kab).then(arr => {
      const v = {}
      arr.forEach((o, i) => { const d = o.daily?.precipitation_sum || []; v[kab[i].kode] = { hari: o.daily?.time || [], mm: d.map(x => x ?? 0), p: o.daily?.precipitation_probability_max || [] } })
      simpan('sumatra', v); hidup && setS({ data: v, t: Date.now() })
    }).catch(() => hidup && setS(x => x.data ? { ...x, luring: true } : { gagal: true }))
    return () => { hidup = false }
  }, [kab])
  return s
}

const KODE_CUACA = { 0: 'Cerah', 1: 'Cerah berawan', 2: 'Berawan', 3: 'Mendung', 45: 'Berkabut', 48: 'Berkabut', 51: 'Gerimis', 53: 'Gerimis', 55: 'Gerimis lebat', 61: 'Hujan ringan', 63: 'Hujan sedang', 65: 'Hujan lebat', 80: 'Hujan lokal', 81: 'Hujan lokal sedang', 82: 'Hujan lokal lebat', 95: 'Badai petir', 96: 'Badai petir', 99: 'Badai petir' }
export const teksCuaca = c => KODE_CUACA[c] || 'Berawan'
