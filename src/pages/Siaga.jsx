import { useMemo, useState } from 'react'
import Peta, { Legenda } from '../components/Peta.jsx'
import Icon from '../components/Icon.jsx'
import { Kepala, Label, Seg, Masuk as Muncul, PilihKab } from '../components/ui.jsx'
import SiagaHero from '../components/SiagaHero.jsx'
import { usePrakiraanSumatra, siaga, KATEGORI } from '../lib/cuaca.js'
import { RAMP, seqScale } from '../lib/scales.js'
import { fmt, nm, relatif, tglHari } from '../lib/format.js'
import { go } from '../lib/router.js'
import { useProfil } from '../lib/profil.js'

const WARNA_LV = ['#1E5C46', '#E8961E', '#EE6A2B', '#DC3D43']

export default function Siaga({ data, profil }) {
  const [, simpan] = useProfil()
  const [mode, setMode] = useState('mm')
  const [hari, setHari] = useState(-1)
  const [sel, setSel] = useState(null)
  const [pilih, setPilih] = useState(false)
  const c = usePrakiraanSumatra(data.kab)
  const q75 = useMemo(() => { const v = data.kab.map(k => k.hulu_frak).sort((a, b) => a - b); return v[Math.floor(v.length * 0.75)] }, [data.kab])

  const baris = useMemo(() => {
    if (!c.data) return []
    return data.kab.map(k => {
      const v = c.data[k.kode]; if (!v) return null
      const mm = hari < 0 ? v.mm.reduce((a, b) => a + b, 0) : v.mm[hari] ?? 0
      const maks = Math.max(...v.mm)
      const ht = k.hulu_frak >= q75
      return { k, mm, maks, ht, lv: siaga(maks, ht) }
    }).filter(Boolean).sort((a, b) => b.lv.lv - a.lv.lv || b.maks - a.maks)
  }, [c.data, data.kab, hari, q75])
  const by = useMemo(() => Object.fromEntries(baris.map(b => [b.k.kode, b])), [baris])
  const skala = seqScale([0, hari < 0 ? 150 : 60], RAMP.hujan)
  const fill = kd => { const b = by[kd]; if (!b) return '#15302A'; return mode === 'mm' ? skala(b.mm) : WARNA_LV[b.lv.lv] }
  const hitung = [0, 1, 2, 3].map(lv => baris.filter(b => b.lv.lv === lv).length)
  const tgl = c.data ? Object.values(c.data)[0]?.hari || [] : []
  const s = sel ? by[sel] : null

  return (
    <div className="halaman">
      <Kepala judul="Siaga hujan" sub="Prakiraan 3 hari untuk 154 kab/kota" kembali={false}
        kanan={<button className="ib" onClick={() => go('panduan')} aria-label="Panduan darurat"><Icon n="siren" /></button>} />
      <div className="tumpuk">
        {profil.wilayah ? <Muncul><SiagaHero data={data} kode={profil.wilayah} /></Muncul> : (
          <button className="info info-em" onClick={() => setPilih(true)} style={{ textAlign: 'left' }}><Icon n="pin" s={18} /><span><b>Atur wilayah Anda</b> untuk melihat prakiraan per jam dan tingkat siaga.</span></button>
        )}

        <Muncul i={1}>
          <div className="kartu" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 14px 10px', display: 'grid', gap: 10 }}>
              <div className="kartu-j" style={{ margin: 0 }}><h3>Peta siaga Sumatera</h3><Label jenis="langsung" /></div>
              <Seg id="sm" kecil value={mode} onChange={setMode} items={[['mm', 'Curah hujan'], ['lv', 'Tingkat siaga']]} />
              {mode === 'mm' && <Seg id="sh" kecil value={hari} onChange={setHari} items={[[-1, '3 hari'], [0, 'Hari ini'], [1, 'Besok'], [2, tgl[2] ? tglHari(tgl[2]).split(',')[0] : 'Lusa']]} />}
            </div>
            <div style={{ height: 330, position: 'relative' }}>
              <Peta geo={data.geo} fill={fill} selected={sel} onSelect={kd => setSel(kd === sel ? null : kd)} />
              {!c.data && <div className="radar"><span className="radar-t">{c.gagal ? 'Prakiraan tidak terjangkau. Periksa sinyal lalu buka ulang.' : 'Mengambil prakiraan 154 titik…'}</span></div>}
            </div>
            <div style={{ padding: '12px 14px', background: '#051712' }}>
              {s ? (
                <button style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', color: '#fff', textAlign: 'left' }} onClick={() => go('kab', s.k.kode)}>
                  <div style={{ flex: 1, minWidth: 0 }}><b style={{ display: 'block' }}>{nm(s.k)}</b><small style={{ color: '#9DB8AE' }}>{fmt(s.mm, 0)} mm · maks {fmt(s.maks, 0)} mm/hari{s.ht ? ' · hulu tertekan' : ''}</small></div>
                  <span className={`siaga-lencana ${s.lv.kelas}`}>{s.lv.label}</span><Icon n="right" s={18} />
                </button>
              ) : mode === 'mm'
                ? <Legenda judul={hari < 0 ? 'Jumlah hujan 3 hari (mm)' : 'Hujan harian (mm)'} ramp={RAMP.hujan} ticks={hari < 0 ? ['0', '50', '100', '150+'] : ['0', '20', '40', '60+']} />
                : <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#CFE3DA' }}>{['Normal', 'Waspada', 'Siaga', 'Awas'].map((x, i) => <span key={x} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><i style={{ width: 10, height: 10, borderRadius: 3, background: WARNA_LV[i] }} />{x} <b className="num">{hitung[i]}</b></span>)}</div>}
            </div>
          </div>
        </Muncul>

        {baris.length > 0 && (
          <Muncul i={2}>
            <div className="sub-j">Perlu perhatian <span className="catatan">diperbarui {relatif(c.t)}</span></div>
            <div className="grup" style={{ marginTop: 10 }}>
              {baris.slice(0, 8).map((b, i) => (
                <button key={b.k.kode} className={`rank ${i < 3 && b.lv.lv > 0 ? 'top' : ''}`} onClick={() => go('kab', b.k.kode)}>
                  <span className="r-n">{i + 1}</span>
                  <div><b>{nm(b.k)}</b><small>{b.k.prov}{b.ht ? ' · hulu tertekan' : ''}</small></div>
                  <div className="r-s"><span className={`pil ${b.lv.kelas === 'green' ? 'green' : b.lv.kelas}`}>{b.lv.label}</span><small style={{ marginTop: 3 }}>{fmt(b.maks, 0)} mm/hr</small></div>
                </button>
              ))}
            </div>
          </Muncul>
        )}

        <div className="kartu">
          <div className="kartu-j"><h3>Cara tingkat siaga ditentukan</h3><Label jenis="asumsi" /></div>
          <table className="tabel"><thead><tr><th>Hujan harian (BMKG)</th><th className="r">mm/hari</th></tr></thead><tbody>
            {KATEGORI.slice(0, 5).map((x, i, a) => <tr key={x.label}><td><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 3, background: x.warna, marginRight: 8 }} />{x.label}</td><td className="r">{i === 0 ? `> ${x.min}` : `${x.min}–${a[i - 1].min}`}</td></tr>)}
          </tbody></table>
          <p className="kecil muted" style={{ marginTop: 10 }}>Dari hujan harian tertinggi 3 hari ke depan: <b>Waspada</b> ≥ 50 mm, <b>Siaga</b> ≥ 100 mm, <b>Awas</b> ≥ 150 mm. Wilayah di 25% teratas tekanan hulu naik satu tingkat lebih awal (Waspada ≥ 20, Siaga ≥ 50). Ini indikasi aplikasi untuk perhatian dini, bukan peringatan resmi BMKG atau BPBD.</p>
        </div>
      </div>
      <PilihKab kab={data.kab} value={profil.wilayah} onPick={v => simpan({ ...profil, wilayah: v })} buka={pilih} tutup={() => setPilih(false)} />
    </div>
  )
}
