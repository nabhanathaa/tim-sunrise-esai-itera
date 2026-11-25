import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Peta from '../components/Peta.jsx'
import Icon from '../components/Icon.jsx'
import { Chips, Kepala, Label, Sheet, Masuk as Muncul } from '../components/ui.jsx'
import { KRITERIA, PRESET, topsis, spearman } from '../lib/topsis.js'
import { RAMP_TERANG, quantileScale } from '../lib/scales.js'
import { fmt, fmtInt, nm } from '../lib/format.js'
import { go } from '../lib/router.js'

export default function Prioritas({ data, profil }) {
  const { kab, byKode } = data
  const [w, setW] = useState(PRESET.dasar.w)
  const [preset, setPreset] = useState('dasar')
  const [atur, setAtur] = useState(false)
  const [prov, setProv] = useState('Semua')
  const [n, setN] = useState(15)

  const base = useMemo(() => Object.fromEntries(topsis(kab, PRESET.dasar.w).map(r => [r.kode, r.rank])), [kab])
  const res = useMemo(() => topsis(kab, w), [kab, w])
  const by = useMemo(() => Object.fromEntries(res.map(r => [r.kode, r])), [res])
  const urut = useMemo(() => [...res].sort((a, b) => a.rank - b.rank), [res])
  const skala = useMemo(() => quantileScale(res.map(r => r.skor), RAMP_TERANG.prioritas), [res])
  const val = useMemo(() => {
    const s = kab.map(k => by[k.kode].skor)
    const top20b = new Set(Object.entries(base).filter(([, r]) => r <= 20).map(([k]) => k))
    return {
      rhoKorban: spearman(s, kab.map(k => k.korban25)),
      rhoInfra: spearman(s, kab.map(k => k.infra25)),
      ov: urut.slice(0, 20).filter(r => top20b.has(r.kode)).length
    }
  }, [kab, by, base, urut])
  const provs = ['Semua', ...Array.from(new Set(kab.map(k => k.prov)))]
  const daftar = urut.filter(r => prov === 'Semua' || byKode[r.kode].prov === prov)
  const sw = w.reduce((a, b) => a + b, 0) || 1
  const saya = profil.wilayah ? by[profil.wilayah] : null

  const ekspor = () => {
    const rows = [['peringkat', 'kode_bps', 'kab_kota', 'provinsi', 'skor_topsis', 'peringkat_esai', ...KRITERIA.map(c => c.key)], ...urut.map(r => { const k = byKode[r.kode]; return [r.rank, r.kode, nm(k), k.prov, r.skor.toFixed(4), base[r.kode], ...KRITERIA.map(c => k[c.key]) ] })]
    const url = URL.createObjectURL(new Blob(['﻿' + rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = 'prioritas_r3p.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  return (
    <div className="halaman">
      <Kepala judul="Prioritas R3P" sub="Urutan rehabilitasi-rekonstruksi 154 kab/kota" kanan={<button className="ib" onClick={ekspor} aria-label="Unduh CSV"><Icon n="download" /></button>} />
      <div className="tumpuk">
        <Muncul>
          <div className="pahlawan">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="eyebrow">TOPSIS · 8 kriteria</span><Label jenis="model" /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {Object.entries(PRESET).map(([id, p]) => (
                <button key={id} className="btn btn-k" onClick={() => { setPreset(id); setW(p.w) }}
                  style={preset === id ? { background: 'var(--lime)', color: 'var(--lime-ink)' } : { background: 'rgba(255,255,255,.08)', color: '#DCEFE6' }}>{p.label}</button>
              ))}
            </div>
            <div className="statgrid">
              <div className="stat"><small>ρ korban</small><b>{fmt(val.rhoKorban, 2)}</b></div>
              <div className="stat"><small>ρ infra</small><b>{fmt(val.rhoInfra, 2)}</b></div>
              <div className="stat"><small>Top-20 sama</small><b>{val.ov}/20</b></div>
            </div>
            <button className="btn btn-lime btn-penuh" style={{ marginTop: 14 }} onClick={() => setAtur(true)}><Icon n="sliders" s={18} /> Atur bobot kriteria</button>
            <p style={{ fontSize: 11, marginTop: 10, color: '#9DC4B5' }}>ρ: korelasi peringkat skor dengan dampak nyata 2025. "Sama top-20": irisan dengan urutan versi esai.</p>
          </div>
        </Muncul>

        {saya && (
          <Muncul i={1}>
            <button className="baris aksen-em grup" onClick={() => go('kab', profil.wilayah)}>
              <span className="baris-i"><Icon n="pin" s={20} className="t-em" /></span>
              <span className="baris-t"><b>{nm(byKode[profil.wilayah])}: peringkat {saya.rank}</b><small>Versi esai #{base[profil.wilayah]} · stabil di {fmt(byKode[profil.wilayah].rp5)}–{fmt(byKode[profil.wilayah].rp95)} dari 1.000 simulasi bobot</small></span>
              <Icon n="right" s={18} className="baris-c" />
            </button>
          </Muncul>
        )}

        <Muncul i={2}>
          <div className="peta-terang" style={{ height: 300, position: 'relative' }}>
            <Peta geo={data.geo} dark={false} fill={kd => skala(by[kd].skor)} onSelect={kd => go('kab', kd)} dim={kd => prov !== 'Semua' && byKode[kd].prov !== prov} />
            <div className="terang" style={{ position: 'absolute', left: 12, top: 10, width: 150, background: 'rgba(255,255,255,.92)', padding: '8px 10px', borderRadius: 12 }}>
              <div className="legenda-j"><span>Skor prioritas</span></div>
              <div className="legenda-bar" style={{ background: `linear-gradient(90deg, ${RAMP_TERANG.prioritas.join(',')})` }} />
              <div className="legenda-t"><span>rendah</span><span>tinggi</span></div>
            </div>
          </div>
        </Muncul>

        <Chips value={prov} onChange={setProv} items={provs.map(p => [p, p === 'Semua' ? 'Semua provinsi' : p])} />

        <div className="grup">
          <AnimatePresence initial={false}>
            {daftar.slice(0, n).map(r => {
              const k = byKode[r.kode], dl = base[r.kode] - r.rank
              return (
                <motion.button layout key={r.kode} className={`rank ${r.rank <= 3 ? 'top' : ''}`} onClick={() => go('kab', r.kode)} transition={{ type: 'spring', stiffness: 400, damping: 36 }}>
                  <span className="r-n">{r.rank}</span>
                  <div><b>{nm(k)}</b><small>{k.prov} · korban 2025 {fmtInt(k.korban25)}</small></div>
                  <div className="r-s"><b>{fmt(r.skor, 3)}</b><small className={dl > 0 ? 'naik' : dl < 0 ? 'turun' : ''}>{dl > 0 ? `▲ ${dl}` : dl < 0 ? `▼ ${-dl}` : '='}</small></div>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
        {daftar.length > n && <button className="btn btn-garis btn-penuh btn-k" onClick={() => setN(n + 20)}>Tampilkan lebih banyak ({daftar.length - n} lagi)</button>}
        <p className="catatan">Segitiga: perubahan peringkat dibanding bobot versi esai [3,1,2,1,1,1,1,1]. Rumus TOPSIS di menu Metode; hasil identik dengan notebook.</p>
      </div>

      <Sheet buka={atur} tutup={() => setAtur(false)} judul="Bobot kriteria" tinggi="88%">
        <div>
          {KRITERIA.map((c, i) => (
            <div key={c.key} className="slider-b">
              <div className="sl-a"><span>{c.label}</span><em>{w[i]} · {fmt((w[i] / sw) * 100, 0)}%</em></div>
              <input type="range" min="0" max="5" step="1" value={w[i]} style={{ '--p': `${(w[i] / 5) * 100}%` }} aria-label={c.label}
                onChange={e => { setPreset(null); const v = +e.target.value; setW(p => p.map((x, j) => j === i ? v : x)) }} />
              <small className="catatan">{c.ket}{c.arah === 'cost' ? ' (makin rendah, makin prioritas)' : ''}</small>
            </div>
          ))}
          <div className="dua" style={{ marginTop: 14 }}>
            <button className="btn btn-garis" onClick={() => { setPreset('dasar'); setW(PRESET.dasar.w) }}>Kembalikan</button>
            <button className="btn btn-em" onClick={() => setAtur(false)}>Terapkan</button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
