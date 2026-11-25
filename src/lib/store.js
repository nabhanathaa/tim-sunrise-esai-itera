import { useEffect, useState } from 'react'

// Penyimpanan prototipe di perangkat: laporan dan notifikasi di localStorage,
// berkas foto/video di IndexedDB. Perubahan disiarkan ke tab lain (BroadcastChannel)
// sehingga alur pelapor -> petugas terlihat langsung bila dibuka di dua tab.
const KL = 'tapak-laporan-v2', KN = 'tapak-notif-v2', KS = 'tapak-seed-v2'
const kanal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('tapak') : null
let pendengar = []
const kabari = () => { pendengar.forEach(f => f()); kanal?.postMessage('ubah') }
kanal && (kanal.onmessage = () => pendengar.forEach(f => f()))
if (typeof window !== 'undefined') addEventListener('storage', e => { if (e.key?.startsWith('tapak-')) pendengar.forEach(f => f()) })

const baca = k => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }
const tulis = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* penuh / privat */ } }

export function useStore() {
  const [s, setS] = useState(() => ({ laporan: baca(KL), notif: baca(KN) }))
  useEffect(() => {
    const f = () => setS({ laporan: baca(KL), notif: baca(KN) })
    pendengar.push(f)
    return () => { pendengar = pendengar.filter(x => x !== f) }
  }, [])
  return s
}

export const uid = () => Date.now().toString(36).toUpperCase().slice(-5) + Math.random().toString(36).slice(2, 5).toUpperCase()

export function tambahLaporan(l) { tulis(KL, [l, ...baca(KL)]); kabari() }
export function ubahLaporan(id, fn) { tulis(KL, baca(KL).map(l => l.id === id ? fn(l) : l)); kabari() }
export function hapusSemua() {
  baca(KL).forEach(l => (l.media || []).forEach(m => hapusMedia(m.id)))
  tulis(KL, []); tulis(KN, []); try { localStorage.setItem(KS, '1') } catch { /* abaikan */ } kabari()
}
export function kirimNotif(n) { tulis(KN, [{ id: uid(), waktu: new Date().toISOString(), dibaca: false, ...n }, ...baca(KN)].slice(0, 80)); kabari() }
export function bacaNotif(untuk) { tulis(KN, baca(KN).map(n => untukSaya(n, untuk) ? { ...n, dibaca: true } : n)); kabari() }
export const untukSaya = (n, p) => n.peran === p?.peran || (n.hp && n.hp === p?.hp)

// ---------- IndexedDB untuk foto dan video ----------
let dbp = null
const db = () => dbp || (dbp = new Promise((ok, gagal) => {
  const r = indexedDB.open('tapak-media', 1)
  r.onupgradeneeded = () => r.result.createObjectStore('m')
  r.onsuccess = () => ok(r.result); r.onerror = () => gagal(r.error)
}))
export async function simpanMedia(id, blob) { const d = await db(); return new Promise((ok, g) => { const t = d.transaction('m', 'readwrite'); t.objectStore('m').put(blob, id); t.oncomplete = ok; t.onerror = () => g(t.error) }) }
export async function ambilMedia(id) { const d = await db(); return new Promise(ok => { const q = d.transaction('m').objectStore('m').get(id); q.onsuccess = () => ok(q.result || null); q.onerror = () => ok(null) }) }
export async function hapusMedia(id) { try { const d = await db(); d.transaction('m', 'readwrite').objectStore('m').delete(id) } catch { /* abaikan */ } }

export function useMediaURL(id) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let u = null, hidup = true
    if (id) ambilMedia(id).then(b => { if (b && hidup) { u = URL.createObjectURL(b); setUrl(u) } })
    return () => { hidup = false; if (u) URL.revokeObjectURL(u) }
  }, [id])
  return url
}

