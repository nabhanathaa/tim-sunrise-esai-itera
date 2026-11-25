// TOPSIS identik dengan notebook (bagian 12): normalisasi skor z (ddof = 0),
// bobot dinormalisasi, jarak Euclid ke solusi ideal dan anti-ideal.
export const KRITERIA = [
  { key: 'bahaya', label: 'Peluang dampak berat (model)', arah: 'benefit', bobot: 3, ket: 'Rata-rata peluang XGBoost dan regresi logistik untuk 2025' },
  { key: 'hulu_frak', label: 'Tekanan lahan hulu', arah: 'benefit', bobot: 1, ket: 'Persentase DAS hulu yang kehilangan hutan di lereng curam 2015–2025' },
  { key: 'penduduk', label: 'Eksposur penduduk', arah: 'benefit', bobot: 2, ket: 'Jumlah penduduk 2025 (BPS)' },
  { key: 'p0', label: 'Kemiskinan', arah: 'benefit', bobot: 1, ket: 'Persentase penduduk miskin (BPS)' },
  { key: 'ipm', label: 'IPM rendah', arah: 'cost', bobot: 1, ket: 'Indeks pembangunan manusia; makin rendah makin prioritas' },
  { key: 'rs', label: 'Rumah sakit terbatas', arah: 'cost', bobot: 1, ket: 'Rumah sakit per 100 ribu penduduk' },
  { key: 'pusk', label: 'Puskesmas terbatas', arah: 'cost', bobot: 1, ket: 'Puskesmas per 100 ribu penduduk' },
  { key: 'jalan', label: 'Jalan jarang', arah: 'cost', bobot: 1, ket: 'Panjang jalan per km² (OpenStreetMap)' }
]

export const PRESET = {
  dasar: { label: 'Esai', w: [3, 1, 2, 1, 1, 1, 1, 1] },
  setara: { label: 'Setara', w: [1, 1, 1, 1, 1, 1, 1, 1] },
  hulu: { label: 'Hulu', w: [2, 4, 1, 1, 1, 1, 1, 1] },
  layanan: { label: 'Layanan', w: [2, 1, 1, 1, 1, 3, 3, 3] },
  sosial: { label: 'Kerentanan', w: [2, 1, 2, 3, 3, 1, 1, 1] }
}

export function topsis(rows, weights) {
  const n = rows.length, m = KRITERIA.length
  const sw = weights.reduce((a, b) => a + b, 0) || 1
  const W = weights.map(w => w / sw)
  const V = rows.map(() => new Array(m))
  for (let j = 0; j < m; j++) {
    const col = rows.map(r => +r[KRITERIA[j].key])
    const mean = col.reduce((a, b) => a + b, 0) / n
    const sd = Math.sqrt(col.reduce((a, b) => a + (b - mean) ** 2, 0) / n) || 1
    for (let i = 0; i < n; i++) V[i][j] = W[j] * (col[i] - mean) / sd
  }
  const ideal = [], anti = []
  for (let j = 0; j < m; j++) {
    const c = V.map(v => v[j]); const mx = Math.max(...c), mn = Math.min(...c)
    const ben = KRITERIA[j].arah === 'benefit'
    ideal[j] = ben ? mx : mn; anti[j] = ben ? mn : mx
  }
  const skor = V.map(v => {
    let dp = 0, dm = 0
    for (let j = 0; j < m; j++) { dp += (v[j] - ideal[j]) ** 2; dm += (v[j] - anti[j]) ** 2 }
    dp = Math.sqrt(dp); dm = Math.sqrt(dm)
    return dm / (dp + dm)
  })
  const order = skor.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0])
  const rank = new Array(n); order.forEach(([, i], r) => { rank[i] = r + 1 })
  return rows.map((r, i) => ({ kode: r.kode, skor: skor[i], rank: rank[i] }))
}

export function spearman(a, b) {
  // korelasi peringkat dengan penanganan nilai kembar (peringkat rata-rata), sama dengan scipy.stats.spearmanr
  const rk = x => {
    const o = x.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const r = new Array(x.length)
    for (let i = 0; i < o.length;) { let j = i; while (j + 1 < o.length && o[j + 1][0] === o[i][0]) j++; const avg = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[o[k][1]] = avg; i = j + 1 }
    return r
  }
  const ra = rk(a), rb = rk(b), n = a.length
  const ma = ra.reduce((s, v) => s + v, 0) / n, mb = rb.reduce((s, v) => s + v, 0) / n
  let num = 0, da = 0, db = 0
  for (let i = 0; i < n; i++) { num += (ra[i] - ma) * (rb[i] - mb); da += (ra[i] - ma) ** 2; db += (rb[i] - mb) ** 2 }
  return num / Math.sqrt(da * db)
}
