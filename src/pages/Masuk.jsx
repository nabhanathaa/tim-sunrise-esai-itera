import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { geoMercator, geoPath } from 'd3-geo'
import { APP } from '../config.js'
import { PERAN, useProfil } from '../lib/profil.js'
import { nm } from '../lib/format.js'
import Icon from '../components/Icon.jsx'
import { PilihKab } from '../components/ui.jsx'
import { Logo } from '../App.jsx'

const TEMUAN = [
  ['1.342', 'korban meninggal dan hilang tercatat DIBI pada 20 Nov–6 Des 2025'],
  ['0,53', 'korelasi peringkat hutan lereng curam yang hilang di hulu dengan frekuensi kejadian berat'],
  ['154', 'kabupaten/kota Sumatera dipetakan dari hulu sampai hilir'],
  ['0,71', 'ROC-AUC model peluang dampak berat saat diuji pada tahun 2025']
]
const KODE_OTP = '2025'

export default function Masuk({ data }) {
  const [, simpan] = useProfil()
  const [langkah, setLangkah] = useState(0)
  const [peran, setPeran] = useState('warga')
  const [f, setF] = useState({ nama: '', instansi: '', wilayah: null, hp: '' })
  const [pilih, setPilih] = useState(false)
  const [otp, setOtp] = useState(['', '', '', ''])
  const [salah, setSalah] = useState(false)
  const [ti, setTi] = useState(0)
  const otpRef = useRef([])
  const p = PERAN.find(r => r.id === peran)

  useEffect(() => { const i = setInterval(() => setTi(x => (x + 1) % TEMUAN.length), 3400); return () => clearInterval(i) }, [])

  const peta = useMemo(() => {
    const pr = geoMercator().fitExtent([[6, 6], [324, 344]], data.geo)
    const path = geoPath(pr)
    const top = [...data.kab].sort((a, b) => b.korban25 - a.korban25).slice(0, 7)
    return { d: data.geo.features.map(ft => path(ft)), pins: top.map(k => pr([k.lon, k.lat])) }
  }, [data])

  const demo = () => { const d = p.demo; setF({ nama: d.nama, instansi: p.id === 'warga' ? '' : p.jabatan, wilayah: d.wilayah, hp: d.hp }) }
  const hpValid = f.hp.replace(/\D/g, '').length >= 10
  const siap = f.nama.trim().length >= 2 && f.wilayah

  const selesai = verif => simpan({ nama: f.nama.trim(), instansi: f.instansi.trim(), peran, wilayah: f.wilayah, hp: f.hp.trim(), terverifikasi: verif, masuk: new Date().toISOString() })
  const tamu = () => simpan({ nama: 'Tamu', peran: 'warga', wilayah: null, hp: '', terverifikasi: false, tamu: true, masuk: new Date().toISOString() })

  const isiOtp = (i, v) => {
    const c = v.replace(/\D/g, '').slice(-1)
    const n = [...otp]; n[i] = c; setOtp(n); setSalah(false)
    if (c && i < 3) otpRef.current[i + 1]?.focus()
    if (n.join('').length === 4) {
      if (n.join('') === KODE_OTP) setTimeout(() => selesai(true), 350)
      else setSalah(true)
    }
  }

  return (
    <div className="masuk">
      <div className="masuk-hero">
        <svg className="masuk-peta" viewBox="0 0 330 350" aria-hidden="true">
          {peta.d.map((d, i) => <path key={i} d={d} style={{ animationDelay: `${(i % 40) * 0.02}s` }} />)}
          {peta.pins.map((xy, i) => xy && (
            <g key={i} transform={`translate(${xy[0]},${xy[1]})`}>
              <circle r="10" className="pin-pulse" style={{ animationDelay: `${i * 0.25}s` }} /><circle r="2.6" />
            </g>
          ))}
        </svg>
        <div className="merek">
          <span className="merek-logo"><Logo /></span>
          <div><b>{APP.nama}</b><small style={{ color: '#9DC4B5' }}>{APP.kepanjangan}</small></div>
        </div>
        <h1>Baca hulu,<br /><em>lindungi hilir.</em></h1>
        <p>Siaga hujan, lapor kejadian bergeotag, dan prioritas pemulihan pascabanjir dan longsor di Sumatera.</p>
        <div className="temuan-putar">
          <AnimatePresence mode="wait">
            <motion.div key={ti} style={{ display: 'flex', gap: 10, alignItems: 'center' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .35 }}>
              <b>{TEMUAN[ti][0]}</b><span>{TEMUAN[ti][1]}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="masuk-panel">
        <AnimatePresence mode="wait">
          {langkah === 0 && (
            <motion.div key="l0" className="tumpuk" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div>
                <div className="eyebrow">Langkah 1 dari 3</div>
                <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-.02em', marginTop: 4 }}>Masuk sebagai siapa?</h2>
                <p className="muted kecil" style={{ marginTop: 3 }}>Beranda dan menu menyesuaikan tugas Anda.</p>
              </div>
              {PERAN.map(r => (
                <button key={r.id} className={`peran-k ${peran === r.id ? 'on' : ''}`} onClick={() => setPeran(r.id)}>
                  <span className="pk-i"><Icon n={r.ikon} s={22} /></span>
                  <span>
                    <b>{r.nama}</b><small>{r.jabatan}</small>
                    {peran === r.id && <motion.span className="akses" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>{r.akses.map(a => <span key={a}>{a}</span>)}</motion.span>}
                  </span>
                  <span className="radio"><Icon n="check" s={13} w={3} /></span>
                </button>
              ))}
              <button className="btn btn-em btn-penuh" onClick={() => setLangkah(1)}>Lanjut sebagai {p.nama.toLowerCase()} <Icon n="right" s={18} /></button>
              <div className="pemisah">atau</div>
              <button className="btn btn-garis btn-penuh" onClick={tamu}>Jelajahi sebagai tamu</button>
            </motion.div>
          )}

          {langkah === 1 && (
            <motion.div key="l1" className="tumpuk" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button className="ib" onClick={() => setLangkah(0)} aria-label="Kembali"><Icon n="left" /></button>
                <div><div className="eyebrow">Langkah 2 dari 3</div><h2 style={{ fontSize: 19, fontWeight: 800 }}>Data {p.nama.toLowerCase()}</h2></div>
              </div>
              <button className="info info-em" onClick={demo} style={{ textAlign: 'left' }}>
                <Icon n="user" s={18} /><span><b>Isi dengan akun demo</b><br />{p.demo.nama} · {nm(data.byKode[p.demo.wilayah])}</span>
              </button>
              <label className="field"><span>Nama lengkap</span><input value={f.nama} onChange={e => setF({ ...f, nama: e.target.value })} placeholder="Nama sesuai KTP" autoComplete="name" /></label>
              {peran !== 'warga' && <label className="field"><span>Instansi / unit kerja</span><input value={f.instansi} onChange={e => setF({ ...f, instansi: e.target.value })} placeholder={peran === 'bpbd' ? 'BPBD Kabupaten …' : peran === 'r3p' ? 'Bappeda …' : 'BPDAS / KPH …'} /></label>}
              <div className="field"><span>Wilayah tugas / tempat tinggal</span>
                <button className="pilih-btn" onClick={() => setPilih(true)}>
                  <span>{f.wilayah ? nm(data.byKode[f.wilayah]) : 'Pilih kabupaten/kota'}<small>{f.wilayah ? data.byKode[f.wilayah].prov : '154 kab/kota di 10 provinsi'}</small></span>
                  <Icon n="down" s={18} />
                </button>
              </div>
              <label className="field"><span>Nomor HP (untuk verifikasi pelapor)</span><input value={f.hp} onChange={e => setF({ ...f, hp: e.target.value })} placeholder="08xx xxxx xxxx" inputMode="tel" autoComplete="tel" /></label>
              <button className="btn btn-em btn-penuh" disabled={!siap || !hpValid} onClick={() => { setOtp(['', '', '', '']); setLangkah(2); setTimeout(() => otpRef.current[0]?.focus(), 350) }}>Kirim kode verifikasi</button>
              <button className="btn btn-garis btn-penuh" disabled={!siap} onClick={() => selesai(false)}>Masuk tanpa verifikasi</button>
              <p className="catatan">Laporan dari akun tanpa verifikasi tetap diterima, tetapi skor kepercayaannya lebih rendah dan selalu ditinjau petugas.</p>
              <PilihKab kab={data.kab} value={f.wilayah} onPick={w => setF({ ...f, wilayah: w })} buka={pilih} tutup={() => setPilih(false)} />
            </motion.div>
          )}

          {langkah === 2 && (
            <motion.div key="l2" className="tumpuk" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button className="ib" onClick={() => setLangkah(1)} aria-label="Kembali"><Icon n="left" /></button>
                <div><div className="eyebrow">Langkah 3 dari 3</div><h2 style={{ fontSize: 19, fontWeight: 800 }}>Verifikasi nomor HP</h2></div>
              </div>
              <p className="teks">Masukkan 4 digit kode yang dikirim ke <b>{f.hp}</b>.</p>
              <div className="otp">
                {otp.map((v, i) => (
                  <input key={i} ref={el => { otpRef.current[i] = el }} value={v} inputMode="numeric" maxLength={1} aria-label={`Digit ${i + 1}`}
                    onChange={e => isiOtp(i, e.target.value)} onKeyDown={e => { if (e.key === 'Backspace' && !v && i > 0) otpRef.current[i - 1]?.focus() }}
                    style={salah ? { borderColor: 'var(--red)' } : null} />
                ))}
              </div>
              {salah && <p className="kecil" style={{ color: 'var(--red)', textAlign: 'center' }}>Kode belum cocok. Coba lagi.</p>}
              <div className="info info-amber"><Icon n="info" s={18} /><span><b>Prototipe:</b> SMS belum tersambung ke penyedia. Untuk uji coba, kode verifikasi adalah <b className="mono">{KODE_OTP}</b>.</span></div>
              <button className="btn btn-garis btn-penuh" onClick={() => selesai(false)}>Lewati, masuk tanpa verifikasi</button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="catatan" style={{ textAlign: 'center', marginTop: 4 }}>Profil disimpan di perangkat ini saja. Versi produksi memakai akun instansi dan server SMS.</p>
      </div>
    </div>
  )
}
