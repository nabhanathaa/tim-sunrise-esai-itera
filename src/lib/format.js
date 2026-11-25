const id = new Intl.NumberFormat('id-ID')
export const fmt = (v, d = 0) => v == null || Number.isNaN(v) ? '–' : new Intl.NumberFormat('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)
export const fmtInt = v => v == null ? '–' : id.format(Math.round(v))
export const pct = (v, d = 1) => v == null ? '–' : `${fmt(v * 100, d)}%`
export const compact = v => v == null ? '–' : v >= 1e6 ? `${fmt(v / 1e6, 1)} jt` : v >= 1e4 ? `${fmt(v / 1e3, 1)} rb` : fmtInt(v)
export const nm = k => k ? `${k.jenis === 'Kota' ? 'Kota ' : ''}${k.nama}` : '–'
export const nmPanjang = k => k ? `${k.jenis === 'Kota' ? 'Kota' : 'Kab.'} ${k.nama}` : '–'
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const HR = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export const tglPendek = d => { const x = new Date(d); return `${x.getDate()} ${BLN[x.getMonth()]}` }
export const tglHari = d => { const x = new Date(d); return `${HR[x.getDay()]}, ${x.getDate()} ${BLN[x.getMonth()]}` }
export const jam = d => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
export function relatif(t) {
  const s = (Date.now() - new Date(t)) / 1000
  if (s < 60) return 'baru saja'
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`
  return `${Math.floor(s / 86400)} hari lalu`
}
export const ukuran = b => b > 1e6 ? `${fmt(b / 1e6, 1)} MB` : `${fmt(b / 1e3, 0)} KB`
