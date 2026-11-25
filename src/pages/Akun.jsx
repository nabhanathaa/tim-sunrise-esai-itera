import { useEffect, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Baris, Kepala, Kontur, PilihKab, Sheet, Masuk as Muncul } from '../components/ui.jsx'
import { APP } from '../config.js'
import { PERAN, inisial, useProfil } from '../lib/profil.js'
import { hapusSemua, untukSaya } from '../lib/store.js'
import { nm } from '../lib/format.js'
import { go } from '../lib/router.js'

let promptPasang = null
if (typeof window !== 'undefined') addEventListener('beforeinstallprompt', e => { e.preventDefault(); promptPasang = e })

export default function Akun({ data, profil, peran, store }) {
  const [, simpan, keluar] = useProfil()
  const [pilih, setPilih] = useState(false)
  const [otp, setOtp] = useState(false)
  const [kode, setKode] = useState('')
  const [hp, setHp] = useState(profil.hp || '')
  const [hapus, setHapus] = useState(false)
  const [bisaPasang, setBisaPasang] = useState(!!promptPasang)
  useEffect(() => { const f = () => setBisaPasang(true); addEventListener('beforeinstallprompt', f); return () => removeEventListener('beforeinstallprompt', f) }, [])
  const nNotif = store.notif.filter(n => !n.dibaca && untukSaya(n, profil)).length
  const milik = store.laporan.filter(l => profil.hp && l.pelapor?.hp === profil.hp).length
  const k = profil.wilayah ? data.byKode[profil.wilayah] : null

  return (
    <div className="halaman">
      <Kepala judul="Akun" sub="Profil, peran, dan pengaturan" kembali={false} />
      <div className="tumpuk">
        <Muncul>
          <div className="profil-k">
            <Kontur />
            <span className="avatar avatar-b" style={{ background: 'rgba(255,255,255,.1)' }}>{inisial(profil.nama)}</span>
            <div>
              <b>{profil.nama}</b>
              <small>{profil.instansi || peran.jabatan} · {k ? nm(k) : 'wilayah belum dipilih'}</small>
              <div className="tag-baris">
                <span className="l">{peran.nama}</span>
                <span>{profil.terverifikasi ? 'HP terverifikasi' : 'Belum terverifikasi'}</span>
                {profil.tamu && <span>Tamu</span>}
              </div>
            </div>
          </div>
        </Muncul>

        <Muncul i={1}>
          <div className="kartu">
            <div className="kartu-j"><h3>Ganti peran</h3><span className="catatan">beranda ikut berubah</span></div>
            <div className="ganti-peran">
              {PERAN.map(r => (
                <button key={r.id} className={profil.peran === r.id ? 'on' : ''} onClick={() => { simpan({ ...profil, peran: r.id }); go('beranda') }}>
                  <span><Icon n={r.ikon} s={19} /></span>{r.nama.split(' ')[0] === 'Petugas' ? 'BPBD' : r.nama.split(' ').slice(-1)[0].replace('relawan', 'Warga').replace('R3P', 'R3P')}
                </button>
              ))}
            </div>
            <p className="catatan" style={{ marginTop: 10 }}>{peran.tugas}</p>
          </div>
        </Muncul>

        <Muncul i={2}>
          <div className="grup">
            <Baris ikon="bell" warna="red" judul="Notifikasi" sub="Status laporan dan antrean verifikasi" kanan={nNotif ? <span className="pil red">{nNotif} baru</span> : undefined} onClick={() => go('notif')} />
            <Baris ikon="file" warna="amber" judul={peran.id === 'bpbd' ? 'Antrean verifikasi' : 'Laporan saya'} sub={peran.id === 'bpbd' ? `${store.laporan.filter(l => l.status === 'menunggu').length} menunggu` : `${milik} laporan`} onClick={() => go('laporan')} />
            <Baris ikon="pin" warna="em" judul="Wilayah" sub={k ? `${nm(k)}, ${k.prov}` : 'Belum dipilih'} onClick={() => setPilih(true)} />
            {!profil.terverifikasi && <Baris ikon="shieldCheck" warna="em" judul="Verifikasi nomor HP" sub="Menambah 20 poin skor kepercayaan laporan" onClick={() => setOtp(true)} />}
          </div>
        </Muncul>

        <Muncul i={3}>
          <div className="grup">
            <Baris ikon="sliders" judul="Prioritas R3P" sub="Bobot kriteria dan ekspor CSV" onClick={() => go('prioritas')} />
            <Baris ikon="tree" warna="soil" judul="Rantai hulu–hilir" sub="Asal tekanan lahan per wilayah" onClick={() => go('hulu', profil.wilayah || '1111')} />
            <Baris ikon="play" warna="red" judul="Putar ulang Senyar 2025" sub="Animasi kejadian harian" onClick={() => go('putar')} />
            <Baris ikon="chat" judul={`Tanya ${APP.nama}`} sub="Asisten data dan panduan" onClick={() => go('tanya')} />
            <Baris ikon="siren" warna="red" judul="Panduan & kontak darurat" sub="Tanda bahaya, tas siaga, langkah aman" onClick={() => go('panduan')} />
            <Baris ikon="book" warna="river" judul="Metode & sumber data" sub="Rumus, asumsi, keterbatasan" onClick={() => go('metode')} />
          </div>
        </Muncul>

        <Muncul i={4}>
          <div className="grup">
            {bisaPasang && <Baris ikon="download" warna="em" judul="Pasang ke layar utama" sub="Bekerja luring seperti aplikasi" onClick={async () => { await promptPasang?.prompt(); promptPasang = null; setBisaPasang(false) }} />}
            <Baris ikon="trash" warna="amber" judul="Hapus data contoh & laporan" sub="Mengosongkan laporan dan notifikasi di perangkat ini" onClick={() => setHapus(true)} />
            <Baris ikon="logout" warna="red" judul="Keluar" sub="Kembali ke layar masuk" onClick={() => { keluar(); go('beranda') }} />
          </div>
        </Muncul>
        <p className="catatan" style={{ textAlign: 'center' }}>{APP.nama} · {APP.kepanjangan}<br />{APP.tim} · {APP.acara}</p>
      </div>

      <PilihKab kab={data.kab} value={profil.wilayah} onPick={v => simpan({ ...profil, wilayah: v })} buka={pilih} tutup={() => setPilih(false)} />
      <Sheet buka={otp} tutup={() => setOtp(false)} judul="Verifikasi nomor HP">
        <div className="tumpuk">
          <label className="field"><span>Nomor HP</span><input value={hp} onChange={e => setHp(e.target.value)} inputMode="tel" placeholder="08xx xxxx xxxx" /></label>
          <label className="field"><span>Kode verifikasi</span><input value={kode} onChange={e => setKode(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="4 digit" className="mono" /></label>
          <div className="info info-amber"><Icon n="info" s={18} /><span><b>Prototipe:</b> SMS belum tersambung; kode uji coba <b className="mono">2025</b>.</span></div>
          <button className="btn btn-em btn-penuh" disabled={kode !== '2025' || hp.replace(/\D/g, '').length < 10} onClick={() => { simpan({ ...profil, hp: hp.trim(), terverifikasi: true }); setOtp(false) }}>Verifikasi</button>
        </div>
      </Sheet>
      <Sheet buka={hapus} tutup={() => setHapus(false)} judul="Hapus data di perangkat?">
        <div className="tumpuk">
          <p className="teks">Semua laporan (termasuk contoh), foto/video, dan notifikasi di perangkat ini akan dihapus. Data analisis tidak terpengaruh.</p>
          <div className="dua"><button className="btn btn-garis" onClick={() => setHapus(false)}>Batal</button><button className="btn btn-merah" onClick={() => { hapusSemua(); setHapus(false) }}>Hapus</button></div>
        </div>
      </Sheet>
    </div>
  )
}
