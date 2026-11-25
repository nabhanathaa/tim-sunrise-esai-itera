import { useMemo } from 'react'
import Icon from './Icon.jsx'
import { Kontur, Label } from './ui.jsx'
import { usePrakiraan, siaga, kategori, teksCuaca } from '../lib/cuaca.js'
import { fmt, nm, relatif, tglHari } from '../lib/format.js'
import { go } from '../lib/router.js'

export function huluTinggi(data, kode) {
  const v = data.kab.map(k => k.hulu_frak).sort((a, b) => a - b)
  return data.byKode[kode]?.hulu_frak >= v[Math.floor(v.length * 0.75)]
}

// Ringkas prakiraan Open-Meteo menjadi angka yang dipakai kartu
export function ringkas(d) {
  if (!d?.hourly) return null
  const t = d.hourly.time, pr = d.hourly.precipitation
  const now = d.current?.time ? d.current.time.slice(0, 13) : new Date().toISOString().slice(0, 13)
  let i0 = t.findIndex(x => x.slice(0, 13) === now); if (i0 < 0) i0 = 24
  const jam = []
  for (let i = i0 - 12; i < i0 + 36; i++) jam.push({ v: pr[i] ?? 0, lalu: i < i0, kini: i === i0 })
  const depan72 = pr.slice(i0, i0 + 72).reduce((a, b) => a + (b || 0), 0)
  const harian = (d.daily?.time || []).map((h, i) => ({ h, mm: d.daily.precipitation_sum[i] ?? 0, p: d.daily.precipitation_probability_max?.[i] ?? null })).slice(1, 4)
  const maks = Math.max(0, ...harian.map(x => x.mm))
  return { jam, depan72, harian, maks, kini: d.current }
}

export default function SiagaHero({ data, kode, ringkasKartu, aksi = true }) {
  const k = data.byKode[kode]
  const s = usePrakiraan(k?.lat, k?.lon, `kab-${kode}`)
  const r = useMemo(() => ringkas(s.data), [s.data])
  const ht = huluTinggi(data, kode)
  const lv = r ? siaga(r.maks, ht) : null

  return (
    <div className="pahlawan pahlawan-biru">
      <Kontur />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span className="eyebrow" style={{ color: '#A9D3EC' }}>Siaga hujan · {nm(k)}</span>
        <Label jenis="langsung">PRAKIRAAN LANGSUNG</Label>
      </div>
      {s.gagal && !r ? (
        <div style={{ padding: '18px 0 4px' }}>
          <b style={{ fontSize: 16 }}>Prakiraan belum bisa dimuat</b>
          <p style={{ marginTop: 4 }}>Perangkat sedang luring atau layanan cuaca tidak terjangkau. Analisis risiko tetap bisa dibuka.</p>
        </div>
      ) : !r ? (
        <div style={{ padding: '22px 0 8px' }}><p>Mengambil prakiraan 72 jam…</p><div className="memuat-garis" style={{ background: 'rgba(255,255,255,.15)' }} /></div>
      ) : (
        <>
          <div className="cuaca-baris" style={{ marginTop: 12 }}>
            <span className="cuaca-ikon"><Icon n="rain" s={26} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="angka-besar">{fmt(r.depan72, 0)}<small>mm / 72 jam</small></div>
              <p style={{ marginTop: 4 }}>{teksCuaca(r.kini?.weather_code)} · {fmt(r.kini?.temperature_2m, 0)}°C · maks {fmt(r.maks, 0)} mm/hari ({kategori(r.maks).label.toLowerCase()})</p>
            </div>
            <span className={`siaga-lencana ${lv.kelas}`}>{lv.label}</span>
          </div>
          {!ringkasKartu && (
            <>
              <div className="hujan-jam" aria-label="Hujan per jam, 12 jam lalu sampai 36 jam ke depan">
                {r.jam.map((j, i) => <i key={i} className={j.kini ? 'kini' : j.lalu ? 'lalu' : ''} style={{ height: `${Math.min(100, 6 + j.v * 9)}%` }} />)}
              </div>
              <div className="hujan-label"><span>−12 jam</span><span>sekarang</span><span>+36 jam</span></div>
            </>
          )}
          <div className="statgrid">
            {r.harian.map((h, i) => (
              <div className="stat" key={h.h}><small>{i === 0 ? 'Hari ini' : i === 1 ? 'Besok' : tglHari(h.h).split(',')[0]}</small><b>{fmt(h.mm, 0)}<span style={{ fontSize: 11, color: '#A9C9BC' }}> mm</span></b></div>
            ))}
          </div>
          <p style={{ fontSize: 11, marginTop: 10, color: '#8FB7CF' }}>
            {ht ? 'Wilayah ini termasuk 25% teratas tekanan hulu, sehingga ambang siaga diturunkan satu tingkat. ' : ''}
            Indikasi aplikasi dari Open-Meteo, bukan peringatan resmi BMKG. Diperbarui {relatif(s.t)}{s.luring ? ' (luring)' : ''}.
          </p>
        </>
      )}
      {aksi && (
        <div className="dua" style={{ marginTop: 14 }}>
          <button className="btn btn-lime" onClick={() => go('lapor')}><Icon n="camera" s={18} /> Lapor kejadian</button>
          <button className="btn btn-hantu" onClick={() => go('siaga')}>Peta siaga <Icon n="right" s={16} /></button>
        </div>
      )}
    </div>
  )
}
