import { useMemo, useState } from 'react'
import Peta from '../components/Peta.jsx'
import Icon from '../components/Icon.jsx'
import { Batang, Kepala, Label, Masuk as Muncul, PilihKab } from '../components/ui.jsx'
import { KontribusiHulu } from './KabHalaman.jsx'
import { RAMP_TERANG, seqScale } from '../lib/scales.js'
import { fmt, fmtInt, nm, pct } from '../lib/format.js'
import { go } from '../lib/router.js'

const KUARTIL = [['Q1', 0.077], ['Q2', 0.139], ['Q3', 0.234], ['Q4', 0.315]]

export default function Hulu({ data, param, profil }) {
  const kode = param[0] && data.byKode[param[0]] ? param[0] : (profil.wilayah || '1111')
  const k = data.byKode[kode]
  const [pilih, setPilih] = useState(false)
  const kontrib = useMemo(() => Object.fromEntries((k.hulu || []).map(([kd, v]) => [kd, v])), [k])
  const mx = Math.max(...Object.values(kontrib), k.lokal || 0, 0.01)
  const warna = seqScale([0, 1], RAMP_TERANG.hulu)
  const top = [...(k.hulu || [])].sort((a, b) => b[1] - a[1])
  const luar = top.reduce((a, h) => a + h[1], 0)
  const urutHulu = useMemo(() => [...data.kab].sort((a, b) => b.hulu_frak - a.hulu_frak), [data.kab])
  const posisi = urutHulu.findIndex(x => x.kode === kode) + 1

  const overlay = ({ c }) => {
    const to = c(kode); if (!to) return null
    return top.slice(0, 8).map(([kd, v], i) => {
      const fr = c(kd); if (!fr) return null
      const mx2 = (fr[0] + to[0]) / 2 + (to[1] - fr[1]) * 0.2, my = (fr[1] + to[1]) / 2 - (to[0] - fr[0]) * 0.2
      return <path key={kd} className="alir" d={`M${fr[0]},${fr[1]} Q${mx2},${my} ${to[0]},${to[1]}`} vectorEffect="non-scaling-stroke" style={{ strokeWidth: 1.6 + Math.min(3, v / 30), animationDelay: `${i * -0.25}s` }} />
    })
  }

  return (
    <div className="halaman">
      <Kepala judul="Rantai hulu–hilir" sub={`${nm(k)} · ${k.prov}`} kanan={<button className="ib" onClick={() => setPilih(true)} aria-label="Ganti wilayah"><Icon n="search" /></button>} />
      <div className="tumpuk">
        <Muncul>
          <div className="peta-terang" style={{ height: 290, position: 'relative' }}>
            <Peta geo={data.geo} dark={false} intro={false} selected={kode} focus={kode} overlay={overlay}
              fill={kd => kd === kode ? '#0E4D3C' : kontrib[kd] != null ? warna(0.2 + 0.8 * Math.sqrt(kontrib[kd] / mx)) : '#D5E1DB'}
              onSelect={kd => kontrib[kd] != null ? go('kab', kd) : null} />
          </div>
        </Muncul>

        <Muncul i={1}>
          <div className="kartu">
            <div className="kartu-j"><h3>Dari bukit ke permukiman</h3><Label jenis="model" /></div>
            <div className="rantai-s">
              <span className="rs-i bg-soil" style={{ background: 'var(--soil-50)', color: 'var(--soil)' }}><Icon n="tree" /></span>
              <div><b>Hutan lereng curam hilang di hulu</b><small>{fmt(luar + (k.lokal || 0), 0)} km² hutan di lereng &gt;15° hilang 2015–2025 di sub-DAS hulu; {top.length} kab/kota lain ikut menyumbang. Wilayah ini urutan {posisi} dari 154.</small></div>
            </div>
            <div className="rantai-s">
              <span className="rs-i" style={{ background: 'var(--amber-50)', color: 'var(--amber)' }}><Icon n="mountain" /></span>
              <div><b>Lereng dan tanah</b><small>Lereng rata-rata {fmt(k.slope, 1)}°, faktor LS {fmt(k.LS, 2)}, hutan lereng curam tahun 2000 {pct(k.hutan_curam2000, 0)}. Erosi permukaan median {fmt(k.A_med, 2)} t/ha/th.</small></div>
            </div>
            <div className="rantai-s">
              <span className="rs-i" style={{ background: 'var(--river-50)', color: 'var(--river)' }}><Icon n="wave" /></span>
              <div><b>Aliran sungai</b><small>{k.n_subdas_hulu} sub-DAS HydroBASINS level 8 dalam jaringan hulu, ditelusuri lewat atribut NEXT_DOWN sampai ke {k.n_subdas} sub-DAS di wilayah ini.</small></div>
            </div>
            <div className="rantai-s">
              <span className="rs-i" style={{ background: 'var(--red-50)', color: 'var(--red)' }}><Icon n="users" /></span>
              <div><b>Dampak di hilir</b><small>{fmtInt(k.korban25)} korban jiwa dan {fmtInt(k.rrb25)} rumah rusak berat pada 2025; berdampak berat {pct(k.freq, 0)} tahun dalam 2015–2025.</small></div>
            </div>
            <div className="rantai-s">
              <span className="rs-i" style={{ background: 'var(--em-50)', color: 'var(--em-600)' }}><Icon n="flag" /></span>
              <div><b>Arah tindakan</b><small>{top[0] ? `Rehabilitasi lereng curam diprioritaskan di ${nm(data.byKode[top[0][0]])}${top[1] ? ` dan ${nm(data.byKode[top[1][0]])}` : ''}, lewat kesepakatan pendanaan antarwilayah hulu–hilir.` : 'Tekanan berasal dari wilayah sendiri; fokus pada rehabilitasi lereng curam lokal.'}</small></div>
            </div>
          </div>
        </Muncul>

        <Muncul i={2}>
          <div className="kartu">
            <div className="kartu-j"><h3>Penyumbang kehilangan hutan</h3><span className="catatan">km² · ketuk untuk profil</span></div>
            <KontribusiHulu data={data} k={k} maks={9} />
          </div>
        </Muncul>

        <Muncul i={3}>
          <div className="kartu">
            <div className="kartu-j"><h3>Makin tertekan hulunya, makin sering berdampak</h3><Label jenis="model" /></div>
            <Batang tinggi={130} data={KUARTIL.map(([l, v], i) => ({ l, v, warna: RAMP_TERANG.hulu[i + 1] }))} label nilai={v => fmt(v, 3)} />
            <p className="catatan" style={{ marginTop: 8 }}>Rata-rata frekuensi tahun berdampak berat per kuartil tekanan hulu (Q1 terendah). Korelasi peringkat 0,53, setara indikator lereng; untuk rumah rusak berat 2025 ρ 0,38, tertinggi di antara indikator.</p>
          </div>
        </Muncul>

        <Muncul i={4}>
          <div className="sub-j">10 wilayah dengan tekanan hulu tertinggi</div>
          <div className="grup" style={{ marginTop: 10 }}>
            {urutHulu.slice(0, 10).map((x, i) => (
              <button key={x.kode} className={`rank ${i < 3 ? 'top' : ''}`} onClick={() => go('hulu', x.kode)}>
                <span className="r-n">{i + 1}</span>
                <div><b>{nm(x)}</b><small>{x.prov}</small></div>
                <div className="r-s"><b>{pct(x.hulu_frak, 2)}</b><small>{fmt(x.hulu_km2, 0)} km²</small></div>
              </button>
            ))}
          </div>
        </Muncul>
      </div>
      <PilihKab kab={data.kab} value={kode} onPick={kd => go('hulu', kd)} buka={pilih} tutup={() => setPilih(false)} />
    </div>
  )
}
