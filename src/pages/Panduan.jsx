import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Kepala, Seg, Masuk as Muncul } from '../components/ui.jsx'
import { go } from '../lib/router.js'

const KONTAK = [['112', 'Darurat terpadu'], ['117', 'Pusdalops BNPB'], ['115', 'Basarnas'], ['119', 'Ambulans / PSC']]
const TANDA = [
  ['wave', 'river', 'Air sungai mendadak keruh dan naik cepat', 'Sering disertai potongan kayu dan lumpur dari hulu.'],
  ['alert', 'amber', 'Gemuruh dari arah hulu atau lereng', 'Tanda aliran debris atau longsoran sedang bergerak.'],
  ['mountain', 'soil', 'Retakan baru di tanah atau dinding', 'Juga pohon/tiang miring dan mata air baru di lereng.'],
  ['rain', 'river', 'Hujan lebat lebih dari 2–3 jam', 'Terutama bila hulu gundul dan tanah sudah jenuh.']
]
const TAS = ['Dokumen penting dalam plastik kedap air', 'Air minum dan makanan siap santap untuk 3 hari', 'Obat-obatan pribadi dan kotak P3K', 'Senter, baterai cadangan, dan power bank', 'Pakaian ganti, selimut, dan jas hujan', 'Peluit untuk memberi tanda', 'Uang tunai secukupnya', 'Masker dan perlengkapan kebersihan']
const LANGKAH = {
  sebelum: ['Kenali jalur evakuasi dan titik kumpul terdekat di desa atau kelurahan.', 'Siapkan tas siaga dan simpan di dekat pintu.', 'Pantau menu Siaga hujan; perhatikan bila wilayah hulu Anda tertekan.', 'Bersihkan saluran air dan jangan membuang sampah ke sungai.'],
  saat: ['Segera menjauh dari bantaran sungai dan kaki lereng menuju tempat tinggi.', 'Jangan menyeberangi arus: 15 cm air deras dapat menjatuhkan orang dewasa.', 'Matikan listrik dari sakelar utama bila aman.', 'Bantu lansia, anak, dan penyandang disabilitas lebih dulu.', 'Laporkan dari tempat aman lewat tombol Lapor.'],
  sesudah: ['Kembali hanya setelah dinyatakan aman oleh petugas.', 'Waspadai longsor susulan; jangan mendekati tebing yang retak.', 'Rebus air minum dan bersihkan rumah dengan sarung tangan dan sepatu bot.', 'Catat dan foto kerusakan untuk pendataan bantuan R3P.']
}
const KUNCI = 'sigap-tas-v1'
const baca = () => { try { return JSON.parse(localStorage.getItem(KUNCI) || '[]') } catch { return [] } }

export default function Panduan() {
  const [fase, setFase] = useState('saat')
  const [cek, setCek] = useState(baca)
  const ubah = i => { const n = cek.includes(i) ? cek.filter(x => x !== i) : [...cek, i]; setCek(n); try { localStorage.setItem(KUNCI, JSON.stringify(n)) } catch { /* abaikan */ } }

  return (
    <div className="halaman">
      <Kepala judul="Panduan darurat" sub="Kontak, tanda bahaya, dan langkah aman" />
      <div className="tumpuk">
        <Muncul>
          <div className="darurat">
            {KONTAK.map(([n, l]) => <a key={n} href={`tel:${n}`}><b>{n}</b><small>{l}</small></a>)}
          </div>
        </Muncul>
        <button className="btn btn-lime btn-penuh" onClick={() => go('lapor')}><Icon n="camera" s={18} /> Lapor kejadian dari lokasi aman</button>

        <div className="sub-j">Tanda bahaya</div>
        <div className="grup">
          {TANDA.map(([ik, w, j, s]) => (
            <div key={j} className="baris" style={{ cursor: 'default' }}>
              <span className={`baris-i t-${w}`}><Icon n={ik} s={20} /></span>
              <span className="baris-t"><b>{j}</b><small>{s}</small></span>
            </div>
          ))}
        </div>

        <div className="kartu">
          <div className="kartu-j"><h3>Langkah aman</h3></div>
          <Seg id="fase" value={fase} onChange={setFase} items={[['sebelum', 'Sebelum'], ['saat', 'Saat'], ['sesudah', 'Sesudah']]} />
          <ol style={{ margin: '12px 0 0', paddingLeft: 20, display: 'grid', gap: 8 }} className="teks">
            {LANGKAH[fase].map(x => <li key={x}>{x}</li>)}
          </ol>
        </div>

        <div className="kartu">
          <div className="kartu-j"><h3>Tas siaga</h3><span className="catatan">{cek.length}/{TAS.length} siap</span></div>
          <div className="bar-h" style={{ marginBottom: 6 }}><i style={{ width: `${(cek.length / TAS.length) * 100}%`, background: 'var(--em-500)' }} /></div>
          {TAS.map((t, i) => (
            <button key={t} className={`centang ${cek.includes(i) ? 'on' : ''}`} onClick={() => ubah(i)}>
              <i><Icon n="check" s={14} w={3} /></i><span>{t}</span>
            </button>
          ))}
        </div>
        <p className="catatan">Panduan ringkas disusun dari materi kesiapsiagaan umum banjir dan longsor. Ikuti arahan petugas BPBD setempat.</p>
      </div>
    </div>
  )
}
