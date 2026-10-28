import { useEffect, useRef } from 'react'
import type { GameHandle } from '~/render/client'
import { PLAYERS } from '~/render/palette'
import { useMessages } from '~/i18n'

/**
 * Behind the home's menu, a game that twenty bots play on
 * a land drawn anew, watched by a directed camera (render/director.ts) that
 * keeps what it shows clear of the menu, `left` pixels wide. It is scenery:
 * it takes no pointer and says nothing to a screen reader.
 */
export function Spectacle({ left }: Readonly<{ left: () => number }>) {
  const m = useMessages()
  const host = useRef<HTMLDivElement>(null)
  // The latest measure of the menu, read by the camera every frame.
  const inset = useRef(left)
  inset.current = left

  useEffect(() => {
    const element = host.current
    if (!element) return
    let handle: GameHandle | undefined
    let cancelled = false
    void import('~/render/client')
      .then(async ({ mountGame, randomSeed }) => {
        // A land of its own: the one made ahead is kept for the player's game.
        const mounted = await mountGame(element, randomSeed(), -1, {
          onSummary: () => {},
          onAim: () => {},
          names: PLAYERS.map((p) => m.game.colors[p.key]),
          spectate: () => inset.current(),
        })
        if (cancelled) mounted.destroy()
        else handle = mounted
      })
      // Scenery that cannot start (no WebGL) leaves the menu standing alone.
      .catch(() => undefined)
    return () => {
      cancelled = true
      handle?.destroy()
    }
  }, [])

  return (
    <div
      ref={host}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-vellum"
    />
  )
}
