import { useCallback, useEffect, useState } from 'react'

const KEY = 'tapak-profil-v2'
export const PERAN = [
  { id: 'warga', nama: 'Warga & relawan', jabatan: 'Pelapor lapangan', ikon: 'users',
    tugas: 'Mengirim laporan bergeotag, memantau siaga hujan di wilayahnya, dan membaca panduan evakuasi.',
    akses: ['Lapor kejadian', 'Siaga hujan', 'Panduan & kontak darurat'], demo: { nama: 'Rahmi Yusuf', wilayah: '1306', hp: '0812 0000 1306' } },
  { id: 'bpbd', nama: 'Petugas BPBD', jabatan: 'Verifikator & tanggap darurat', ikon: 'shield',
    tugas: 'Memverifikasi laporan masuk, memantau peta dampak, dan memutar ulang jejak Senyar 2025.',
    akses: ['Antrean verifikasi', 'Peta dampak', 'Putar ulang Senyar'], demo: { nama: 'Fadli Harahap', wilayah: '1201', hp: '0813 0000 1201' } },
  { id: 'r3p', nama: 'Perencana R3P', jabatan: 'Bappeda / BNPB', ikon: 'sliders',
    tugas: 'Menyusun urutan pemulihan dengan bobot yang dapat diubah dan melihat stabilitas peringkat.',
    akses: ['Prioritas R3P', 'Peta prioritas', 'Ekspor CSV'], demo: { nama: 'Dina Lubis', wilayah: '1371', hp: '0811 0000 1371' } },
  { id: 'das', nama: 'Pengelola DAS', jabatan: 'BPDAS / KPH', ikon: 'tree',
    tugas: 'Menelusuri dari hulu mana tekanan lahan berasal dan menandai lereng curam yang perlu dipulihkan.',
    akses: ['Rantai hulu–hilir', 'Peta tekanan hulu', 'Erosi RUSLE'], demo: { nama: 'Teuku Akbar', wilayah: '1111', hp: '0852 0000 1111' } }
]
export const peranDari = p => PERAN.find(r => r.id === p?.peran) || PERAN[0]

const baca = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null } }
let dengar = []
export function useProfil() {
  const [profil, setProfil] = useState(baca)
  useEffect(() => {
    const f = () => setProfil(baca())
    dengar.push(f)
    return () => { dengar = dengar.filter(x => x !== f) }
  }, [])
  const simpan = useCallback(p => { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* mode privat */ } dengar.forEach(f => f()) }, [])
  const keluar = useCallback(() => { try { localStorage.removeItem(KEY) } catch { /* abaikan */ } dengar.forEach(f => f()) }, [])
  return [profil, simpan, keluar]
}
export const inisial = n => (n || 'Tamu').split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('')
export const sapaan = () => { const h = new Date().getHours(); return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam' }
