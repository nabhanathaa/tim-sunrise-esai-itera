// Ikon garis 24px (gaya konsisten, tanpa emoji)
const P = {
  home: 'M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9',
  map: 'M9 4 3 6.5v13.5L9 17.5l6 2.5 6-2.5V4l-6 2.5L9 4Zm0 0v13.5m6-11V20',
  plus: 'M12 5v14M5 12h14',
  rain: 'M7 15a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 18 8a3.5 3.5 0 0 1 0 7H7Zm1 3-1 2m5-2-1 2m5-2-1 2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0m1-9a3 3 0 1 0 0-6m2 15h3a5 5 0 0 0-4-5',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4a2 2 0 0 0 4 0',
  right: 'M9 6l6 6-6 6', left: 'M15 6l-6 6 6 6', down: 'M6 9l6 6 6-6', up: 'M6 15l6-6 6 6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4',
  layers: 'M12 3 3 8l9 5 9-5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5',
  x: 'M6 6l12 12M18 6 6 18',
  play: 'M8 5v14l11-7L8 5Z', pause: 'M8 5v14M16 5v14', reset: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4',
  locate: 'M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm0-4a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0-13v3m0 14v3M2 12h3m14 0h3',
  pin: 'M12 21s-7-6.2-7-12a7 7 0 1 1 14 0c0 5.8-7 12-7 12Zm0-9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4V8Zm8 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  video: 'M3 7h12v10H3V7Zm12 4 6-3.5v9L15 13',
  image: 'M4 5h16v14H4V5Zm0 11 5-5 4 4 2-2 5 5M15.5 9.5a1 1 0 1 0 0-.01',
  shield: 'M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6L12 3Z',
  shieldCheck: 'M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6L12 3Zm-3.5 9 2.5 2.5L16 9.5',
  check: 'M5 12.5 10 17 19 7', checkCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-4-9 3 3 5-6',
  alert: 'M12 4 2.5 20h19L12 4Zm0 6v4.5m0 2.5v.01',
  phone: 'M5 4h4l1.5 4.5L8 10a11 11 0 0 0 6 6l1.5-2.5L20 15v4a1.5 1.5 0 0 1-1.6 1.5C10.5 20 4 13.5 3.5 5.6A1.5 1.5 0 0 1 5 4Z',
  chat: 'M4 5h16v11H9l-5 4V5Zm4 5h.01M12 10h.01M16 10h.01',
  send: 'M4 12 20 4l-6 16-3-7-7-1Z',
  sliders: 'M4 6h9m4 0h3M4 12h3m4 0h9M4 18h11m4 0h1M15 4v4M9 10v4m8 2v4',
  mountain: 'M3 19 9.5 8l4 6.5 2.5-3.5L21 19H3Zm5.5-7.5 1.5 1.5 1.5-1.5',
  wave: 'M3 9c2 0 2-2 4.5-2S10 9 12 9s2.5-2 4.5-2S19 9 21 9M3 14c2 0 2-2 4.5-2s2.5 2 4.5 2 2.5-2 4.5-2 2.5 2 4.5 2M3 19c2 0 2-2 4.5-2s2.5 2 4.5 2 2.5-2 4.5-2 2.5 2 4.5 2',
  chart: 'M4 20V10m6 10V4m6 16v-7m4 7H3',
  file: 'M6 3h8l4 4v14H6V3Zm8 0v4h4M9 12h6m-6 4h6',
  book: 'M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2V5Zm0 15a2 2 0 0 0 2 2h13v-4',
  download: 'M12 4v11m-4-4 4 4 4-4M5 20h14',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v6m0-9v.01',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4.5l3 2',
  tree: 'M12 21v-5m0 0c-4 0-6.5-2.3-6.5-5 0-2 1.3-3.5 3-4A3.6 3.6 0 0 1 12 3a3.6 3.6 0 0 1 3.5 4c1.7.5 3 2 3 4 0 2.7-2.5 5-6.5 5Z',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 17h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7',
  drop: 'M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z',
  grid: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  filter: 'M4 5h16l-6 7.5V19l-4 1.5v-8L4 5Z',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5m11-5v5h-5',
  lock: 'M6 11h12v9H6v-9Zm2.5 0V8a3.5 3.5 0 0 1 7 0v3',
  mail: 'M4 6h16v12H4V6Zm0 0 8 6.5L20 6',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  trash: 'M5 7h14M10 4h4M7 7l1 13h8l1-13',
  refresh: 'M20 11a8 8 0 0 0-14.5-4.5M4 4v4h4m-4 5a8 8 0 0 0 14.5 4.5M20 20v-4h-4',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  flag: 'M5 21V4m0 0h11l-2 4 2 4H5',
  bag: 'M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2',
  siren: 'M7 18v-6a5 5 0 0 1 10 0v6M4 18h16v3H4v-3Zm8-15v2M4.5 6l1.5 1.5M19.5 6 18 7.5',
  wind: 'M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h7',
  thermo: 'M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0Z',
  spark: 'M4 17l5-5 4 3 7-8',
  pulse: 'M3 12h4l2.5-6 4 12L16 12h5',
  scale: 'M12 4v16M5 8h14M7 20h10M5 8l-2.5 6a3 3 0 0 0 5 0L5 8Zm14 0-2.5 6a3 3 0 0 0 5 0L19 8Z',
  share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  cpu: 'M7 7h10v10H7V7Zm3 3h4v4h-4v-4ZM9 3v4m6-4v4M9 17v4m6-4v4M3 9h4m-4 6h4m10-6h4m-4 6h4',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5-5 2 2-5 5-2Z'
}
export default function Icon({ n, s = 20, w = 1.8, className, style, fill }) {
  const d = P[n] || P.info
  const solid = n === 'play'
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={solid ? 'currentColor' : (fill || 'none')} stroke="currentColor"
      strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
      <path d={d} />
    </svg>
  )
}
