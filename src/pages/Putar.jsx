import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { scaleLog } from 'd3-scale'
import Peta, { Legenda } from '../components/Peta.jsx'
import Icon from '../components/Icon.jsx'
import { Kepala, Label, Seg, Sheet } from '../components/ui.jsx'
import { RAMP, seqScale } from '../lib/scales.js'
import { parseCSV } from '../lib/csv.js'
import { fmtInt, compact, nm } from '../lib/format.js'
import { go } from '../lib/router.js'

const MULAI = Date.UTC(2025, 10, 20), N = 17
const HARI = Array.from({ length: N }, (_, i) => new Date(MULAI + i * 864e5).toISOString().slice(0, 10))
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'November', 'Desember']
const tgl = h => { const [, m, d] = h.split('-').map(Number); return `${d} ${BLN[m - 1]} 2025` }
const CATATAN = {
  '2025-11-22': 'Awal jendela akumulasi hujan IMERG',
  '2025-11-25': 'Siklon Tropis Senyar terbentuk di Selat Malaka',
  '2025-11-26': 'Senyar mendarat di pesisir utara Sumatera menjelang tengah malam',
  '2025-12-05': 'Akhir jendela akumulasi hujan IMERG'
}
const WARNA_J = { Banjir: '#5DB7F0', Longsor: '#F09A3A' }

