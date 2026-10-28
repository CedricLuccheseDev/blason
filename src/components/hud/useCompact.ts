import { useEffect, useState } from 'react'

// Whether the screen is a phone's, held upright or sideways: narrower than
// Tailwind's sm step, or lower than a phone on its side. There the HUD's
// pieces change shape, not only size (a compact bar, the cartouche above it),
// so that the map keeps the room it needs either way.

const COMPACT = '(max-width: 639px), (max-height: 499px)'

export function useCompact(): boolean {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const query = window.matchMedia(COMPACT)
    const update = () => setCompact(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return compact
}
