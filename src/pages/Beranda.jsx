import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import Icon from '../components/Icon.jsx'
import { AnimNum, Baris, Batang, Kontur, Label, Masuk as Muncul, Seg, Tombol, PilihKab } from '../components/ui.jsx'
import SiagaHero from '../components/SiagaHero.jsx'
import { KartuLaporan } from './Laporan.jsx'
import { go } from '../lib/router.js'
import { inisial, sapaan, useProfil } from '../lib/profil.js'
import { untukSaya } from '../lib/store.js'
import { fmt, fmtInt, nm, pct, compact } from '../lib/format.js'

export default function Beranda({ data, profil, peran, store }) {
  const [, simpan] = useProfil()
  const [pilih, setPilih] = useState(false)
  const [metrik, setMetrik] = useState('korban_jiwa')
  const [tahunAktif, setTahunAktif] = useState(10)
  const w = profil.wilayah
  const kw = w ? data.byKode[w] : null
  const lap = store.laporan
  const menunggu = lap.filter(l => l.status === 'menunggu')
  const milikSaya = lap.filter(l => profil.hp && l.pelapor?.hp === profil.hp)
  const nNotif = store.notif.filter(n => !n.dibaca && untukSaya(n, profil)).length
  const adaContoh = lap.some(l => l.contoh)
  const urut = useMemo(() => [...data.kab].sort((a, b) => a.rank - b.rank), [data.kab])
  const huluUrut = useMemo(() => [...data.kab].sort((a, b) => b.hulu_frak - a.hulu_frak), [data.kab])
  const th = data.tahunan
  const MET = { korban_jiwa: ['Korban jiwa', 'var(--red)'], kejadian: ['Kejadian', 'var(--river)'], rr_berat: ['Rumah rusak berat', 'var(--soil)'] }

  return (
    <div className="halaman">
      <div className="tumpuk">
        <Muncul>
          <div className="salam">
            <button className="avatar" onClick={() => go('akun')} aria-label="Akun">{inisial(profil.nama)}</button>
            <div className="salam-t"><small>{sapaan()},</small><b>{profil.nama}</b></div>
            <button className="chip-peran" onClick={() => go('akun')}>{peran.nama.split(' ')[0] === 'Warga' ? 'Warga' : peran.nama.replace('Petugas ', '').replace('Perencana ', '').replace('Pengelola ', '')}</button>
            <button className="ib" onClick={() => go('notif')} aria-label="Notifikasi"><Icon n="bell" />{nNotif > 0 && <i className="badge">{nNotif}</i>}</button>
          </div>
        </Muncul>

        {adaContoh && (
          <Muncul i={1}>
            <div className="info info-amber"><Icon n="info" s={18} /><span><b>DATA CONTOH.</b> Laporan bertanda contoh dibuat untuk demo alur verifikasi; data analisis memakai sumber resmi. <button className="tautan" onClick={() => go('akun')}>Hapus di Akun</button>.</span></div>
          </Muncul>
        )}

        {!w && (
          <Muncul i={2}>
            <button className="pahlawan" style={{ textAlign: 'left', width: '100%' }} onClick={() => setPilih(true)}>
              <Kontur />
              <span className="eyebrow">Mulai di sini</span>
              <b style={{ display: 'block', fontSize: 20, marginTop: 6, letterSpacing: '-.02em' }}>Pilih wilayah Anda</b>
              <p style={{ marginTop: 4 }}>Siaga hujan, peringkat prioritas, dan asal tekanan hulu akan disesuaikan.</p>
              <span className="btn btn-lime" style={{ marginTop: 14 }}><Icon n="pin" s={18} /> Pilih kabupaten/kota</span>
            </button>
            <PilihKab kab={data.kab} value={w} onPick={v => simpan({ ...profil, wilayah: v })} buka={pilih} tutup={() => setPilih(false)} />
          </Muncul>
        )}

        {w && (
          <Muncul i={2}>
            {peran.id === 'warga' && <SiagaHero data={data} kode={w} />}
            {peran.id === 'bpbd' && <HeroBPBD data={data} lap={lap} menunggu={menunggu} kw={kw} />}
            {peran.id === 'r3p' && <HeroR3P kw={kw} urut={urut} />}
            {peran.id === 'das' && <HeroDAS data={data} kw={kw} huluUrut={huluUrut} />}
          </Muncul>
        )}

        <Muncul i={3}>
          <div className="sub-j">Perlu tindakan</div>
        </Muncul>
        <Muncul i={4}>
          <div className="grup">
            {peran.id === 'bpbd' && <Baris aksen="amber" ikon="shieldCheck" warna="amber" judul={`${menunggu.length} laporan menunggu verifikasi`} sub="Urut menurut skor kepercayaan, tertinggi dulu" onClick={() => go('laporan')} />}
            {peran.id === 'warga' && <Baris aksen="em" ikon="file" warna="em" judul={milikSaya.length ? `${milikSaya.length} laporan Anda` : 'Belum ada laporan dari Anda'} sub={milikSaya.length ? `Terakhir: ${milikSaya[0].status === 'diverifikasi' ? 'sudah diverifikasi' : 'menunggu petugas'}` : 'Kirim foto/video bergeotag saat terjadi banjir atau longsor'} onClick={() => go(milikSaya.length ? 'laporan' : 'lapor')} />}
            {peran.id === 'r3p' && kw && <Baris aksen="em" ikon="sliders" judul={`${nm(kw)} di peringkat ${kw.rank} dari 154`} sub={`Rentang stabilitas ${fmt(kw.rp5)}–${fmt(kw.rp95)} dari 1.000 simulasi bobot`} onClick={() => go('prioritas')} />}
            {peran.id === 'das' && kw && <Baris aksen="em" ikon="tree" warna="em" judul={`${kw.hulu.length} kab/kota hulu menyuplai ${nm(kw)}`} sub="Lihat dari mana tekanan lahan berasal" onClick={() => go('hulu', w)} />}
            <Baris aksen="river" ikon="rain" warna="river" judul="Peta siaga 3 hari Sumatera" sub="Prakiraan hujan 154 kab/kota dan tingkat siaga" onClick={() => go('siaga')} />
            <Baris aksen="red" ikon="play" warna="red" judul="Putar ulang Senyar 2025" sub="Animasi harian 20 Nov–6 Des: kejadian dan dampaknya" onClick={() => go('putar')} />
          </div>
        </Muncul>

        <Muncul i={5}>
          <div className="sub-j">Semua fitur</div>
        </Muncul>
        <Muncul i={6}>
          <div className="aksi-grid">
            <Tombol ke="peta" ikon="map" label="Peta risiko" warna="em" />
            <Tombol ke="siaga" ikon="rain" label="Siaga hujan" warna="river" />
            <Tombol ke="laporan" ikon="shieldCheck" label="Laporan" warna="amber" badge={peran.id === 'bpbd' ? menunggu.length : null} />
            <Tombol ke="putar" ikon="play" label="Putar ulang" warna="red" />
            <Tombol ke="prioritas" ikon="sliders" label="Prioritas R3P" warna="em" />
            <Tombol ke={['hulu', w || '1111']} ikon="tree" label="Rantai hulu" warna="soil" />
            <Tombol ke="tanya" ikon="chat" label="Tanya" warna="em" />
            <Tombol ke="panduan" ikon="siren" label="Darurat" warna="red" />
          </div>
        </Muncul>

        {w && peran.id !== 'warga' && (
          <Muncul i={7}><SiagaHero data={data} kode={w} ringkasKartu aksi={false} /></Muncul>
        )}

        <Muncul i={8}>
          <div className="kartu">
            <div className="kartu-j"><h3>Jejak banjir & longsor Sumatera</h3><Label jenis="resmi" /></div>
            <Seg id="met" kecil value={metrik} onChange={setMetrik} items={Object.entries(MET).map(([k, v]) => [k, v[0]])} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '14px 2px 6px' }}>
              <span className="muted kecil">{th[tahunAktif].tahun}</span>
              <b className="num" style={{ fontSize: 24 }}><AnimNum v={th[tahunAktif][metrik]} durasi={.6} /></b>
            </div>
            <Batang tinggi={110} data={th.map(t => ({ v: t[metrik], l: String(t.tahun).slice(2), warna: MET[metrik][1] }))} aktif={tahunAktif} onPick={setTahunAktif} label />
            <p className="catatan" style={{ marginTop: 8 }}>DIBI BNPB, 154 kab/kota, 2015–2025. Ketuk batang untuk melihat angka per tahun.</p>
          </div>
        </Muncul>

        {lap.length > 0 && (
          <>
            <div className="sub-j">Laporan terbaru <button className="tautan" onClick={() => go('laporan')}>Semua</button></div>
            {lap.slice(0, 2).map(l => <KartuLaporan key={l.id} l={l} data={data} />)}
          </>
        )}

        <div className="kartu">
          <div className="kartu-j"><h3>Yang ditemukan analisis</h3><Label jenis="model" /></div>
          <div className="tumpuk" style={{ gap: 12 }}>
            <Temuan v="0,53" t="Korelasi peringkat antara hutan lereng curam yang hilang di hulu dan frekuensi kejadian berat. Setara indikator lereng; erosi RUSLE lokal hanya 0,32." />
            <Temuan v="4,1×" t="Frekuensi tahun berdampak berat di kuartil tekanan hulu tertinggi dibanding terendah (0,315 vs 0,077)." />
            <Temuan v="0,71" t="ROC-AUC model XGBoost saat diuji pada kejadian 2025; turun ke 0,57 pada uji blok wilayah." />
          </div>
          <button className="btn btn-garis btn-penuh btn-k" style={{ marginTop: 14 }} onClick={() => go('metode')}>Cara angka ini dihitung</button>
        </div>
      </div>
    </div>
  )
}

