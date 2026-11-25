import { useEffect, useState } from 'react'

const cache = {}
export function load(name) {
  if (!cache[name]) cache[name] = fetch(`./data/${name}`).then(r => { if (!r.ok) throw new Error(name); return r.json() })
  return cache[name]
}

let siap = null
export function useData() {
  const [state, setState] = useState(siap || { ready: false })
  useEffect(() => {
    if (siap) return
    Promise.all([load('kab.json'), load('kab.geojson'), load('tahunan.json'), load('dibi_senyar.json')])
      .then(([kab, geo, tahunan, senyar]) => {
        const byKode = Object.fromEntries(kab.map(k => [k.kode, k]))
        const featByKode = Object.fromEntries(geo.features.map(f => [String(f.properties.kode), f]))
        siap = { ready: true, kab, geo, tahunan, senyar, byKode, featByKode }
        setState(siap)
      })
      .catch(err => setState({ ready: false, error: String(err) }))
  }, [])
  return state
}
