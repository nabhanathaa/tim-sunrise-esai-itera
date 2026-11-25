import { useMemo } from 'react'
import Peta from '../components/Peta.jsx'
import Icon from '../components/Icon.jsx'
import { Kepala, Label, Masuk as Muncul } from '../components/ui.jsx'
import SiagaHero from '../components/SiagaHero.jsx'
import { fmt, fmtInt, nm, pct, compact } from '../lib/format.js'
import { go } from '../lib/router.js'

export function KontribusiHulu({ data, k, maks = 8 }) {
  const rows = [[k.kode, k.lokal || 0, true], ...(k.hulu || []).map(([kd, v]) => [kd, v, false])].sort((a, b) => b[1] - a[1]).slice(0, maks)
  const mx = Math.max(...rows.map(r => r[1]), 0.01)
  const total = rows.reduce((a, r) => a + r[1], 0) || 1
  return (
    <div className="kontrib">
      {rows.map(([kd, v, lokal]) => (
        <button key={kd} className="kontrib-b" onClick={() => !lokal && go('kab', kd)}>
          <span>{lokal ? `${nm(data.byKode[kd])} (wilayah sendiri)` : nm(data.byKode[kd])}</span>
          <em>{fmt(v, 1)} km² · {fmt((v / total) * 100, 0)}%</em>
          <span className="bar-h"><i style={{ width: `${(v / mx) * 100}%`, background: lokal ? 'var(--soil)' : 'var(--em-500)' }} /></span>
        </button>
      ))}
    </div>
  )
}

