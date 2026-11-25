import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, animate, useInView } from 'motion/react'
import Icon from './Icon.jsx'
import { go, back } from '../lib/router.js'
import { nm } from '../lib/format.js'

export function AnimNum({ v, d = 0, durasi = 1.1, suffix = '' }) {
  const ref = useRef(null), seen = useInView(ref, { once: true })
  const [x, setX] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    if (!seen || v == null) return
    const c = animate(prev.current, v, { duration: durasi, ease: [0.16, 1, 0.3, 1], onUpdate: setX })
    prev.current = v
    return () => c.stop()
  }, [v, seen, durasi])
  return <span ref={ref} className="num">{new Intl.NumberFormat('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d }).format(x)}{suffix}</span>
}

export function Seg({ value, onChange, items, id, kecil }) {
  return (
    <div className={`seg ${kecil ? 'seg-s' : ''}`} role="tablist">
      {items.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={value === k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>
          {value === k && <motion.span layoutId={`seg-${id}`} className="seg-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
          <span className="seg-l">{label}</span>
        </button>
      ))}
    </div>
  )
}

export function Chips({ value, onChange, items }) {
  return (
    <div className="chips">
      {items.map(([k, label, n]) => (
        <button key={k} className={`chip ${value === k ? 'on' : ''}`} onClick={() => onChange(k)}>{label}{n != null && <b>{n}</b>}</button>
      ))}
    </div>
  )
}

export function Kepala({ judul, sub, kanan, kembali = true, gelap }) {
  return (
    <header className={`kepala ${gelap ? 'kepala-gelap' : ''}`}>
      {kembali && <button className={`ib ${gelap ? "ib-gelap" : ""}`} onClick={back} aria-label="Kembali"><Icon n="left" /></button>}
      <div className="kepala-t">
        <h1>{judul}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {kanan}
    </header>
  )
}

export function Sheet({ buka, tutup, children, judul, tinggi = '78%' }) {
  return (
    <AnimatePresence>
      {buka && (
        <>
          <motion.div className="sheet-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={tutup} />
          <motion.div className="sheet" style={{ maxHeight: tinggi }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }} drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(e, i) => { if (i.offset.y > 90 || i.velocity.y > 500) tutup() }}>
            <div className="sheet-grip" />
            {judul && <div className="sheet-j"><h3>{judul}</h3><button className="ib ib-s" onClick={tutup} aria-label="Tutup"><Icon n="x" s={18} /></button></div>}
            <div className="sheet-isi">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function PilihKab({ kab, value, onPick, buka, tutup, judul = 'Pilih kabupaten/kota' }) {
  const [q, setQ] = useState('')
  const hasil = useMemo(() => {
    const s = q.trim().toLowerCase()
    const l = s ? kab.filter(k => `${nm(k)} ${k.prov}`.toLowerCase().includes(s)) : kab
    return [...l].sort((a, b) => a.prov.localeCompare(b.prov) || a.nama.localeCompare(b.nama))
  }, [q, kab])
  return (
    <Sheet buka={buka} tutup={tutup} judul={judul} tinggi="86%">
      <div className="cari"><Icon n="search" s={18} /><input autoFocus placeholder="Cari nama atau provinsi" value={q} onChange={e => setQ(e.target.value)} /></div>
      <div className="daftar-kab">
        {hasil.map((k, i) => (
          <button key={k.kode} className={`baris-kab ${value === k.kode ? 'on' : ''}`} onClick={() => { onPick(k.kode); tutup() }}>
            {(i === 0 || hasil[i - 1].prov !== k.prov) && <span className="baris-prov">{k.prov}</span>}
            <span className="baris-n">{nm(k)}</span>
            {value === k.kode && <Icon n="check" s={18} />}
          </button>
        ))}
        {!hasil.length && <p className="kosong">Tidak ditemukan.</p>}
      </div>
    </Sheet>
  )
}

export function Tombol({ ke, ikon, label, sub, warna = 'em', badge }) {
  return (
    <button className="aksi" onClick={() => (typeof ke === 'function' ? ke() : go(...[].concat(ke)))}>
      <span className={`aksi-i t-${warna}`}><Icon n={ikon} s={22} />{badge ? <i className="badge">{badge}</i> : null}</span>
      <span className="aksi-l">{label}</span>
      {sub && <span className="aksi-s">{sub}</span>}
    </button>
  )
}

export function Baris({ ikon, warna = 'em', judul, sub, kanan, onClick, aksen }) {
  return (
    <button className={`baris ${aksen ? `aksen-${aksen}` : ''}`} onClick={onClick}>
      {ikon && <span className={`baris-i t-${warna}`}><Icon n={ikon} s={20} /></span>}
      <span className="baris-t"><b>{judul}</b>{sub && <small>{sub}</small>}</span>
      {kanan ?? <Icon n="right" s={18} className="baris-c" />}
    </button>
  )
}

export function Label({ jenis = 'model', children }) {
  const t = { resmi: 'DATA RESMI', model: 'HASIL MODEL', langsung: 'LANGSUNG', contoh: 'CONTOH', asumsi: 'ASUMSI' }
  return <span className={`lbl lbl-${jenis}`}>{children || t[jenis]}</span>
}

export function Batang({ data, tinggi = 120, warna = 'var(--river)', aktif, onPick, label, nilai }) {
  const max = Math.max(...data.map(d => d.v), 1)
  return (
    <div className="batang" style={{ height: tinggi }}>
      {data.map((d, i) => (
        <button key={i} className={`batang-k ${aktif === i ? 'on' : ''}`} onClick={() => onPick && onPick(i)} aria-label={`${d.l}: ${d.v}`}>
          <motion.span className="batang-b" style={{ background: d.warna || warna }} initial={{ height: 0 }} animate={{ height: `${Math.max(2, (d.v / max) * 100)}%` }} transition={{ delay: i * 0.03, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
          {label && <span className="batang-l">{d.l}</span>}
          {nilai && <span className="batang-v">{nilai(d.v)}</span>}
        </button>
      ))}
    </div>
  )
}

export function Masuk({ children, i = 0 }) {
  return <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>{children}</motion.div>
}

export function Kontur({ className = '' }) {
  // garis kontur dekoratif untuk kartu pahlawan (SVG, animasi aliran pelan)
  return (
    <svg className={`kontur ${className}`} viewBox="0 0 400 220" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M-20 ${40 + i * 22} C 80 ${10 + i * 22}, 160 ${90 + i * 18}, 250 ${48 + i * 22} S 380 ${20 + i * 24}, 430 ${60 + i * 20}`} style={{ animationDelay: `${i * -1.3}s` }} />
      ))}
    </svg>
  )
}
