import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { Pick, TableHandle, Variant } from '~/table'
import { faces } from '~/render/faces'
import { useMessages } from '~/i18n'

// The table in its frame: Three.js loaded only here, on the home, and the
// table set once the faces its canvases write with are there. A table that
// cannot be set (no WebGL) says so, and the home stands as a plain menu.

/** The player's colour: Azure, the first seat's. */
const COLOUR: [string, number] = ['#2f6db5', 0x2f6db5]

export function useTable(
  frame: RefObject<HTMLDivElement | null>,
  overlay: RefObject<HTMLDivElement | null>,
  variant: Variant | null,
  on: { pick: (p: Pick | null) => void; fail: () => void },
) {
  const t = useMessages().table
  const handle = useRef<TableHandle | null>(null)
  const [ready, setReady] = useState(false)
  const said = useRef(on)
  said.current = on

  useEffect(() => {
    const [f, o] = [frame.current, overlay.current]
    if (!f || !o || !variant) return
    let made: TableHandle | undefined
    let cancelled = false
    const off = () => cancelled
    import('~/table')
      .then(async ({ mountTable }) => {
        await faces()
        if (off()) return
        const words = { name: t.name, line: t.line, mark: t.name.toUpperCase() }
        const table = await mountTable(f, o, {
          variant,
          words,
          colour: COLOUR,
          onPick: (p) => said.current.pick(p),
        })
        if (off()) return table.destroy()
        made = table
        handle.current = table
        setReady(true)
      })
      .catch(() => {
        if (!off()) said.current.fail()
      })
    return () => {
      cancelled = true
      made?.destroy()
      handle.current = null
      setReady(false)
    }
  }, [variant])

  return { handle, ready }
}
