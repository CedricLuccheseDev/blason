import { useEffect, useRef, useState } from 'react'
import { whenIdle } from './idle'
import type { Land } from '../../../engine'

// The home's one land (« y'a qu'une map et la section montre la map au
// centre par rapport à sa position, pour faire une continuité »): the public
// game's land drawn once over the whole screen, held still behind the page,
// blurred and washed into the parchment; the card of the game a window on it
// (LandPlate's `through`), the very part under the card, sharp. Drawn anew
// for a new seed and when the screen changes size.

/** The land drawn, and the seed it was drawn from: what a window copies. */
export type Drawn = { canvas: HTMLCanvasElement; seed: string }

/** The land behind, out of focus: Cédric's own ask (« le reste de la terre flouté derrière »), the card alone sharp. */
const BEHIND = 'size-full blur-[9px] saturate-[0.85]' // norm-ok: the home's land behind its card, out of focus by design (31/10).

/** Ms the screen is left to settle before the land is drawn at its new size. */
const SETTLE = 250

export function HomeLand({
  seed,
  land,
  onDrawn,
}: Readonly<{
  seed: string | null
  land: Land
  onDrawn: (drawn: Drawn) => void
}>) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const landKey = land.kind === 'real' ? land.map : land.size
  const [shown, setShown] = useState<string | null>(null)

  useEffect(() => {
    const element = canvas.current
    if (!seed || !element) return
    let live = true
    let stop = () => {}
    let settling: ReturnType<typeof setTimeout> | undefined
    const draw = () => {
      stop()
      void import('~/render/sketch').then(({ sketchGame }) => {
        if (!live) return
        stop = whenIdle(() => {
          sketchGame(element, seed, land)
          setShown(seed)
          onDrawn({ canvas: element, seed })
        }, 1000)
      })
    }
    const resized = () => {
      clearTimeout(settling)
      settling = setTimeout(draw, SETTLE)
    }
    draw()
    window.addEventListener('resize', resized)
    return () => {
      live = false
      stop()
      clearTimeout(settling)
      window.removeEventListener('resize', resized)
    }
  }, [seed, landKey])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0">
      <canvas
        ref={canvas}
        className={`${BEHIND} transition-opacity duration-(--duration-hud-enter) ease-hud motion-reduce:transition-none ${shown === seed ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* The parchment over it, so that the words read on the page. */}
      <div className="absolute inset-0 bg-vellum/45" />
    </div>
  )
}
