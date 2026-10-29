import { useEffect, useRef, useState } from 'react'
import { whenIdle } from './idle'
import type { GameHandle } from '~/render/client'
import { PLAYERS } from '~/render/palette'
import { useMessages } from '~/i18n'

// The game behind the home: twenty bots playing a land drawn anew, watched
// by the director's camera (render/director.ts), drawn by the game's own
// renderer straight into the page's background. It starts once the menu is
// painted and the browser is idle, so the menu never waits for it. Its land
// is its own: the one made ahead is kept for the player's game.

const NO_ROOM = { left: 0, bottom: 0 }

/** Whether this browser draws with WebGL: without it, the game would be drawn by the CPU, too slow behind a menu. */
function webgl(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    // The test's context is given back at once: a page has only a few.
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return gl !== null
  } catch {
    return false
  }
}

export function useSpectator() {
  const m = useMessages()
  const host = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const element = host.current
    if (!element || !webgl()) return
    let handle: GameHandle | undefined
    let cancelled = false
    // Read through a call: the game may be called off while any await runs.
    const off = () => cancelled
    const start = () =>
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
            setShown(true)
          }
        })
        // No WebGL: the parchment stays behind the menu.
        .catch(() => undefined)
    const stop = whenIdle(start, 1500)
    return () => {
      cancelled = true
      stop()
      handle?.destroy()
    }
  }, [])

  return { host, shown }
}