function Temuan({ v, t }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 10, alignItems: 'start' }}>
      <b className="num" style={{ fontSize: 22, color: 'var(--em-600)' }}>{v}</b>
      <span className="kecil" style={{ color: 'var(--ink-2)' }}>{t}</span>
    </div>
  )
}

function HeroBPBD({ data, lap, menunggu, kw }) {
  const ver = lap.filter(l => l.status === 'diverifikasi').length
  const rata = menunggu.length ? menunggu.reduce((a, l) => a + l.skor, 0) / menunggu.length : 0
  const top = [...menunggu].sort((a, b) => b.skor - a.skor)[0]
  return (
    <div className="pahlawan">
      <Kontur />
      <span className="eyebrow">Antrean verifikasi · BPBD {kw ? nm(kw) : ''}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
        <span className="angka-besar"><AnimNum v={menunggu.length} /></span><span style={{ color: '#A9D9C4', fontWeight: 600 }}>laporan menunggu</span>
      </div>
      <div className="statgrid">
        <div className="stat"><small>Terverifikasi</small><b>{ver}</b></div>
        <div className="stat"><small>Skor rata²</small><b>{fmt(rata, 0)}</b></div>
        <div className="stat"><small>Total masuk</small><b>{lap.length}</b></div>
      </div>
      {top && <p style={{ marginTop: 12 }}>Prioritas #1: {data.byKode[top.kab] ? nm(data.byKode[top.kab]) : ''}, skor {top.skor}.</p>}
      <button className="btn btn-lime btn-penuh" style={{ marginTop: 14 }} onClick={() => go('laporan')}><Icon n="shieldCheck" s={18} /> Mulai verifikasi antrean <Icon n="right" s={16} /></button>
    </div>
  )
}

function HeroR3P({ kw, urut }) {
  return (
    <div className="pahlawan">
      <Kontur />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="eyebrow">Prioritas pemulihan R3P</span><Label jenis="model" /></div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
        <span className="angka-besar">#{kw.rank}</span><span style={{ color: '#A9D9C4', fontWeight: 600 }}>dari 154 · {nm(kw)}</span>
      </div>
      <div className="statgrid">
        <div className="stat"><small>Skor TOPSIS</small><b>{fmt(kw.prior, 3)}</b></div>
        <div className="stat"><small>Rentang P5–P95</small><b>{fmt(kw.rp5)}–{fmt(kw.rp95)}</b></div>
        <div className="stat"><small>Korban 2025</small><b>{fmtInt(kw.korban25)}</b></div>
      </div>
      <p style={{ marginTop: 12 }}>Tiga teratas saat ini: {urut.slice(0, 3).map(nm).join(', ')}.</p>
      <button className="btn btn-lime btn-penuh" style={{ marginTop: 14 }} onClick={() => go('prioritas')}><Icon n="sliders" s={18} /> Atur bobot dan bandingkan</button>
    </div>
  )
}

function HeroDAS({ data, kw, huluUrut }) {
  const q = huluUrut.findIndex(k => k.kode === kw.kode) + 1
  const sumber = [[kw.kode, kw.lokal || 0], ...(kw.hulu || [])].sort((a, b) => b[1] - a[1])[0]
  return (
    <div className="pahlawan pahlawan-tanah">
      <Kontur />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="eyebrow" style={{ color: '#F0C894' }}>Tekanan hulu · {nm(kw)}</span><Label jenis="model" /></div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
        <span className="angka-besar">{pct(kw.hulu_frak, 2)}</span><span style={{ color: '#F0C894', fontWeight: 600 }}>DAS hulu kehilangan hutan curam</span>
      </div>
      <div className="statgrid">
        <div className="stat"><small>Urutan hulu</small><b>{q}/154</b></div>
        <div className="stat"><small>Luas hilang</small><b>{compact(kw.hulu_km2)} km²</b></div>
        <div className="stat"><small>Hutan curam 2000</small><b>{pct(kw.hutan_curam2000, 0)}</b></div>
      </div>
      {sumber && <p style={{ marginTop: 12, color: '#E8D2B5' }}>Penyumbang terbesar: {sumber[0] === kw.kode ? 'wilayah sendiri' : nm(data.byKode[sumber[0]])} ({fmt(sumber[1], 1)} km²).</p>}
      <button className="btn btn-lime btn-penuh" style={{ marginTop: 14 }} onClick={() => go('hulu', kw.kode)}><Icon n="route" s={18} /> Telusuri rantai hulu</button>
    </div>
  )
}
