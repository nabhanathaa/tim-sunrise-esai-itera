import { useEffect, useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom'
import { select } from 'd3-selection'
import 'd3-transition'
import Icon from './Icon.jsx'

const W = 400
const cacheProj = { datar: new WeakMap(), tegak: new WeakMap() }
// Mode tegak: bidang peta diputar 40° agar Sumatera mengisi layar HP yang tinggi (skala ±27% lebih besar)
function proyeksi(geo, tegak) {
  const c = cacheProj[tegak ? 'tegak' : 'datar']
  if (c.has(geo)) return c.get(geo)
  const H = tegak ? 680 : 430
  const projection = geoMercator().angle(tegak ? -40 : 0).fitExtent([[10, 10], [W - 10, H - 10]], geo)
  const path = geoPath(projection)
  const shapes = geo.features.map(f => {
    const c = path.centroid(f)
    return { kode: String(f.properties.kode), d: path(f), c, b: path.bounds(f) }
  })
  const minY = Math.min(...shapes.map(s => s.c[1])), maxY = Math.max(...shapes.map(s => s.c[1]))
  shapes.forEach(s => { s.delay = ((s.c[1] - minY) / (maxY - minY)) * 0.9 })
  const a = projection([101, 0]), b = projection([101, 1])
  const utara = Math.atan2(b[0] - a[0], a[1] - b[1]) * 180 / Math.PI
  const out = { projection, path, shapes, H, utara, byKode: Object.fromEntries(shapes.map(s => [s.kode, s])) }
  c.set(geo, out)
  return out
}

/**
 * Peta vektor Sumatera 154 kab/kota: geser, cubit-perbesar, ketuk untuk memilih.
 * Berjalan luring (tanpa ubin peta), warna per kab/kota dari fungsi fill(kode).
 */
export default function Peta({ tegak = false, geo, fill, selected, onSelect, dark = true, dim, focus, pins, overlay, tools = true, className = '', ariaLabel = 'Peta kabupaten/kota Sumatera', intro = true }) {
  const svgRef = useRef(null), gRef = useRef(null), zRef = useRef(null)
  const [k, setK] = useState(1)
  const { projection, shapes, byKode, H, utara } = useMemo(() => proyeksi(geo, tegak), [geo, tegak])

  useEffect(() => {
    const svg = select(svgRef.current)
    const z = d3zoom().scaleExtent([1, 14]).translateExtent([[-60, -60], [W + 60, H + 60]]).clickDistance(6)
      .on('zoom', ev => { select(gRef.current).attr('transform', ev.transform); setK(ev.transform.k) })
    svg.call(z).on('dblclick.zoom', null)
    zRef.current = z
    return () => svg.on('.zoom', null)
  }, [H])

  useEffect(() => {
    if (!zRef.current) return
    const svg = select(svgRef.current)
    if (!focus) return
    const s = byKode[String(focus).split('#')[0]]; if (!s) return
    const [[x0, y0], [x1, y1]] = s.b
    const sc = Math.max(2.2, Math.min(7, 0.38 / Math.max((x1 - x0) / W, (y1 - y0) / H)))
    const t = zoomIdentity.translate(W / 2, H * 0.42).scale(sc).translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
    svg.transition().duration(850).call(zRef.current.transform, t)
  }, [focus, byKode])

  const zoomBy = f => select(svgRef.current).transition().duration(300).call(zRef.current.scaleBy, f)
  const reset = () => select(svgRef.current).transition().duration(600).call(zRef.current.transform, zoomIdentity)

  return (
    <div className={`peta ${dark ? 'peta-gelap' : 'peta-terang'} ${className}`}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id={`grid-${dark ? 'g' : 't'}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke={dark ? 'rgba(150,230,200,.07)' : 'rgba(14,77,60,.06)'} strokeWidth=".6" />
          </pattern>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect x="-400" y="-400" width={W + 800} height={H + 800} fill={`url(#grid-${dark ? 'g' : 't'})`} />
        <g ref={gRef}>
          {shapes.map(s => (
            <path key={s.kode} d={s.d} className={`kab ${intro ? 'kab-in' : ''} ${selected === s.kode ? 'sel' : ''}`}
              style={{ fill: fill(s.kode), opacity: dim && dim(s.kode) ? 0.28 : 1, animationDelay: `${s.delay}s` }}
              vectorEffect="non-scaling-stroke"
              onClick={() => onSelect && onSelect(s.kode)} />
          ))}
          {selected && byKode[selected] && (
            <path d={byKode[selected].d} className="kab-sel-outline" vectorEffect="non-scaling-stroke" filter="url(#glow)" />
          )}
          {overlay && overlay({ projection, k, c: kode => byKode[kode]?.c })}
          {pins && pins.map(p => {
            const xy = projection([p.lon, p.lat]); if (!xy) return null
            return (
              <g key={p.id} transform={`translate(${xy[0]},${xy[1]}) scale(${1 / k})`} className="pin" onClick={e => { e.stopPropagation(); p.onClick && p.onClick() }}>
                {p.pulse && <circle r="14" className="pin-pulse" style={{ fill: p.warna }} />}
                <circle r={p.r || 6.5} fill={p.warna} stroke="#fff" strokeWidth="2" />
              </g>
            )
          })}
        </g>
      </svg>
      {tegak && (
        <div className="kompas" aria-label="Arah utara" title="Peta diputar agar Sumatera memenuhi layar">
          <svg width="34" height="34" viewBox="0 0 34 34" style={{ transform: `rotate(${utara}deg)` }}><path d="M17 4 22 18H12Z" fill="#C6F24E" /><path d="M17 30 22 18H12Z" fill="rgba(255,255,255,.25)" /></svg>
          <b>U</b>
        </div>
      )}
      {tools && (
        <div className="peta-tools">
          <button onClick={() => zoomBy(1.7)} aria-label="Perbesar"><Icon n="plus" s={17} /></button>
          <button onClick={() => zoomBy(1 / 1.7)} aria-label="Perkecil"><svg width="17" height="17" viewBox="0 0 24 24"><path d="M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></button>
          <button onClick={reset} aria-label="Tampilan awal"><Icon n="expand" s={16} /></button>
        </div>
      )}
    </div>
  )
}

export function Legenda({ judul, ramp, ticks, catatan }) {
  return (
    <div className="legenda">
      <div className="legenda-j">{judul}</div>
      <div className="legenda-bar" style={{ background: `linear-gradient(90deg, ${ramp.join(',')})` }} />
      <div className="legenda-t">{ticks.map((t, i) => <span key={i}>{t}</span>)}</div>
      {catatan && <div className="legenda-c">{catatan}</div>}
    </div>
  )
}
