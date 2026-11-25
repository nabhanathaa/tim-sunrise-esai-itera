// Pembaca CSV sederhana yang menangani tanda kutip (format ekspor GEE).
export function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++ } else q = false } else f += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(f); f = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = '' }
    else f += c
  }
  if (f || row.length) { row.push(f); rows.push(row) }
  const [h, ...b] = rows.filter(r => r.length > 1)
  return b.map(r => Object.fromEntries(h.map((k, i) => [k, r[i]])))
}
