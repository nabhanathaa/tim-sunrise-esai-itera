import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Peta from '../components/Peta.jsx'
import Icon from '../components/Icon.jsx'
import { Kepala, PilihKab, Seg } from '../components/ui.jsx'
import { cariKab, terdekat, jarakKm } from '../lib/geo.js'
import { tambahLaporan, kirimNotif, simpanMedia, uid, JENIS, KEBUTUHAN, CEK, BOBOT_CEK, skorDari } from '../lib/store.js'
import { fmt, nm, ukuran, jam } from '../lib/format.js'
import { go } from '../lib/router.js'

const LANGKAH = ['Lokasi', 'Bukti', 'Detail', 'Kirim']
const MAKS_VIDEO = 60e6

async function kompres(file) {
  const img = await createImageBitmap(file).catch(() => null)
  if (!img) return file
  const s = Math.min(1, 1600 / Math.max(img.width, img.height))
  const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  return new Promise(ok => c.toBlob(b => ok(b || file), 'image/jpeg', 0.82))
}
const durasiVideo = url => new Promise(ok => { const v = document.createElement('video'); v.preload = 'metadata'; v.onloadedmetadata = () => ok(v.duration); v.onerror = () => ok(null); v.src = url })

export function Cincin({ skor, ukuranPx = 92 }) {
  const r = 40, c = 2 * Math.PI * r
  const warna = skor >= 75 ? 'var(--em-500)' : skor >= 50 ? 'var(--amber)' : 'var(--red)'
  return (
    <div className="cincin" style={{ width: ukuranPx, height: ukuranPx }}>
      <svg width={ukuranPx} height={ukuranPx} viewBox="0 0 92 92">
        <circle cx="46" cy="46" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
        <motion.circle cx="46" cy="46" r={r} fill="none" stroke={warna} strokeWidth="8" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - skor / 100) }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
      </svg>
      <b>{skor}<small>SKOR</small></b>
    </div>
  )
}

export function DaftarCek({ cek, detail = {} }) {
  return (
    <div>
      {Object.entries(CEK).map(([k, [judul, ket]]) => (
        <div key={k} className={`cek-b ${cek[k] ? 'ya' : 'tidak'}`}>
          <span className="cek-i"><Icon n={cek[k] ? 'check' : 'x'} s={14} w={2.6} /></span>
          <div><b>{judul}</b><small>{detail[k] || ket}</small></div>
          <em>+{cek[k] ? BOBOT_CEK[k] : 0}</em>
        </div>
      ))}
    </div>
  )
}

