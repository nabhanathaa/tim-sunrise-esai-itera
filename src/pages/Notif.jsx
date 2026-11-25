import { useEffect } from 'react'
import Icon from '../components/Icon.jsx'
import { Kepala, Masuk as Muncul } from '../components/ui.jsx'
import { bacaNotif, untukSaya } from '../lib/store.js'
import { relatif } from '../lib/format.js'
import { go } from '../lib/router.js'

export default function Notif({ profil, store }) {
  const daftar = store.notif.filter(n => untukSaya(n, profil))
  useEffect(() => { const t = setTimeout(() => bacaNotif(profil), 1200); return () => clearTimeout(t) }, []) // eslint-disable-line
  return (
    <div className="halaman">
      <Kepala judul="Notifikasi" sub={`${daftar.filter(n => !n.dibaca).length} belum dibaca`} />
      <div className="tumpuk">
        {daftar.length ? (
          <div className="grup">
            {daftar.map((n, i) => (
              <Muncul key={n.id} i={i}>
                <button className={`baris ${n.dibaca ? '' : 'aksen-em'}`} onClick={() => go(n.ke === 'verifikasi' ? 'laporan' : n.lapId ? `laporan/${n.lapId}` : 'beranda')}>
                  <span className={`baris-i ${n.dibaca ? 't-ink' : 't-em'}`}><Icon n={n.peran === 'bpbd' ? 'shieldCheck' : 'bell'} s={20} /></span>
                  <span className="baris-t"><b>{n.judul}</b><small>{n.isi}</small><small style={{ color: 'var(--ink-4)' }}>{relatif(n.waktu)}</small></span>
                </button>
              </Muncul>
            ))}
          </div>
        ) : (
          <div className="kartu" style={{ textAlign: 'center', padding: 30 }}>
            <Icon n="bell" s={30} className="t-em" />
            <p className="teks" style={{ marginTop: 8 }}>Belum ada notifikasi. Status laporan dan antrean verifikasi akan muncul di sini.</p>
          </div>
        )}
        <p className="catatan">Buka aplikasi di dua tab (misalnya sebagai warga dan sebagai petugas BPBD) untuk melihat notifikasi berpindah langsung.</p>
      </div>
    </div>
  )
}