export default function Putar({ data }) {
  const { byKode } = data
  const ev = data.senyar
  const [hujan, setHujan] = useState(null)
  const [d, setD] = useState(0)
  const [main, setMain] = useState(false)
  const [lapis, setLapis] = useState('dampak')
  const [kec, setKec] = useState(1)
  const [info, setInfo] = useState(false)
  const [sel, setSel] = useState(null)
  const t = useRef(null)

  useEffect(() => {
    fetch('./data/imerg_harian.csv').then(r => r.ok ? r.text() : null).then(txt => {
      if (!txt || !txt.includes('h_2025')) return
      const out = {}
      parseCSV(txt).forEach(r => { out[String(r.kode_bps).replace(/\.0$/, '')] = HARI.map(h => +r[`h_${h.replaceAll('-', '')}`] || 0) })
      setHujan(out); setLapis('hujan')
    }).catch(() => {})
  }, [])

  useEffect(() => {
    clearInterval(t.current)
    if (!main) return
    t.current = setInterval(() => setD(x => { if (x >= N - 1) { setMain(false); return x } return x + 1 }), 1150 / kec)
    return () => clearInterval(t.current)
  }, [main, kec])

  const agg = useMemo(() => {
    const per = HARI.map(() => ({ korban: 0, ungsi: 0, rb: 0, sk: 0, fk: 0, jb: 0, n: 0 }))
    ev.forEach(e => { const i = HARI.indexOf(e.h); if (i < 0) return; const p = per[i]; p.korban += e.m + e.hl; p.ungsi += e.u; p.rb += e.rb; p.sk += e.sk; p.fk += e.fk; p.jb += e.jb; p.n += 1 })
    return per
  }, [ev])

  const kum = agg.slice(0, d + 1).reduce((a, p) => { Object.keys(a).forEach(k => { a[k] += p[k] }); return a }, { korban: 0, ungsi: 0, rb: 0, sk: 0, fk: 0, jb: 0, n: 0 })
  const sampai = ev.filter(e => { const i = HARI.indexOf(e.h); return i >= 0 && i <= d })
  const hariIni = ev.filter(e => e.h === HARI[d]).sort((a, b) => (b.m + b.hl) - (a.m + a.hl))
  const korbanKab = {}; sampai.forEach(e => { korbanKab[e.k] = (korbanKab[e.k] || 0) + e.m + e.hl })
  const lg = scaleLog().domain([1, 260]).range([0, 1]).clamp(true), cD = seqScale([0, 1], RAMP.dampak), cH = seqScale([0, 900], RAMP.hujan)
  const kumH = kd => hujan?.[kd] ? hujan[kd].slice(0, d + 1).reduce((a, b) => a + b, 0) : null
  const maxK = Math.max(...agg.map(p => p.korban), 1)
  const fill = kd => {
    if (lapis === 'hujan') { const v = kumH(kd); return v == null ? '#15302A' : cH(v) }
    const v = korbanKab[kd]; if (v == null) return '#11291F'; return v === 0 ? '#1F4A3D' : cD(0.15 + 0.85 * lg(v))
  }
  const sk = sel ? byKode[sel] : null

  const overlay = ({ c, k }) => (
    <g>
      {hariIni.map((e, i) => {
        const p = c(e.k); if (!p) return null
        const r = (4 + 1.8 * Math.sqrt(e.m + e.hl + 1)) / Math.sqrt(k)
        return (
          <g key={`${d}-${i}`} transform={`translate(${p[0]},${p[1]})`}>
            <circle r={r * 2.4} className="pin-pulse" style={{ fill: WARNA_J[e.j] || '#E5484D' }} />
            <motion.circle r={r} fill={WARNA_J[e.j] || '#E5484D'} stroke="#fff" strokeWidth={1.2 / k} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14, delay: i * 0.04 }} />
          </g>
        )
      })}
    </g>
  )

  return (
    <div className="lp">
      <Peta tegak geo={data.geo} fill={fill} overlay={overlay} selected={sel} onSelect={kd => setSel(kd === sel ? null : kd)} />
      <div className="lp-atas">
        <div className="lp-baris">
          <Kepala gelap judul="Putar ulang Senyar" sub="20 Nov–6 Des 2025 · kejadian dan dampaknya"
            kanan={<button className="ib ib-gelap" onClick={() => setInfo(true)} aria-label="Tentang data"><Icon n="info" /></button>} />
        </div>
        <div className="seg-gelap">
          <Seg id="pl" kecil value={lapis} onChange={setLapis} items={[['dampak', 'Korban kumulatif'], ['hujan', hujan ? 'Hujan IMERG harian' : 'Hujan (perlu CSV)']]} />
        </div>
      </div>

      <div className="ticker" style={{ top: 'calc(var(--top) + 128px)' }}>
        <AnimatePresence>
          {(sk ? [] : hariIni.slice(0, 2)).map((e, i) => (
            <motion.div key={`${d}-${e.k}-${i}`} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.12 }}>
              <i style={{ background: WARNA_J[e.j] }} />{e.j} · <b>{nm(byKode[e.k])}</b>{e.m + e.hl > 0 ? ` · ${fmtInt(e.m + e.hl)} korban` : ''}
            </motion.div>
          ))}
          {sk && (
            <motion.div key="sel" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ pointerEvents: 'auto', cursor: 'pointer' }} onClick={() => go('kab', sk.kode)}>
              <b>{nm(sk)}</b> · s.d. hari ini {fmtInt(korbanKab[sk.kode] || 0)} korban{kumH(sk.kode) != null ? ` · ${fmtInt(kumH(sk.kode))} mm` : ''} <Icon n="right" s={14} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="putar-panel">
        <div className="putar-k">
          <button className="putar-btn" onClick={() => { if (d >= N - 1) setD(0); setMain(m => !m) }} aria-label={main ? 'Jeda' : 'Putar'}><Icon n={main ? 'pause' : 'play'} s={22} w={2.4} /></button>
          <div className="putar-tgl">
            <AnimatePresence mode="wait">
              <motion.div key={d} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .22 }}>
                <b>{tgl(HARI[d])}</b>
                <small>{CATATAN[HARI[d]] || (hariIni.length ? `${hariIni.length} catatan kejadian banjir/longsor` : 'Tidak ada catatan kejadian baru')}</small>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="kec">{[0.5, 1, 2].map(v => <button key={v} className={kec === v ? 'on' : ''} onClick={() => setKec(v)}>{String(v).replace('.', ',')}×</button>)}</div>
        </div>
        <div className="trek">
          {agg.map((p, i) => (
            <button key={i} className={`${i === d ? 'kini' : i < d ? 'lalu' : ''} ${HARI[i] === '2025-11-26' ? 'badai' : ''}`} onClick={() => { setMain(false); setD(i) }} aria-label={`${tgl(HARI[i])}: ${p.korban} korban tercatat`}>
              <i style={{ height: `${8 + 92 * Math.sqrt(p.korban / maxK)}%` }} />
            </button>
          ))}
        </div>
        <div className="trek-l"><span>20 Nov</span><span>26 Nov · Senyar mendarat</span><span>6 Des</span></div>
        <div className="putar-stat">
          <div><small>KORBAN</small><b>{fmtInt(kum.korban)}</b></div>
          <div><small>MENGUNGSI</small><b>{compact(kum.ungsi)}</b></div>
          <div><small>RUMAH RB</small><b>{compact(kum.rb)}</b></div>
          <div><small>JEMBATAN</small><b>{fmtInt(kum.jb)}</b></div>
        </div>
        <div style={{ marginTop: 10 }}>
          <Legenda judul={<><span>{lapis === 'hujan' && hujan ? 'Hujan kumulatif IMERG (mm)' : 'Korban kumulatif per kab/kota'}</span><Label jenis="resmi">{lapis === 'hujan' && hujan ? 'SATELIT' : 'DIBI'}</Label></>}
            ramp={lapis === 'hujan' && hujan ? RAMP.hujan : RAMP.dampak} ticks={lapis === 'hujan' && hujan ? ['0', '300', '600', '900+'] : ['1', '10', '50', '250+']} />
        </div>
      </div>

      <Sheet buka={info} tutup={() => setInfo(false)} judul="Tentang putar ulang">
        <div className="tumpuk">
          <p className="teks">Setiap titik adalah satu catatan kejadian banjir atau longsor di <b>DIBI BNPB</b> pada tanggal pencatatannya. Peta mewarnai korban meninggal dan hilang yang sudah tercatat sampai hari terpilih.</p>
          <div className="info info-amber"><Icon n="info" s={18} /><span>Tanggal DIBI adalah tanggal catatan, dan satu catatan bisa merangkum dampak beberapa hari. Angka per hari <b>bukan</b> korban harian yang sebenarnya.</span></div>
          <p className="teks">Total periode ini: <b>{ev.length}</b> catatan, <b>{fmtInt(ev.reduce((a, e) => a + e.m + e.hl, 0))}</b> meninggal dan hilang, <b>{fmtInt(ev.reduce((a, e) => a + e.sk, 0))}</b> sekolah dan <b>{fmtInt(ev.reduce((a, e) => a + e.fk, 0))}</b> fasilitas kesehatan rusak.</p>
          {!hujan && <p className="teks">Lapisan hujan harian aktif otomatis setelah file <code>public/data/imerg_harian.csv</code> dari skrip GEE bagian 4 (<code>tools/</code>) ditambahkan.</p>}
        </div>
      </Sheet>
    </div>
  )
}
