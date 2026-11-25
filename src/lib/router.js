import { useEffect, useState } from 'react'

const baca = () => (location.hash.replace(/^#\/?/, '') || 'beranda').split('/')
export function useRoute() {
  const [r, setR] = useState(baca)
  useEffect(() => {
    const f = () => setR(baca())
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  return r
}
export const go = (...p) => { location.hash = '/' + p.filter(x => x != null && x !== '').join('/') }
export const back = () => (history.length > 1 ? history.back() : go('beranda'))
