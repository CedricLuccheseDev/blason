import { useEffect, useRef, useState } from 'react'
import type { GameHandle } from '~/render/client'
import { PLAYERS } from '~/render/palette'
import { useMessages } from '~/i18n'

// The game on the board: twenty bots playing a land drawn anew, watched by
// the director's camera (render/director.ts), drawn by the game's own
// renderer in a frame kept out of sight; the table reads its picture a few
// times a second. To watch it, the frame takes the whole screen, and the
// same game goes on. Its land is its own: the one made ahead is kept for the
// player's game.

const NO_ROOM = { left: 0, bottom: 0 }

export function useSpectator() {
  const m = useMessages()
  const host = useRef<HTMLDivElement>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const element = host.current
    if (!element) return
    let handle: GameHandle | undefined
    let cancelled = false
    // Read through a call: the game may be called off while any await runs.
    const off = () => cancelled
    void import('~/render/client')
      .then(async ({ faces, mountGame, randomSeed }) => {
        await faces()
        if (off()) return
        const mounted = await mountGame(element, randomSeed(), -1, {
          onSummary: () => {},
          onAim: () => {},
          names: PLAYERS.map((p) => m.game.colors[p.key]),
          spectate: () => NO_ROOM,
        })
        if (off()) mounted.destroy()
        else {
          handle = mounted
          setCanvas(element.querySelector('canvas'))
        }
      })
      // A board that cannot show its game keeps its blank parchment.
      .catch(() => undefined)
    return () => {
      cancelled = true
      handle?.destroy()
    }
  }, [])

  return { host, canvas }
}