function KameraLangsung({ onFoto }) {
  const vid = useRef(null), aliran = useRef(null)
  const [buka, setBuka] = useState(false)
  const [galat, setGalat] = useState('')
  const [siap, setSiap] = useState(false)
  const tutup = () => { aliran.current?.getTracks().forEach(t => t.stop()); aliran.current = null; setSiap(false); setBuka(false) }
  useEffect(() => () => aliran.current?.getTracks().forEach(t => t.stop()), [])
  const mulai = async () => {
    setGalat(''); setBuka(true)
    if (!navigator.mediaDevices?.getUserMedia) { setGalat('Browser ini tidak mendukung kamera langsung. Gunakan tombol "Ambil foto" di bawah.'); return }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      aliran.current = s
      if (vid.current) { vid.current.srcObject = s; await vid.current.play().catch(() => {}) }
      setSiap(true)
    } catch {
      setGalat('Kamera tidak bisa diakses. Izinkan kamera di pengaturan browser, atau gunakan tombol "Ambil foto" di bawah.')
    }
  }
  const jepret = () => {
    const v = vid.current; if (!v || !v.videoWidth) return
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height)
    c.toBlob(b => { if (!b) return; onFoto(new File([b], `kamera-${Date.now()}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })); tutup() }, 'image/jpeg', 0.9)
  }
  return (
    <>
      <button type="button" className="btn btn-em btn-penuh btn-k" onClick={mulai}><Icon n="camera" s={16} /> Kamera langsung</button>
      {buka && (
        <div className="kamera-kotak" style={{ marginTop: 10, borderRadius: 16, overflow: 'hidden', background: '#000', position: 'relative' }}>
          <video ref={vid} playsInline muted style={{ width: '100%', display: 'block', aspectRatio: '4 / 3', objectFit: 'cover' }} />
          <div className="dua" style={{ padding: 10 }}>
            <button type="button" className="btn btn-garis btn-k" onClick={tutup}>Batal</button>
            <button type="button" className="btn btn-em btn-k" onClick={jepret} disabled={!siap}>{siap ? 'Jepret' : 'Menyiapkan…'}</button>
          </div>
        </div>
      )}
      {galat && <p className="catatan" style={{ color: 'var(--red)' }}>{galat}</p>}
    </>
  )
}

export default function Lapor({ data, profil, store }) {
  const [l, setL] = useState(0)
  const [gps, setGps] = useState(null)          // {lat, lon, akurasi, waktu}
  const [cariGps, setCariGps] = useState(false)
  const [galat, setGalat] = useState('')
  const [kab, setKab] = useState(null)
  const [manual, setManual] = useState(false)
  const [pilih, setPilih] = useState(false)
  const [media, setMedia] = useState([])         // {id, tipe, blob, url, ukuran, durasi, segar, nama}
  const [proses, setProses] = useState(false)
  const [d, setD] = useState({ jenis: 'banjir', tingkat: 2, korban: 0, terdampak: 0, kebutuhan: [], catatan: '' })
  const [kirim, setKirim] = useState(null)
  const watch = useRef(null)

  useEffect(() => () => { if (watch.current != null) navigator.geolocation?.clearWatch(watch.current); media.forEach(m => URL.revokeObjectURL(m.url)) }, []) // eslint-disable-line

  const ambilGps = () => {
    if (!navigator.geolocation) { setGalat('Perangkat ini tidak mendukung GPS. Pilih wilayah secara manual.'); return }
    setGalat(''); setCariGps(true)
    let terbaik = null
    const selesai = () => { if (watch.current != null) navigator.geolocation.clearWatch(watch.current); watch.current = null; setCariGps(false) }
    watch.current = navigator.geolocation.watchPosition(p => {
      const g = { lat: p.coords.latitude, lon: p.coords.longitude, akurasi: p.coords.accuracy, waktu: new Date(p.timestamp).toISOString() }
      if (!terbaik || g.akurasi < terbaik.akurasi) {
        terbaik = g; setGps(g)
        const kd = cariKab(data.geo, g.lon, g.lat)
        setKab(kd || null); setManual(false)
        if (!kd) { const t = terdekat(data.kab, g.lon, g.lat); setGalat(`Titik berada di luar 154 kab/kota Sumatera (terdekat: ${nm(t.kab)}, ${fmt(t.km, 0)} km). Pilih wilayah manual bila perlu.`) }
      }
      if (g.akurasi <= 25) selesai()
    }, e => {
      selesai()
      setGalat(e.code === 1 ? 'Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini, atau pilih wilayah manual.' : 'Sinyal GPS belum didapat. Coba di tempat terbuka, atau pilih wilayah manual.')
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 })
    setTimeout(selesai, 15000)
  }

  const tambahFile = async (files, tipe) => {
    setProses(true)
    const baru = []
    for (const f of Array.from(files || [])) {
      if (tipe === 'video' && f.size > MAKS_VIDEO) { setGalat(`Video ${f.name} lebih dari 60 MB. Rekam lebih pendek (±30 detik cukup).`); continue }
      const blob = tipe === 'foto' ? await kompres(f) : f
      const url = URL.createObjectURL(blob)
      baru.push({ id: uid(), tipe, blob, url, ukuran: blob.size, nama: f.name, durasi: tipe === 'video' ? await durasiVideo(url) : null, segar: Date.now() - f.lastModified < 24 * 36e5, diambil: new Date(f.lastModified).toISOString() })
    }
    setMedia(m => [...m, ...baru].slice(0, 6)); setProses(false)
  }

  const sekitar = useMemo(() => gps ? store.laporan.filter(x => Date.now() - new Date(x.waktu) < 24 * 36e5 && jarakKm([x.lon, x.lat], [gps.lon, gps.lat]) <= 10).length : 0, [gps, store.laporan])
  const titik = gps || (kab ? { lat: data.byKode[kab].lat, lon: data.byKode[kab].lon, akurasi: null } : null)
  const cek = {
    akun: !!profil.terverifikasi,
    gps: !!gps && gps.akurasi <= 100,
    wilayah: !!gps && !!kab && !manual && cariKab(data.geo, gps.lon, gps.lat) === kab,
    segar: !!gps && Date.now() - new Date(gps.waktu) < 30 * 60e3,
    media: media.some(m => m.segar),
    sekitar: sekitar > 0
  }
  const skor = skorDari(cek)
  const detailCek = {
    akun: profil.terverifikasi ? `${profil.hp} terverifikasi` : 'Belum verifikasi OTP (bisa di menu Akun)',
    gps: gps ? `Akurasi ±${fmt(gps.akurasi, 0)} m` : 'Lokasi dipilih manual',
    wilayah: gps && kab ? (cek.wilayah ? `Di dalam batas ${nm(data.byKode[kab])}` : 'Titik di luar wilayah yang dipilih') : 'Tanpa titik GPS',
    segar: gps ? `Diambil ${jam(gps.waktu)}` : 'Tanpa titik GPS',
    media: media.length ? `${media.filter(m => m.segar).length} dari ${media.length} berkas diambil ≤ 24 jam` : 'Belum ada foto/video',
    sekitar: sekitar ? `${sekitar} laporan lain dalam radius 10 km` : 'Belum ada laporan lain di sekitar'
  }

  const bisaLanjut = [!!kab, true, !!d.jenis, true][l]

  const kirimLaporan = async () => {
    const id = uid()
    const m = []
    for (const x of media) { try { await simpanMedia(x.id, x.blob); m.push({ id: x.id, tipe: x.tipe, ukuran: x.ukuran, durasi: x.durasi, segar: x.segar, diambil: x.diambil }) } catch { /* penyimpanan penuh */ } }
    const lap = {
      id, waktu: new Date().toISOString(), kab, lon: titik.lon, lat: titik.lat, akurasi: gps?.akurasi ?? null, manual: !gps,
      jenis: d.jenis, tingkat: d.tingkat, korban: +d.korban || 0, terdampak: +d.terdampak || 0, kebutuhan: d.kebutuhan, catatan: d.catatan.trim(),
      media: m, cek, skor, status: 'menunggu',
      pelapor: { nama: profil.nama, hp: profil.hp, terverifikasi: !!profil.terverifikasi, peran: profil.peran },
      riwayat: [{ waktu: new Date().toISOString(), oleh: profil.nama, aksi: 'Laporan dikirim', catatan: `Skor kepercayaan otomatis ${skor}` }]
    }
    tambahLaporan(lap)
    kirimNotif({ peran: 'bpbd', judul: `Laporan baru: ${JENIS[d.jenis].label} di ${nm(data.byKode[kab])}`, isi: `Skor kepercayaan ${skor}. Ketuk untuk memverifikasi.`, lapId: id })
    if (profil.hp) kirimNotif({ hp: profil.hp, judul: 'Laporan Anda diterima', isi: `Nomor ${id}. Petugas BPBD akan meninjau.`, lapId: id })
    setKirim(lap)
  }

  if (kirim) return (
    <div className="halaman tanpa-nav" style={{ display: 'grid', alignContent: 'center' }}>
      <motion.div className="tumpuk" style={{ textAlign: 'center', justifyItems: 'center' }} initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: .1 }}
          style={{ width: 92, height: 92, borderRadius: 30, display: 'grid', placeItems: 'center', background: 'var(--em-700)', color: 'var(--lime)', boxShadow: '0 0 0 10px var(--em-50)' }}>
          <Icon n="check" s={46} w={2.6} />
        </motion.div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>Laporan terkirim</h1>
        <p className="teks" style={{ maxWidth: 290 }}>Nomor <b className="mono">{kirim.id}</b>. Petugas BPBD {nm(data.byKode[kirim.kab])} menerima notifikasi dan akan memverifikasi. Status bisa dipantau di menu Laporan.</p>
        <Cincin skor={kirim.skor} />
        <p className="catatan">Skor kepercayaan otomatis dari 6 cek di perangkat</p>
        <div className="dua" style={{ width: '100%' }}>
          <button className="btn btn-em" onClick={() => go('laporan', kirim.id)}>Lihat laporan</button>
          <button className="btn btn-garis" onClick={() => go('beranda')}>Beranda</button>
        </div>
      </motion.div>
    </div>
  )

  return (
    <div className="halaman tanpa-nav">
      <Kepala judul="Lapor kejadian" sub="Banjir, banjir bandang, longsor, atau tanda awalnya" />
      <div className="langkah" aria-label={`Langkah ${l + 1} dari 4`}>
        <span className="langkah-bar" style={{ width: `calc(${(l / 3) * 100}% - ${(l / 3) * 60}px)` }} />
        {LANGKAH.map((x, i) => <div key={x} className={`langkah-i ${i === l ? 'on' : i < l ? 'done' : ''}`}><span>{i < l ? <Icon n="check" s={14} w={2.6} /> : i + 1}</span>{x}</div>)}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={l} className="tumpuk" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: .25 }} style={{ marginTop: 10 }}>
          {l === 0 && (
            <>
              <div className="gps-kartu">
                <div style={{ position: 'relative' }}>
                  <Peta geo={data.geo} intro={false} tools={false} selected={kab} focus={kab ? kab + (gps ? '#g' : '') : null}
                    fill={kd => kd === kab ? '#1B8A6B' : '#16352D'} pins={titik ? [{ id: 'saya', lon: titik.lon, lat: titik.lat, warna: '#C6F24E', pulse: true, r: 7 }] : null} />
                  {cariGps && <div className="radar"><i /><i /><i /><span className="radar-t">Mencari sinyal satelit…</span></div>}
                </div>
                <div className="gps-info">
                  <div><small>Lintang</small><b>{gps ? fmt(gps.lat, 5) : '–'}</b></div>
                  <div><small>Bujur</small><b>{gps ? fmt(gps.lon, 5) : '–'}</b></div>
                  <div><small>Akurasi</small><b style={gps ? { color: gps.akurasi <= 100 ? 'var(--em-600)' : 'var(--amber)' } : null}>{gps ? `±${fmt(gps.akurasi, 0)} m` : '–'}</b></div>
                </div>
              </div>
              <button className="btn btn-em btn-penuh" onClick={ambilGps} disabled={cariGps}><Icon n="locate" s={19} /> {gps ? 'Perbarui titik GPS' : 'Ambil titik GPS sekarang'}</button>
              {galat && <div className="info info-amber"><Icon n="alert" s={18} /><span>{galat}</span></div>}
              <div className="field"><span>Kabupaten/kota kejadian</span>
                <button className="pilih-btn" onClick={() => setPilih(true)}>
                  <span>{kab ? nm(data.byKode[kab]) : 'Belum ditentukan'}<small>{kab ? (manual ? 'dipilih manual' : 'terdeteksi otomatis dari GPS (uji titik dalam poligon)') : 'ambil GPS atau pilih manual'}</small></span>
                  <Icon n="down" s={18} />
                </button>
              </div>
              <p className="catatan">Koordinat diambil langsung dari GPS perangkat, tidak diketik. Lokasi hanya dipakai untuk laporan ini.</p>
            </>
          )}

          {l === 1 && (
            <>
              <KameraLangsung onFoto={f => tambahFile([f], 'foto')} />
              <div className="unggah">
                <label><Icon n="camera" s={26} />Ambil foto<small>dikompres ±1600 px</small><input type="file" accept="image/*" capture="environment" multiple onChange={e => { tambahFile(e.target.files, 'foto'); e.target.value = '' }} /></label>
                <label><Icon n="video" s={26} />Rekam video<small>maks 60 MB, ±30 detik</small><input type="file" accept="video/*" capture="environment" onChange={e => { tambahFile(e.target.files, 'video'); e.target.value = '' }} /></label>
              </div>
              <label className="btn btn-garis btn-penuh btn-k" style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}><Icon n="image" s={16} /> Pilih dari galeri<input type="file" accept="image/*,video/*" multiple className="ov" onChange={e => { const fs = Array.from(e.target.files); tambahFile(fs.filter(f => f.type.startsWith('image')), 'foto').then(() => tambahFile(fs.filter(f => f.type.startsWith('video')), 'video')); e.target.value = '' }} /></label>
              {proses && <p className="catatan">Memproses berkas…</p>}
              {media.length > 0 && (
                <div className="media-grid">
                  {media.map(m => (
                    <div key={m.id} className="media-t">
                      {m.tipe === 'foto' ? <img src={m.url} alt="Bukti foto" /> : <video src={m.url} muted playsInline preload="metadata" />}
                      <button className="media-x" onClick={() => setMedia(x => x.filter(y => y.id !== m.id))} aria-label="Hapus"><Icon n="x" s={14} /></button>
                      <span className="media-tag"><Icon n={m.tipe === 'foto' ? 'image' : 'video'} s={11} />{m.tipe === 'video' && m.durasi ? `${Math.round(m.durasi)} dtk` : ukuran(m.ukuran)}{!m.segar && ' · lama'}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="info info-em"><Icon n="info" s={18} /><span>Foto atau video yang <b>diambil dalam 24 jam terakhir</b> menambah skor kepercayaan. Rekam dari jarak aman; jangan mendekati arus atau tebing.</span></div>
              <p className="catatan">Berkas disimpan di perangkat (IndexedDB) dan ikut terkirim saat ada sinyal pada versi produksi.</p>
            </>
          )}

          {l === 2 && (
            <>
              <div className="field"><span>Jenis kejadian</span>
                <div className="opsi-grid">
                  {Object.entries(JENIS).map(([k, j]) => <button key={k} className={`opsi ${d.jenis === k ? 'on' : ''}`} onClick={() => setD({ ...d, jenis: k })}><i style={{ background: j.warna }} />{j.label}</button>)}
                </div>
              </div>
              <div className="field"><span>Tingkat keparahan</span><Seg id="tk" value={d.tingkat} onChange={v => setD({ ...d, tingkat: v })} items={[[1, 'Ringan'], [2, 'Sedang'], [3, 'Berat']]} /></div>
              <div className="dua">
                <label className="field"><span>Korban jiwa/luka</span><input type="number" min="0" inputMode="numeric" value={d.korban} onChange={e => setD({ ...d, korban: e.target.value })} /></label>
                <label className="field"><span>Warga terdampak (perkiraan)</span><input type="number" min="0" inputMode="numeric" value={d.terdampak} onChange={e => setD({ ...d, terdampak: e.target.value })} /></label>
              </div>
              <div className="field"><span>Kebutuhan mendesak</span>
                <div className="togel">
                  {Object.entries(KEBUTUHAN).map(([k, v]) => <button key={k} className={d.kebutuhan.includes(k) ? 'on' : ''} onClick={() => setD({ ...d, kebutuhan: d.kebutuhan.includes(k) ? d.kebutuhan.filter(x => x !== k) : [...d.kebutuhan, k] })}>{d.kebutuhan.includes(k) && <Icon n="check" s={14} w={2.4} />}{v}</button>)}
                </div>
              </div>
              <label className="field"><span>Keterangan singkat</span><textarea value={d.catatan} onChange={e => setD({ ...d, catatan: e.target.value })} placeholder="Contoh: air naik cepat bercampur lumpur, jembatan desa tertutup kayu." maxLength={500} /></label>
            </>
          )}

          {l === 3 && (
            <>
              <div className="kartu skor-kartu">
                <Cincin skor={skor} />
                <div>
                  <b style={{ fontSize: 16 }}>Skor kepercayaan</b>
                  <p className="kecil muted" style={{ marginTop: 3 }}>{skor >= 75 ? 'Tinggi: kemungkinan besar diverifikasi cepat.' : skor >= 50 ? 'Sedang: petugas akan memeriksa bukti lebih teliti.' : 'Rendah: tetap diterima, tetapi perlu konfirmasi petugas.'}</p>
                </div>
              </div>
              <div className="kartu">
                <div className="kartu-j"><h3>Verifikasi otomatis di perangkat</h3></div>
                <DaftarCek cek={cek} detail={detailCek} />
              </div>
              <div className="kartu">
                <div className="kartu-j"><h3>Ringkasan</h3></div>
                <table className="tabel"><tbody>
                  <tr><td>Pelapor</td><td className="r" style={{ fontFamily: 'var(--sans)' }}>{profil.nama}</td></tr>
                  <tr><td>Kejadian</td><td className="r" style={{ fontFamily: 'var(--sans)' }}>{JENIS[d.jenis].label} · {['', 'ringan', 'sedang', 'berat'][d.tingkat]}</td></tr>
                  <tr><td>Wilayah</td><td className="r" style={{ fontFamily: 'var(--sans)' }}>{nm(data.byKode[kab])}</td></tr>
                  <tr><td>Bukti</td><td className="r">{media.filter(m => m.tipe === 'foto').length} foto · {media.filter(m => m.tipe === 'video').length} video</td></tr>
                </tbody></table>
              </div>
              {!profil.terverifikasi && <div className="info info-amber"><Icon n="shield" s={18} /><span>Nomor HP belum terverifikasi. <button className="tautan" onClick={() => go('akun')}>Verifikasi di Akun</button> untuk menambah 20 poin.</span></div>}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="dua" style={{ marginTop: 18 }}>
        <button className="btn btn-garis" onClick={() => (l ? setL(l - 1) : go('beranda'))}>{l ? 'Kembali' : 'Batal'}</button>
        {l < 3
          ? <button className="btn btn-em" disabled={!bisaLanjut} onClick={() => setL(l + 1)}>Lanjut <Icon n="right" s={16} /></button>
          : <button className="btn btn-lime" onClick={kirimLaporan}><Icon n="send" s={17} /> Kirim laporan</button>}
      </div>
      <PilihKab kab={data.kab} value={kab} onPick={kd => { setKab(kd); setManual(true) }} buka={pilih} tutup={() => setPilih(false)} judul="Wilayah kejadian" />
    </div>
  )
}