// ---------- Data contoh (ditandai jelas, bisa dihapus di Akun) ----------
export function seedContoh(byKode) {
  try { if (localStorage.getItem(KS)) return } catch { return }
  const jam = h => new Date(Date.now() - h * 36e5).toISOString()
  const mk = (kode, dx, dy, o) => ({
    id: uid(), contoh: true, kab: kode, lon: byKode[kode].lon + dx, lat: byKode[kode].lat + dy, akurasi: o.akurasi ?? 12,
    waktu: jam(o.h), media: [], kebutuhan: o.kebutuhan || [], korban: o.korban || 0, terdampak: o.terdampak || 0,
    jenis: o.jenis, tingkat: o.tingkat, catatan: o.catatan, pelapor: o.pelapor,
    cek: o.cek, skor: o.skor, status: o.status, riwayat: [{ waktu: jam(o.h), oleh: o.pelapor.nama, aksi: 'Laporan dikirim' }, ...(o.riwayat || [])]
  })
  const L = [
    mk('1307', 0.03, -0.02, { h: 0.6, jenis: 'banjir_bandang', tingkat: 3, korban: 0, terdampak: 40, kebutuhan: ['evakuasi', 'logistik'], catatan: 'Air bercampur lumpur dan kayu naik cepat di tepi sungai, jembatan kecil tertutup material.',
      pelapor: { nama: 'Warga Agam (contoh)', hp: '0812 0000 0001', terverifikasi: true, peran: 'warga' }, skor: 88, status: 'menunggu',
      cek: { gps: true, wilayah: true, segar: true, akun: true, media: true, sekitar: false } }),
    mk('1204', -0.05, 0.04, { h: 2.5, jenis: 'longsor', tingkat: 2, terdampak: 6, kebutuhan: ['alat_berat'], catatan: 'Tebing jalan kabupaten runtuh, satu lajur tertutup. Belum ada korban.',
      pelapor: { nama: 'Relawan Tapteng (contoh)', hp: '0812 0000 0002', terverifikasi: true, peran: 'warga' }, skor: 74, status: 'menunggu', akurasi: 38,
      cek: { gps: true, wilayah: true, segar: true, akun: true, media: false, sekitar: false } }),
    mk('1111', 0.02, 0.05, { h: 5, jenis: 'banjir', tingkat: 1, terdampak: 120, kebutuhan: ['air_bersih'], catatan: 'Genangan 30–50 cm di permukiman, warga masih bertahan di rumah.',
      pelapor: { nama: 'Pelapor tanpa akun (contoh)', hp: '', terverifikasi: false, peran: 'warga' }, skor: 46, status: 'menunggu', akurasi: 140,
      cek: { gps: false, wilayah: true, segar: true, akun: false, media: false, sekitar: true } }),
    mk('1371', -0.01, 0.01, { h: 26, jenis: 'banjir', tingkat: 2, terdampak: 300, kebutuhan: ['logistik', 'kesehatan'], catatan: 'Banjir di dua kelurahan, posko darurat dibuka di kantor lurah.',
      pelapor: { nama: 'Warga Padang (contoh)', hp: '0812 0000 0003', terverifikasi: true, peran: 'warga' }, skor: 91, status: 'diverifikasi',
      cek: { gps: true, wilayah: true, segar: true, akun: true, media: true, sekitar: true },
      riwayat: [{ waktu: jam(24), oleh: 'Petugas BPBD (contoh)', aksi: 'Diverifikasi', catatan: 'Sesuai pantauan tim lapangan, diteruskan ke posko logistik.' }] })
  ]
  tulis(KL, [...L, ...baca(KL)])
  tulis(KN, [{ id: uid(), waktu: jam(0.6), dibaca: false, peran: 'bpbd', judul: '3 laporan baru menunggu verifikasi', isi: 'Banjir bandang di Agam, skor kepercayaan 88.', ke: 'verifikasi' }, ...baca(KN)])
  try { localStorage.setItem(KS, '1') } catch { /* abaikan */ }
  kabari()
}

export const JENIS = {
  banjir: { label: 'Banjir', warna: '#1E9BD7' },
  banjir_bandang: { label: 'Banjir bandang', warna: '#E5484D' },
  longsor: { label: 'Tanah longsor', warna: '#D9822B' },
  genangan: { label: 'Genangan', warna: '#5DB7F0' },
  retakan: { label: 'Retakan tanah', warna: '#B8862F' }
}
export const KEBUTUHAN = {
  evakuasi: 'Evakuasi', logistik: 'Logistik pangan', air_bersih: 'Air bersih', kesehatan: 'Layanan kesehatan',
  alat_berat: 'Alat berat', hunian: 'Hunian sementara', listrik: 'Listrik/komunikasi'
}
export const TINGKAT = ['', 'Ringan', 'Sedang', 'Berat']
export const STATUS = {
  menunggu: { label: 'Menunggu verifikasi', kelas: 'amber' },
  diverifikasi: { label: 'Terverifikasi', kelas: 'green' },
  ditolak: { label: 'Tidak terverifikasi', kelas: 'red' },
  info: { label: 'Perlu info tambahan', kelas: 'blue' }
}
export const CEK = {
  akun: ['Identitas pelapor', 'Nomor HP terverifikasi kode OTP'],
  gps: ['Akurasi GPS', 'Titik GPS ≤ 100 m'],
  wilayah: ['Lokasi cocok', 'Titik GPS berada di kab/kota yang dilaporkan'],
  segar: ['Waktu segar', 'Lokasi diambil < 30 menit sebelum kirim'],
  media: ['Bukti visual', 'Foto/video baru (diambil ≤ 24 jam)'],
  sekitar: ['Laporan pendukung', 'Ada laporan lain ≤ 10 km dalam 24 jam']
}
export const BOBOT_CEK = { akun: 20, gps: 15, wilayah: 20, segar: 10, media: 25, sekitar: 10 }
export const skorDari = cek => Object.entries(BOBOT_CEK).reduce((a, [k, w]) => a + (cek[k] ? w : 0), 0)
