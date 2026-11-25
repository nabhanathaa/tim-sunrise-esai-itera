import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Icon from '../components/Icon.jsx'
import { APP } from '../config.js'
import { jawab, SARAN_AWAL } from '../lib/tanya.js'
import { go, back } from '../lib/router.js'

const tebal = s => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p)

export default function Tanya({ data, profil }) {
  const [pesan, setPesan] = useState(() => [{ dari: 'bot', teks: `Halo, ${profil.nama.split(' ')[0]}. Saya asisten ${APP.nama}. Tanyakan risiko suatu wilayah, hujan, prioritas pemulihan, asal tekanan hulu, atau cara melapor.`, saran: SARAN_AWAL }])
  const [teks, setTeks] = useState('')
  const [ketik, setKetik] = useState(false)
  const isi = useRef(null)

  useEffect(() => { isi.current?.scrollTo({ top: isi.current.scrollHeight, behavior: 'smooth' }) }, [pesan, ketik])

  const kirim = async q => {
    const t = (q ?? teks).trim(); if (!t || ketik) return
    setTeks(''); setPesan(p => [...p, { dari: 'saya', teks: t }]); setKetik(true)
    const [j] = await Promise.all([jawab(t, { data, profil }), new Promise(r => setTimeout(r, 650))])
    setKetik(false); setPesan(p => [...p, { dari: 'bot', ...j }])
  }
  const saranAkhir = [...pesan].reverse().find(p => p.saran)?.saran

  return (
    <div className="chat">
      <div className="chat-kepala">
        <button className="ib" onClick={back} aria-label="Kembali"><Icon n="left" /></button>
        <span className="chat-ava"><Icon n="chat" s={20} /></span>
        <div style={{ flex: 1, minWidth: 0 }}><b>Tanya {APP.nama}</b><small>Menjawab dari data aplikasi · bekerja luring</small></div>
      </div>
      <div className="chat-isi" ref={isi}>
        <AnimatePresence initial={false}>
          {pesan.map((p, i) => (
            <motion.div key={i} className={`pesan ${p.dari}`} initial={{ opacity: 0, y: 10, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .25 }}>
              {tebal(p.teks)}
              {p.daftar && (
                <div className="p-kartu">
                  {p.daftar.map((d, j) => d.tel ? (
                    <a key={j} className="p-item" href={`tel:${d.tel}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <span className="n" style={{ color: 'var(--red)' }}><Icon n="phone" s={15} /></span><span>{d.l}</span><em style={{ color: 'var(--red)', fontSize: 14 }}>{d.v}</em>
                    </a>
                  ) : (
                    <button key={j} className="p-item" onClick={() => d.ke && go(...d.ke.split('/'))}>
                      <span className="n">{d.n}</span><span>{d.l}</span><em>{d.v}</em>
                    </button>
                  ))}
                </div>
              )}
              {p.teks2 && <div style={{ marginTop: 8 }}>{p.teks2}</div>}
              {p.aksi && (
                <div className="p-aksi">
                  {p.aksi.map(([l, ke, q]) => <button key={l} onClick={() => (q ? kirim(q) : go(...ke.split('/')))}>{l}<Icon n="right" s={14} /></button>)}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {ketik && <div className="pesan bot mengetik" aria-label="Sedang mengetik"><i /><i /><i /></div>}
      </div>
      {saranAkhir && (
        <div className="saran">{saranAkhir.map(s => <button key={s} onClick={() => kirim(s === 'Hujan di wilayah saya' ? 'hujan' : s)}>{s}</button>)}</div>
      )}
      <form className="chat-input" onSubmit={e => { e.preventDefault(); kirim() }}>
        <input value={teks} onChange={e => setTeks(e.target.value)} placeholder="Tanya tentang wilayah, hujan, prioritas…" aria-label="Pertanyaan" />
        <button type="submit" aria-label="Kirim"><Icon n="send" s={20} /></button>
      </form>
    </div>
  )
}
