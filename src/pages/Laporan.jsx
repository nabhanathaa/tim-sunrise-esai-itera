import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import Peta from '../components/Peta.jsx'
import Icon from '../components/Icon.jsx'
import { Chips, Kepala, Label, Sheet, Masuk as Muncul } from '../components/ui.jsx'
import { Cincin, DaftarCek } from './Lapor.jsx'
import { JENIS, KEBUTUHAN, STATUS, TINGKAT, CEK, ubahLaporan, kirimNotif, useMediaURL } from '../lib/store.js'
import { fmt, fmtInt, nm, relatif, tglHari, jam } from '../lib/format.js'
import { go } from '../lib/router.js'

const kelasSkor = s => s >= 75 ? 'tinggi' : s >= 50 ? 'sedang' : 'rendah'
const IKON_J = { banjir: 'wave', banjir_bandang: 'wave', longsor: 'mountain', genangan: 'drop', retakan: 'alert' }

export function KartuLaporan({ l, data, i = 0 }) {
  const j = JENIS[l.jenis] || JENIS.banjir
  return (
    <motion.button className="lap" onClick={() => go('laporan', l.id)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
      <div className="lap-a">
        <span className="lap-id">{l.id}</span>
        {l.contoh && <Label jenis="contoh" />}
        <span className={`pil ${STATUS[l.status].kelas}`}>{STATUS[l.status].label}</span>
      </div>
      <div className="lap-u">
        <span className="ikon-j" style={{ background: j.warna }}><Icon n={IKON_J[l.jenis]} s={22} /></span>
        <div>
          <b>{j.label} · {nm(data.byKode[l.kab])}</b>
          <small>{TINGKAT[l.tingkat]} · {l.pelapor.nama} · {relatif(l.waktu)}</small>
        </div>
        <div className={`skor ${kelasSkor(l.skor)}`}><b>{l.skor}</b><small>skor</small></div>
      </div>
      <div className="lap-k">
        <span className="cek-mini" aria-label="Hasil 6 cek">{Object.keys(CEK).map(k => <i key={k} className={l.cek[k] ? 'ya' : ''} />)}</span>
        <span>{l.media?.length ? `${l.media.length} bukti` : 'tanpa bukti visual'}{l.akurasi ? ` · GPS ±${fmt(l.akurasi, 0)} m` : ' · lokasi manual'}</span>
      </div>
    </motion.button>
  )
}

function unduhCSV(lap, data) {
  const kolom = ['id', 'waktu', 'kab_kota', 'kode_bps', 'lintang', 'bujur', 'akurasi_m', 'jenis', 'tingkat', 'korban', 'terdampak', 'kebutuhan', 'skor', 'status', 'pelapor', 'contoh', 'catatan']
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const baris = lap.map(l => [l.id, l.waktu, nm(data.byKode[l.kab]), l.kab, l.lat, l.lon, l.akurasi ?? '', JENIS[l.jenis]?.label, TINGKAT[l.tingkat], l.korban, l.terdampak, (l.kebutuhan || []).map(k => KEBUTUHAN[k]).join('; '), l.skor, STATUS[l.status].label, l.pelapor.nama, l.contoh ? 'ya' : '', l.catatan].map(esc).join(','))
  const url = URL.createObjectURL(new Blob(['﻿' + [kolom.join(','), ...baris].join('\n')], { type: 'text/csv' }))
  const a = document.createElement('a'); a.href = url; a.download = `laporan-lapangan-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export default function Laporan({ data, param, store, profil, peran }) {
  if (param[0]) return <Detail data={data} id={param[0]} store={store} profil={profil} peran={peran} />
  const bpbd = peran.id === 'bpbd'
  const [f, setF] = useState(bpbd ? 'menunggu' : 'semua')
  const lap = store.laporan
  const milik = l => profil.hp && l.pelapor?.hp === profil.hp
  const daftar = useMemo(() => {
    let x = f === 'semua' ? lap : f === 'saya' ? lap.filter(milik) : lap.filter(l => l.status === f)
    return f === 'menunggu' ? [...x].sort((a, b) => b.skor - a.skor) : x
  }, [lap, f]) // eslint-disable-line
  const n = s => lap.filter(l => l.status === s).length

  return (
    <div className="halaman">
      <Kepala judul={bpbd ? 'Antrean verifikasi' : 'Laporan lapangan'} sub={bpbd ? 'Diurutkan menurut skor kepercayaan' : 'Laporan warga dan statusnya'}
        kanan={bpbd ? <button className="ib" onClick={() => unduhCSV(lap, data)} aria-label="Unduh CSV"><Icon n="download" /></button> : <button className="ib" onClick={() => go('lapor')} aria-label="Lapor"><Icon n="plus" /></button>} />
      <div className="tumpuk">
        <Chips value={f} onChange={setF} items={[
          ['menunggu', 'Menunggu', n('menunggu')], ['diverifikasi', 'Terverifikasi', n('diverifikasi')], ['info', 'Perlu info', n('info')],
          ['ditolak', 'Ditolak', n('ditolak')], ...(!bpbd ? [['saya', 'Milik saya', lap.filter(milik).length]] : []), ['semua', 'Semua', lap.length]
        ]} />
        {bpbd && (
          <div className="info info-em"><Icon n="shieldCheck" s={18} /><span>Skor dihitung otomatis dari 6 cek: identitas, akurasi GPS, kecocokan wilayah, kesegaran waktu, bukti visual, dan laporan pendukung di sekitar. Keputusan akhir tetap di tangan petugas.</span></div>
        )}
        {daftar.length ? daftar.map((l, i) => <KartuLaporan key={l.id} l={l} data={data} i={i} />) : (
          <div className="kartu" style={{ textAlign: 'center', padding: 28 }}>
            <Icon n="file" s={30} className="t-em" />
            <p className="teks" style={{ marginTop: 8 }}>Belum ada laporan di kategori ini.</p>
            <button className="btn btn-em btn-k" style={{ marginTop: 12 }} onClick={() => go('lapor')}>Buat laporan</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Media({ m }) {
  const url = useMediaURL(m.id)
  if (!url) return <div className="media-t" style={{ display: 'grid', placeItems: 'center', color: '#9DB8AE' }}><Icon n={m.tipe === 'foto' ? 'image' : 'video'} /></div>
  return m.tipe === 'foto' ? <img src={url} alt="Bukti foto" /> : <video src={url} controls playsInline preload="metadata" />
}

function Detail({ data, id, store, profil, peran }) {
  const l = store.laporan.find(x => x.id === id)
  const [aksi, setAksi] = useState(null)
  const [catatan, setCatatan] = useState('')
  const [mi, setMi] = useState(0)
  if (!l) return <div className="halaman"><Kepala judul="Laporan" /><p className="teks">Laporan tidak ditemukan atau sudah dihapus.</p></div>
  const j = JENIS[l.jenis]
  const k = data.byKode[l.kab]
  const bpbd = peran.id === 'bpbd'

  const putuskan = () => {
    const st = { verifikasi: 'diverifikasi', tolak: 'ditolak', info: 'info' }[aksi]
    const label = { verifikasi: 'Diverifikasi', tolak: 'Ditolak', info: 'Minta info tambahan' }[aksi]
    ubahLaporan(l.id, x => ({ ...x, status: st, riwayat: [...x.riwayat, { waktu: new Date().toISOString(), oleh: `${profil.nama} (BPBD)`, aksi: label, catatan: catatan.trim() }] }))
    if (l.pelapor.hp) kirimNotif({ hp: l.pelapor.hp, judul: `Laporan ${l.id}: ${label.toLowerCase()}`, isi: catatan.trim() || `${j.label} di ${nm(k)}`, lapId: l.id })
    setAksi(null); setCatatan('')
  }
  const bagikan = async () => {
    const teks = `${j.label} di ${nm(k)} (${TINGKAT[l.tingkat]}). Titik: ${fmt(l.lat, 5)}, ${fmt(l.lon, 5)}. Status: ${STATUS[l.status].label}.`
    try { if (navigator.share) await navigator.share({ title: `Laporan ${l.id}`, text: teks }); else await navigator.clipboard.writeText(teks) } catch { /* dibatalkan */ }
  }

  return (
    <div className="halaman">
      <Kepala judul={`Laporan ${l.id}`} sub={`${tglHari(l.waktu)} · ${jam(l.waktu)} WIB`} kanan={<button className="ib" onClick={bagikan} aria-label="Bagikan"><Icon n="share" /></button>} />
      <div className="tumpuk">
        <Muncul>
          <div className="lap" style={{ boxShadow: 'none' }}>
            <div className="lap-a"><span className={`pil ${STATUS[l.status].kelas}`}>{STATUS[l.status].label}</span>{l.contoh && <Label jenis="contoh" />}</div>
            <div className="lap-u">
              <span className="ikon-j" style={{ background: j.warna }}><Icon n={IKON_J[l.jenis]} s={22} /></span>
              <div><b>{j.label} · {TINGKAT[l.tingkat]}</b><small>{nm(k)}, {k.prov}</small></div>
            </div>
            {l.catatan && <p className="teks">“{l.catatan}”</p>}
            <div className="metrik4" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              <div><small>Korban</small><b>{fmtInt(l.korban)}</b></div>
              <div><small>Terdampak</small><b>{fmtInt(l.terdampak)}</b></div>
              <div><small>Bukti</small><b>{l.media?.length || 0}</b></div>
            </div>
            {l.kebutuhan?.length > 0 && <div className="togel">{l.kebutuhan.map(x => <button key={x} className="on" style={{ pointerEvents: 'none' }}>{KEBUTUHAN[x]}</button>)}</div>}
          </div>
        </Muncul>

        {l.media?.length > 0 && (
          <Muncul i={1}>
            <div className="media-besar"><Media m={l.media[mi]} key={l.media[mi].id} /></div>
            {l.media.length > 1 && <div className="chips" style={{ marginTop: 8 }}>{l.media.map((m, i) => <button key={m.id} className={`chip ${i === mi ? 'on' : ''}`} onClick={() => setMi(i)}><Icon n={m.tipe === 'foto' ? 'image' : 'video'} s={14} />{i + 1}</button>)}</div>}
          </Muncul>
        )}

        <Muncul i={2}>
          <div className="gps-kartu">
            <Peta geo={data.geo} intro={false} tools={false} selected={l.kab} focus={l.kab} fill={kd => kd === l.kab ? '#1B8A6B' : '#16352D'} pins={[{ id: l.id, lon: l.lon, lat: l.lat, warna: j.warna, pulse: true, r: 7 }]} />
            <div className="gps-info">
              <div><small>Lintang</small><b>{fmt(l.lat, 5)}</b></div>
              <div><small>Bujur</small><b>{fmt(l.lon, 5)}</b></div>
              <div><small>Akurasi</small><b>{l.akurasi ? `±${fmt(l.akurasi, 0)} m` : 'manual'}</b></div>
            </div>
          </div>
          <a className="btn btn-garis btn-penuh btn-k" style={{ marginTop: 8, textDecoration: 'none' }} href={`https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lon}`} target="_blank" rel="noreferrer"><Icon n="route" s={16} /> Rute ke lokasi (Google Maps)</a>
        </Muncul>

        <Muncul i={3}>
          <div className="kartu">
            <div className="skor-kartu" style={{ marginBottom: 6 }}>
              <Cincin skor={l.skor} ukuranPx={84} />
              <div><b>Verifikasi pengirim</b><p className="kecil muted" style={{ marginTop: 3 }}>{l.pelapor.nama} · {l.pelapor.terverifikasi ? 'nomor HP terverifikasi' : 'akun belum terverifikasi'}</p></div>
            </div>
            <DaftarCek cek={l.cek} />
          </div>
        </Muncul>

        <Muncul i={4}>
          <div className="kartu">
            <div className="kartu-j"><h3>Riwayat</h3></div>
            {l.riwayat.map((r, i) => (
              <div className="lm" key={i}><i /><div><b>{r.aksi}</b><small>{r.oleh} · {relatif(r.waktu)}</small>{r.catatan && <small style={{ color: 'var(--ink-2)', marginTop: 2 }}>{r.catatan}</small>}</div></div>
            ))}
          </div>
        </Muncul>

        <Muncul i={5}>
          <div className="kartu">
            <div className="kartu-j"><h3>Konteks risiko {nm(k)}</h3><Label jenis="model" /></div>
            <p className="kecil muted">Prioritas R3P #{k.rank} dari 154 · tekanan hulu {fmt(k.hulu_frak * 100, 2)}% · tahun berdampak berat {fmt(k.freq * 100, 0)}% (2015–2025).</p>
            <button className="btn btn-garis btn-penuh btn-k" style={{ marginTop: 10 }} onClick={() => go('kab', l.kab)}>Profil wilayah</button>
          </div>
        </Muncul>

        {bpbd && l.status !== 'diverifikasi' && l.status !== 'ditolak' && (
          <div className="tumpuk" style={{ gap: 8 }}>
            <button className="btn btn-em btn-penuh" onClick={() => setAksi('verifikasi')}><Icon n="checkCircle" s={18} /> Verifikasi laporan</button>
            <div className="dua">
              <button className="btn btn-garis" onClick={() => setAksi('info')}>Minta info</button>
              <button className="btn btn-merah" onClick={() => setAksi('tolak')}>Tolak</button>
            </div>
          </div>
        )}
        {!bpbd && <p className="catatan">Verifikasi dilakukan petugas BPBD. Coba ganti peran ke Petugas BPBD di Akun untuk melihat alur tinjau; buka dua tab untuk melihatnya berjalan langsung.</p>}
      </div>

      <Sheet buka={!!aksi} tutup={() => setAksi(null)} judul={{ verifikasi: 'Verifikasi laporan', info: 'Minta info tambahan', tolak: 'Tolak laporan' }[aksi]}>
        <div className="tumpuk">
          <p className="teks">{aksi === 'verifikasi' ? 'Laporan akan ditandai terverifikasi dan pelapor menerima notifikasi.' : aksi === 'tolak' ? 'Jelaskan alasannya agar pelapor memahami (misalnya lokasi tidak cocok atau duplikat).' : 'Tulis apa yang perlu dilengkapi pelapor.'}</p>
          <label className="field"><span>Catatan untuk pelapor</span><textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder={aksi === 'verifikasi' ? 'Contoh: tim reaksi cepat diberangkatkan.' : 'Tulis catatan'} /></label>
          <button className={`btn btn-penuh ${aksi === 'tolak' ? 'btn-merah' : 'btn-em'}`} onClick={putuskan} disabled={aksi !== 'verifikasi' && !catatan.trim()}>Simpan keputusan</button>
        </div>
      </Sheet>
    </div>
  )
}
