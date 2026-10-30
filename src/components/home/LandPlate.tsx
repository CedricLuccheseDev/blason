import { useEffect, useRef, useState } from 'react'
import { whenIdle } from './idle'
import type { ReactNode } from 'react'
import type { Land } from '../../../engine'
import { hex } from '~/components/game/format'
import { TONE } from '~/render/palette'

// The land of a game to come, as its card shows it: drawn from its seed
// once the browser has a moment (render/sketch.ts), the very land the game
// will have. A new seed, and the land drawn fades out, the new one in once
// made; what is laid on the plate (its title, its clock) stays.

export function LandPlate({
  seed,
  land,
  label,
  whole = false,
  children,
}: Readonly<{
  seed: string | null
  land: Land
  /** What the land is, for whoever cannot see it. */
  label: string
  /** The whole land in the sea round it, as a list of maps shows it; else covering the plate. */
  whole?: boolean
  children?: ReactNode
}>) {
  const canvas = useRef<HTMLCanvasElement>(null)
  // The land as a key: its object is made anew at each render.
  const landKey = land.kind === 'real' ? land.map : land.size
  const [drawn, setDrawn] = useState<string | null>(null)

  // The drawing's code is fetched at once; the land, some hundreds of ms
  // of work, is made when the browser has a moment.
  useEffect(() => {
    const element = canvas.current
    if (!seed || !element) return
    let live = true
    let stop = () => {}
    void import('~/render/sketch').then(({ sketchGame }) => {
      if (!live) return
      stop = whenIdle(() => {
        sketchGame(element, seed, land, whole)
        setDrawn(seed)
      }, 1000)
    })
    return () => {
      live = false
      stop()
    }
  }, [seed, landKey, whole])

  const shown = seed !== null && drawn === seed
  return (
    <div
      className="relative aspect-[3/2] max-h-[56dvh] w-full overflow-hidden border border-quill max-sm:max-h-none"
      style={{ background: hex(TONE.seaWash) }}
    >
      <canvas
        ref={canvas}
        role="img"
        aria-label={label}
        className={`absolute inset-0 size-full transition-opacity duration-(--duration-hud-enter) ease-hud motion-reduce:transition-none ${shown ? 'opacity-100' : 'opacity-0'}`}
      />
      {children}
    </div>
  )
}
