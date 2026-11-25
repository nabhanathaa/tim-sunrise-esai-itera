import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { APP } from './config.js'
import { useData } from './lib/data.js'
import { useProfil, peranDari } from './lib/profil.js'
import { useRoute, go } from './lib/router.js'
import { useStore, seedContoh, untukSaya } from './lib/store.js'
import Icon from './components/Icon.jsx'
import Masuk from './pages/Masuk.jsx'
import Beranda from './pages/Beranda.jsx'
import PetaLayar from './pages/PetaLayar.jsx'
import KabHalaman from './pages/KabHalaman.jsx'
import Lapor from './pages/Lapor.jsx'
import Laporan from './pages/Laporan.jsx'
import Siaga from './pages/Siaga.jsx'
import Putar from './pages/Putar.jsx'
import Prioritas from './pages/Prioritas.jsx'
import Hulu from './pages/Hulu.jsx'
import Tanya from './pages/Tanya.jsx'
import Panduan from './pages/Panduan.jsx'
import Akun from './pages/Akun.jsx'
import Metode from './pages/Metode.jsx'
import Notif from './pages/Notif.jsx'

const LAYAR = {
  beranda: Beranda, peta: PetaLayar, kab: KabHalaman, lapor: Lapor, laporan: Laporan, siaga: Siaga, putar: Putar,
  prioritas: Prioritas, hulu: Hulu, tanya: Tanya, panduan: Panduan, akun: Akun, metode: Metode, notif: Notif
}
const GELAP = new Set(['peta', 'putar'])
const TANPA_NAV = new Set(['lapor', 'tanya'])
const NAV = [['beranda', 'home', 'Beranda'], ['peta', 'map', 'Peta'], null, ['siaga', 'rain', 'Siaga'], ['akun', 'user', 'Akun']]

function useJam() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), 15000); return () => clearInterval(i) }, [])
  return t.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')
}

