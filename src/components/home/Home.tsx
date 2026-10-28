import { useEffect, useState } from 'react'
import { PlainMenu } from './PlainMenu'
import { TableHome } from './table/TableHome'
import type { Entry } from './table/Journal'
import { holdOnline } from '~/render/online'

// While the home is read, the next game's land is made: the seal pressed
// lands straight in the opening, as on OpenFront.
function useGameAhead() {
  useEffect(() => {
    const ready = () =>
      void import('~/render/client').then(({ prepareGame }) => prepareGame())
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(ready, { timeout: 2500 })
      return () => cancelIdleCallback(id)
    }
    const id = setTimeout(ready, 1000)
    return () => clearTimeout(id)
  }, [])
}

/**
 * The home, the game's table (table/TableHome.tsx); where no table can be
 * set (no WebGL), its menu alone (PlainMenu.tsx).
 */
export function Home({ entries }: Readonly<{ entries: Array<Entry> }>) {
  const [plain, setPlain] = useState(false)
  useGameAhead()
  // Back home, the last game online is let go of.
  useEffect(() => holdOnline(null), [])
  return plain ? (
    <PlainMenu />
  ) : (
    <TableHome entries={entries} onFail={() => setPlain(true)} />
  )
}
