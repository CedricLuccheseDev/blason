import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { TableHandle, Variant } from '~/table'
import { variantOf } from '~/table/sizes'

// The table's frame: its layout (a desk's or a phone's, by the screen's
// shape), the clock its countdowns read, and the dive into the board to
// watch its game.

/** The layout for this screen, once it is known (never on the server). */
export function useVariant(): Variant | null {
  const [variant, setVariant] = useState<Variant | null>(null)
  useEffect(() => {
    const measure = () =>
      setVariant(variantOf(window.innerWidth, window.innerHeight))
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  return variant
}

/** The time now, again every second while `ticking`. */
export function useNow(ticking: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!ticking) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [ticking])
  return now
}

/** Watching the board's game: the camera dives into the board, then the game takes the screen. */
export function useWatch(
  table: RefObject<TableHandle | null>,
  shown: boolean,
): [boolean, () => void, () => void] {
  const [watching, setWatching] = useState(false)
  const watch = () => {
    const handle = table.current
    if (!handle || !shown) return
    void handle.dive(true).then(() => {
      handle.pause(true)
      setWatching(true)
    })
  }
  const unwatch = () => {
    setWatching(false)
    table.current?.pause(false)
    void table.current?.dive(false)
  }
  return [watching, watch, unwatch]
}