export default function App() {
  const data = useData()
  const [profil] = useProfil()
  const route = useRoute()
  const store = useStore()
  const jam = useJam()
  const [lepas, setLepas] = useState(() => new URLSearchParams(location.search).has('penuh'))
  const [toast, setToast] = useState(null)
  const [ringkas, setRingkas] = useState(false)
  const lihat = useRef(null)

  useEffect(() => { if (data.ready) seedContoh(data.byKode) }, [data.ready, data.byKode])

  // Notifikasi baru untuk peran/akun ini muncul sebagai toast
  useEffect(() => {
    const baru = store.notif.filter(n => !n.dibaca && untukSaya(n, profil))
    const atas = baru[0]
    if (lihat.current === null) { lihat.current = atas?.id || ''; return }
    if (atas && atas.id !== lihat.current) { lihat.current = atas.id; setToast(atas) }
  }, [store.notif, profil])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4200); return () => clearTimeout(t) }, [toast])

  const [hal, ...param] = route
  const masukLayar = !profil
  const Layar = LAYAR[hal] || Beranda
  const gelap = masukLayar || GELAP.has(hal)
  const navAda = !masukLayar && !TANPA_NAV.has(hal)
  const nBelum = store.notif.filter(n => !n.dibaca && untukSaya(n, profil)).length
  const aktif = ['beranda', 'peta', 'siaga', 'akun'].includes(hal) ? hal : (hal === 'kab' ? 'peta' : null)

  return (
    <div className={lepas ? 'lepas' : ''}>
      <div className="stage">
        <svg className="stage-kontur" viewBox="0 0 1200 500" preserveAspectRatio="none" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M-50 ${120 + i * 26} C 200 ${40 + i * 30}, 420 ${260 + i * 18}, 700 ${150 + i * 24} S 1100 ${60 + i * 28}, 1300 ${200 + i * 20}`} />)}
        </svg>

        <aside className="sisi sisi-kiri">
          <div className="merek">
            <span className="merek-logo"><Logo /></span>
            <div><b>{APP.nama}</b><small>{APP.kepanjangan}</small></div>
          </div>
          <h2>Baca hulu,<br /><em>lindungi hilir.</em></h2>
          <p>{APP.deskripsi}</p>
          <SisiKartu ikon="map" judul="Peta hulu–hilir 154 kab/kota" isi="Kehilangan hutan di lereng curam dijumlahkan dari 693 sub-DAS ke wilayah hilirnya, lalu dibandingkan dengan dampak 2015–2025." />
          <SisiKartu ikon="shieldCheck" judul="Lapor dengan bukti, bukan rumor" isi="Titik GPS asli, foto atau video, dan enam lapis cek otomatis sebelum petugas BPBD memverifikasi." />
        </aside>

        <div className="ponsel">
          <div className="layar">
            <div className="pulau-dinamis" />
            <div className={`status ${gelap ? 'terang' : ''}`}>
              <span>{jam}</span>
              <span className="status-i">
                <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" opacity=".35" /></svg>
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M1.5 4.5a9.5 9.5 0 0 1 13 0M4 7.3a6 6 0 0 1 8 0M6.6 10a2.2 2.2 0 0 1 2.8 0" /></svg>
                <svg width="26" height="12" viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".45" /><rect x="2.5" y="2.5" width="15" height="7" rx="2" fill="currentColor" /><rect x="23.5" y="4" width="1.8" height="4" rx=".9" fill="currentColor" opacity=".45" /></svg>
              </span>
            </div>

            <div className="app" onScrollCapture={e => { if (e.target.classList?.contains('halaman')) setRingkas(e.target.scrollTop > 80) }}>
              {!data.ready ? (
                <div className="memuat" style={{ background: 'var(--em-950)', color: '#A9C7BB' }}>
                  <span className="merek-logo" style={{ width: 64, height: 64, borderRadius: 20 }}><Logo s={34} /></span>
                  <b style={{ color: '#fff', marginTop: 14, fontSize: 20, letterSpacing: '.03em' }}>{APP.nama}</b>
                  {data.error ? <span style={{ marginTop: 8 }}>Data gagal dimuat: {data.error}</span> : <div className="memuat-garis" />}
                </div>
              ) : masukLayar ? (
                <Masuk data={data} />
              ) : (
                <>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div key={hal + (hal === 'kab' || hal === 'laporan' ? param[0] || '' : '')} onAnimationStart={() => setRingkas(false)} style={{ position: 'absolute', inset: 0 }}
                      initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
                      <Layar data={data} profil={profil} peran={peranDari(profil)} param={param} store={store} />
                    </motion.div>
                  </AnimatePresence>

                  {hal === 'beranda' && (
                    <motion.button layout className={`fab-chat ${ringkas ? 'ringkas' : ''}`} onClick={() => go('tanya')} aria-label={`Tanya ${APP.nama}`} initial={{ opacity: 0, y: 16, scale: .9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}>
                      <motion.span layout className="i"><Icon n="chat" s={19} /></motion.span>
                      <AnimatePresence initial={false}>{!ringkas && <motion.span className="fc-t" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}>Tanya {APP.nama}<small>Asisten data & panduan</small></motion.span>}</AnimatePresence>
                    </motion.button>
                  )}

                  {navAda && (
                    <nav className="nav" aria-label="Navigasi utama">
                      {NAV.map((n, i) => n ? (
                        <button key={n[0]} className={`nav-b ${aktif === n[0] ? 'on' : ''}`} onClick={() => go(n[0])} aria-current={aktif === n[0] ? 'page' : undefined}>
                          <Icon n={n[1]} s={22} />{n[2]}
                          {n[0] === 'akun' && nBelum > 0 && <i className="badge">{nBelum}</i>}
                        </button>
                      ) : (
                        <button key={i} className="nav-fab" onClick={() => go('lapor')} aria-label="Lapor kejadian">
                          <span className="nav-fab-i"><Icon n="camera" s={26} w={2} /></span>Lapor
                        </button>
                      ))}
                    </nav>
                  )}

                  <AnimatePresence>
                    {toast && (
                      <motion.button className="toast" onClick={() => { setToast(null); go(toast.ke === 'verifikasi' ? 'laporan' : toast.lapId ? `laporan/${toast.lapId}` : 'notif') }}
                        initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
                        <span className="i"><Icon n="bell" s={18} /></span>
                        <span><b>{toast.judul}</b><small>{toast.isi}</small></span>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>
        </div>

        <aside className="sisi sisi-kanan">
          <SisiKartu ikon="users" judul="Empat peran, satu aplikasi" isi="Warga, petugas BPBD, perencana R3P, dan pengelola DAS punya beranda dan menu masing-masing. Ganti peran lewat tab Akun." />
          <SisiKartu ikon="rain" judul="Siaga hujan langsung" isi="Prakiraan 3 hari Open-Meteo untuk 154 kab/kota diambil saat aplikasi dibuka, dipadukan dengan tekanan hulu wilayah." />
          <SisiKartu ikon="scale" judul="Angka apa adanya" isi="Setiap angka berlabel: data resmi, hasil model, data langsung, atau contoh. Data contoh bisa dihapus di Akun." />
          <p className="sisi-kaki">Prototipe untuk {APP.acara}. Tampilan ini mengikuti ukuran HP; buka di HP untuk layar penuh. Bisa dipasang ke layar utama dan dipakai luring.</p>
          <button className="btn-layar" onClick={() => setLepas(true)}><Icon n="expand" s={16} /> Buka layar penuh</button>
        </aside>
      </div>
      <button className="tutup-lepas" onClick={() => setLepas(false)} aria-label="Kembali ke tampilan bingkai HP"><Icon n="x" s={18} /></button>
    </div>
  )
}

function SisiKartu({ ikon, judul, isi }) {
  return (
    <div className="kartu-sisi">
      <span className="ks-i"><Icon n={ikon} s={19} /></span>
      <div><b>{judul}</b><span>{isi}</span></div>
    </div>
  )
}

export function Logo({ s = 24 }) {
  // monogram: kontur bukit (hulu) + aliran sungai (hilir)
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21 12 9l5 7 3-4 8 9" stroke="#C6F24E" strokeWidth="2.4" />
      <path d="M4 26c3 0 3-2 6-2s3 2 6 2 3-2 6-2 3 2 6 2" stroke="#7CC8E8" strokeWidth="2.2" />
    </svg>
  )
}
