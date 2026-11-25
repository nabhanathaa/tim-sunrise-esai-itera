import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { scaleLog } from 'd3-scale'
import Peta, { Legenda } from '../components/Peta.jsx'
import Icon from '../components/Icon.jsx'
import { PilihKab, Label } from '../components/ui.jsx'
import { RAMP, seqScale, quantileScale } from '../lib/scales.js'
import { usePrakiraanSumatra, siaga } from '../lib/cuaca.js'
import { JENIS } from '../lib/store.js'
import { fmt, fmtInt, nm, pct } from '../lib/format.js'
import { go } from '../lib/router.js'

export const LAPIS = {
  dampak: { label: 'Korban 2025', ikon: 'users', ramp: RAMP.dampak, sumber: 'resmi', ket: 'Meninggal dan hilang, DIBI BNPB 2025' },
  prioritas: { label: 'Prioritas R3P', ikon: 'sliders', ramp: RAMP.prioritas, sumber: 'model', ket: 'Skor TOPSIS 8 kriteria, bobot esai' },
  hulu: { label: 'Tekanan hulu', ikon: 'tree', ramp: RAMP.hulu, sumber: 'model', ket: '% DAS hulu yang kehilangan hutan di lereng >15°, 2015–2025' },
  hujan: { label: 'Hujan 3 hari', ikon: 'rain', ramp: RAMP.hujan, sumber: 'langsung', ket: 'Prakiraan Open-Meteo, jumlah 3 hari ke depan' },
  erosi: { label: 'Erosi RUSLE', ikon: 'mountain', ramp: RAMP.erosi, sumber: 'model', ket: 'Median laju erosi permukaan (t/ha/th), 90 m' }
}

export function useWarnaLapis(data, lapis, cuaca) {
  return useMemo(() => {
    const { kab, byKode } = data
    if (lapis === 'dampak') {
      const s = scaleLog().domain([1, 260]).range([0, 1]).clamp(true), c = seqScale([0, 1], RAMP.dampak)
      return { f: kd => { const v = byKode[kd]?.korban25 || 0; return v > 0 ? c(0.12 + 0.88 * s(v)) : '#123029' }, nilai: k => `${fmtInt(k.korban25)} jiwa`, ticks: ['0', '10', '50', '250+'] }
    }
    if (lapis === 'prioritas') {
      const q = quantileScale(kab.map(k => k.prior), RAMP.prioritas)
      return { f: kd => q(byKode[kd].prior), nilai: k => `#${k.rank} · skor ${fmt(k.prior, 3)}`, ticks: ['rendah', '', 'kuintil', '', 'tinggi'] }
    }
    if (lapis === 'hulu') {
      const q = quantileScale(kab.map(k => k.hulu_frak), RAMP.hulu)
      return { f: kd => q(byKode[kd].hulu_frak), nilai: k => pct(k.hulu_frak, 2), ticks: ['<0,4%', '', '1,2%', '', '>2,5%'] }
    }
    if (lapis === 'erosi') {
      const q = quantileScale(kab.map(k => k.A_med), RAMP.erosi)
      return { f: kd => q(byKode[kd].A_med), nilai: k => `${fmt(k.A_med, 2)} t/ha/th`, ticks: ['rendah', '', 'kuintil', '', 'tinggi'] }
    }
    const c = seqScale([0, 150], RAMP.hujan)
    return {
      f: kd => { const v = cuaca?.[kd]; return v ? c(v.mm.reduce((a, b) => a + b, 0)) : '#15302A' },
      nilai: k => { const v = cuaca?.[k.kode]; return v ? `${fmt(v.mm.reduce((a, b) => a + b, 0), 0)} mm / 3 hari` : 'memuat…' },
      ticks: ['0', '50', '100', '150+ mm']
    }
  }, [data, lapis, cuaca])
}