export default function KabHalaman({ data, param }) {
  const kode = param[0] && data.byKode[param[0]] ? param[0] : '1111'
  const k = data.byKode[kode]
  const huluSet = useMemo(() => new Set((k.hulu || []).map(h => h[0])), [k])
  const pos = (key, desc = true) => { const s = [...data.kab].sort((a, b) => desc ? b[key] - a[key] : a[key] - b[key]); return s.findIndex(x => x.kode === kode) + 1 }

  return (
    <div className="halaman">
      <Kepala judul={nm(k)} sub={`${k.jenis} · ${k.prov} · kode BPS ${k.kode}`}
        kanan={<button className="ib" onClick={() => go('peta', kode)} aria-label="Buka di peta"><Icon n="map" /></button>} />
      <div className="tumpuk">
        <Muncul>
          <div className="peta-terang" style={{ height: 230, position: 'relative' }}>
            <Peta geo={data.geo} dark={false} intro={false} selected={kode} focus={kode}
              fill={kd => kd === kode ? '#0E4D3C' : huluSet.has(kd) ? '#E8A65A' : '#CFDDD6'} tools={false} />
            <div style={{ position: 'absolute', left: 10, bottom: 10, display: 'flex', gap: 6 }}>
              <span className="pil polos" style={{ background: '#fff', color: 'var(--em-700)' }}>■ wilayah ini</span>
              <span className="pil polos" style={{ background: '#fff', color: '#B8691F' }}>■ hulu penyumbang</span>
            </div>
          </div>
        </Muncul>

        <Muncul i={1}>
          <div className="metrik4">
            <div><small>Prioritas R3P</small><b>#{k.rank}</b><span className="kpi-s">rentang {fmt(k.rp5)}–{fmt(k.rp95)}</span></div>
            <div><small>Korban jiwa 2025</small><b>{fmtInt(k.korban25)}</b><span className="kpi-s">meninggal + hilang</span></div>
            <div><small>Rumah rusak berat 2025</small><b>{fmtInt(k.rrb25)}</b><span className="kpi-s">unit</span></div>
            <div><small>Tahun berdampak berat</small><b>{pct(k.freq, 0)}</b><span className="kpi-s">dari 2015–2025</span></div>
          </div>
        </Muncul>

        <Muncul i={2}><SiagaHero data={data} kode={kode} ringkasKartu aksi={false} /></Muncul>

        <Muncul i={3}>
          <div className="kartu">
            <div className="kartu-j"><h3>Dari mana tekanan hulu datang</h3><Label jenis="model" /></div>
            <p className="kecil muted" style={{ marginBottom: 12 }}>Luas hutan di lereng &gt;15° yang hilang 2015–2025 di sub-DAS hulu, menurut kab/kota letaknya. Rata-rata tertimbang: <b>{pct(k.hulu_frak, 2)}</b> DAS hulu (urutan {pos('hulu_frak')} dari 154).</p>
            <KontribusiHulu data={data} k={k} />
            <button className="btn btn-garis btn-penuh btn-k" style={{ marginTop: 14 }} onClick={() => go('hulu', kode)}><Icon n="route" s={16} /> Rantai hulu–hilir lengkap</button>
          </div>
        </Muncul>

        <Muncul i={4}>
          <div className="kartu">
            <div className="kartu-j"><h3>Medan dan erosi (RUSLE)</h3><Label jenis="model" /></div>
            <table className="tabel">
              <tbody>
                <tr><td>Laju erosi median A</td><td className="r">{fmt(k.A_med, 2)} t/ha/th</td></tr>
                <tr><td>Erosivitas hujan R</td><td className="r">{fmtInt(k.R)}</td></tr>
                <tr><td>Erodibilitas tanah K</td><td className="r">{fmt(k.K, 4)}</td></tr>
                <tr><td>Panjang-kemiringan LS</td><td className="r">{fmt(k.LS, 2)}</td></tr>
                <tr><td>Tutupan C</td><td className="r">{fmt(k.C, 4)}</td></tr>
                <tr><td>Lereng rata-rata</td><td className="r">{fmt(k.slope, 1)}°</td></tr>
                <tr><td>Tutupan pohon</td><td className="r">{pct(k.tree, 0)}</td></tr>
                <tr><td>Hutan lereng curam tahun 2000</td><td className="r">{pct(k.hutan_curam2000, 0)}</td></tr>
              </tbody>
            </table>
          </div>
        </Muncul>

        <Muncul i={5}>
          <div className="kartu">
            <div className="kartu-j"><h3>Kerentanan dan layanan</h3><Label jenis="resmi" /></div>
            <table className="tabel">
              <tbody>
                <tr><td>Penduduk 2025</td><td className="r">{fmtInt(k.penduduk)}</td></tr>
                <tr><td>Penduduk miskin</td><td className="r">{fmt(k.p0, 2)}%</td></tr>
                <tr><td>IPM</td><td className="r">{fmt(k.ipm, 2)}</td></tr>
                <tr><td>Rumah sakit per 100 rb</td><td className="r">{fmt(k.rs, 2)}</td></tr>
                <tr><td>Puskesmas per 100 rb</td><td className="r">{fmt(k.pusk, 2)}</td></tr>
                <tr><td>Kerapatan jalan</td><td className="r">{fmt(k.jalan, 3)} km/km²</td></tr>
                <tr><td>Peluang dampak berat (model)</td><td className="r">{pct(k.bahaya, 1)}</td></tr>
              </tbody>
            </table>
          </div>
        </Muncul>

        {k.genangan != null && (
          <Muncul i={6}>
            <div className="kartu">
              <div className="kartu-j"><h3>Jejak Senyar 2025</h3><Label jenis="resmi">SATELIT + DIBI</Label></div>
              <div className="metrik4">
                <div><small>Hujan IMERG 22 Nov–5 Des</small><b>{fmtInt(k.imerg)} mm</b></div>
                <div><small>Intensitas maks IMERG</small><b>{fmt(k.imerg_maks, 1)} mm/jam</b></div>
                <div><small>Genangan Sentinel-1</small><b>{fmt(k.genangan, 1)} km²</b></div>
                <div><small>Warga terdampak 2025</small><b>{compact(k.terdampak25)}</b></div>
              </div>
              <button className="btn btn-garis btn-penuh btn-k" style={{ marginTop: 12 }} onClick={() => go('putar')}><Icon n="play" s={16} /> Putar ulang kejadian</button>
            </div>
          </Muncul>
        )}
        <div className="dua">
          <button className="btn btn-em" onClick={() => go('lapor')}><Icon n="camera" s={18} /> Lapor di sini</button>
          <button className="btn btn-garis" onClick={() => go('tanya')}><Icon n="chat" s={18} /> Tanya</button>
        </div>
      </div>
    </div>
  )
}