export default function PetaLayar({ data, param, store, profil }) {
  const [lapis, setLapis] = useState('dampak')
  const [sel, setSel] = useState(param[0] || null)
  const [fokus, setFokus] = useState(param[0] || null)
  const [cari, setCari] = useState(false)
  const [pinOn, setPinOn] = useState(true)
  const cuaca = usePrakiraanSumatra(lapis === 'hujan' ? data.kab : null)
  const w = useWarnaLapis(data, lapis, cuaca.data)
  const k = sel ? data.byKode[sel] : null
  const L = LAPIS[lapis]

  const pins = pinOn ? store.laporan.map(l => ({ id: l.id, lon: l.lon, lat: l.lat, warna: JENIS[l.jenis]?.warna || '#fff', pulse: l.status === 'menunggu', onClick: () => go('laporan', l.id) })) : null
  const overlay = k ? ({ projection, c }) => {
    const to = c(k.kode); if (!to) return null
    return (k.hulu || []).slice(0, 6).map(([kd, v], i) => {
      const fr = c(kd); if (!fr) return null
      const mx = (fr[0] + to[0]) / 2 + (to[1] - fr[1]) * 0.18, my = (fr[1] + to[1]) / 2 - (to[0] - fr[0]) * 0.18
      return <path key={kd} className="alir" d={`M${fr[0]},${fr[1]} Q${mx},${my} ${to[0]},${to[1]}`} vectorEffect="non-scaling-stroke" style={{ strokeWidth: 1.6 + Math.min(3, v / 30), animationDelay: `${i * -0.2}s` }} />
    })
  } : null

  const sCuaca = k && cuaca.data?.[k.kode] ? siaga(Math.max(...cuaca.data[k.kode].mm), false) : null

  return (
    <div className="lp">
      <Peta tegak geo={data.geo} fill={w.f} selected={sel} focus={fokus} onSelect={kd => { setSel(kd === sel ? null : kd) }} pins={pins} overlay={overlay} />

      <div className="lp-atas">
        <div className="lp-baris">
          <button className="cari-gelap" onClick={() => setCari(true)}><Icon n="search" s={18} /><span>{k ? nm(k) : 'Cari kabupaten/kota'}</span></button>
          <button className="ib ib-gelap" onClick={() => setPinOn(x => !x)} aria-pressed={pinOn} aria-label="Tampilkan titik laporan" style={pinOn ? { color: 'var(--lime)' } : null}><Icon n="pin" /></button>
          {profil.wilayah && <button className="ib ib-gelap" onClick={() => { setSel(profil.wilayah); setFokus(profil.wilayah + '#' + Date.now()) }} aria-label="Ke wilayah saya"><Icon n="locate" /></button>}
        </div>
        <div className="lapis" role="tablist" aria-label="Lapisan peta">
          {Object.entries(LAPIS).map(([id, l]) => (
            <button key={id} className={lapis === id ? 'on' : ''} onClick={() => setLapis(id)} role="tab" aria-selected={lapis === id}><Icon n={l.ikon} s={15} />{l.label}</button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {k ? (
          <motion.div key={k.kode} className="lp-kartu" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 360, damping: 32 }}>
            <div className="kab-kepala">
              <div>
                <h2 style={{ fontSize: 19 }}>{nm(k)}</h2>
                <p>{k.prov} · {L.label}: <b style={{ color: 'var(--ink)' }}>{w.nilai(k)}</b></p>
              </div>
              <div className="peringkat"><small>PRIORITAS</small><b>#{k.rank}</b></div>
            </div>
            <div className="metrik4" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginTop: 12 }}>
              <div><small>Korban 2025</small><b>{fmtInt(k.korban25)}</b></div>
              <div><small>Hulu hilang</small><b>{pct(k.hulu_frak, 1)}</b></div>
              <div><small>{sCuaca ? 'Siaga 3 hr' : 'Freq. berat'}</small><b style={sCuaca ? { fontSize: 15 } : null}>{sCuaca ? sCuaca.label : pct(k.freq, 0)}</b></div>
            </div>
            {k.hulu?.length > 0 && <p className="catatan" style={{ marginTop: 8 }}>Garis bergerak: aliran dari {Math.min(6, k.hulu.length)} kab/kota hulu yang menyumbang kehilangan hutan curam.</p>}
            <div className="dua" style={{ marginTop: 12 }}>
              <button className="btn btn-em btn-k" onClick={() => go('kab', k.kode)}>Profil lengkap <Icon n="right" s={16} /></button>
              <button className="btn btn-garis btn-k" onClick={() => setSel(null)}>Tutup</button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="leg" className="lp-legenda" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Legenda judul={<><span>{L.label}</span><Label jenis={L.sumber} /></>} ramp={L.ramp} ticks={w.ticks}
              catatan={lapis === 'hujan' && cuaca.gagal ? 'Prakiraan tidak terjangkau (luring). Coba lagi saat ada sinyal.' : `${L.ket}. Ketuk wilayah untuk detail.`} />
          </motion.div>
        )}
      </AnimatePresence>

      <PilihKab kab={data.kab} value={sel} onPick={kd => { setSel(kd); setFokus(kd) }} buka={cari} tutup={() => setCari(false)} />
    </div>
  )
}
