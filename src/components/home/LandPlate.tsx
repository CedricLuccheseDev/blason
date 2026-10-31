import { useEffect, useRef, useState } from 'react'
import { whenIdle } from './idle'
import type { ReactNode } from 'react'
import type { Drawn } from './HomeLand'
import type { Land } from '../../../engine'
import { hex } from '~/components/game/format'
import { TONE } from '~/render/palette'

// The land of a game to come, as its card shows it: drawn from its seed
// once the browser has a moment (render/sketch.ts), the very land the game
// will have. A new seed, and the land drawn fades out, the new one in once
// made; what is laid on the plate (its title, its clock) stays. A map of the
// atlas in the book's list is a picture drawn once (`npm run plates`): the
// list no longer builds every map to draw its card. On the home, the land
// is drawn once behind the whole page (HomeLand.tsx) and the plate is a
// window on it (`through`): the part of it under the plate copied there,
// sharp, again whenever the plate moves on the screen.

/** The part of the land drawn behind the page that lies under `canvas`, copied into it. */
function copyUnder(canvas: HTMLCanvasElement, { canvas: land }: Drawn) {
  const box = canvas.getBoundingClientRect()
  // The land's pixels against the screen's.
  const ratio = land.width / Math.max(1, land.clientWidth)
  canvas.width = Math.round(box.width * ratio)
  canvas.height = Math.round(box.height * ratio)
  canvas
    .getContext('2d')
    ?.drawImage(
      land,
      box.left * ratio,
      box.top * ratio,
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height,
    )
}

export function LandPlate({
  seed,
  land,
  label,
  whole = false,
  picture,
  through,
  children,
}: Readonly<{
  seed: string | null
  land: Land
  /** What the land is, for whoever cannot see it. */
  label: string
  /** The whole land in the sea round it, as a list of maps shows it; else covering the plate. */
  whole?: boolean
  /** The land drawn once, its picture's address: shown as it is, nothing drawn. */
  picture?: string
  /** The land drawn behind the page, of which the plate shows the part under it: nothing drawn of its own. */
  through?: Drawn | null
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
    if (!seed || !element || picture || through !== undefined) return
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
  }, [seed, landKey, whole, picture, through])

  // A window: copied once the land behind is drawn, and as the plate moves.
  useEffect(() => {
    const element = canvas.current
    if (!element || !through) return
    const copy = () => copyUnder(element, through)
    copy()
    setDrawn(through.seed)
    const moved = new ResizeObserver(copy)
    moved.observe(element)
    window.addEventListener('scroll', copy, { passive: true })
    return () => {
      moved.disconnect()
      window.removeEventListener('scroll', copy)
    }
  }, [through])

  const [loaded, setLoaded] = useState<string | null>(null)
  const shown = picture
    ? loaded === picture
    : seed !== null && drawn === seed
  const fading = `absolute inset-0 size-full transition-opacity duration-(--duration-hud-enter) ease-hud motion-reduce:transition-none ${shown ? 'opacity-100' : 'opacity-0'}`
  return (
    <div
      className="relative aspect-[3/2] max-h-[56dvh] w-full overflow-hidden border border-quill max-sm:max-h-none"
      style={{ background: hex(TONE.seaWash) }}
    >
      {picture ? (
        <img
          src={picture}
          alt={label}
          decoding="async"
          onLoad={() => setLoaded(picture)}
          className={`${fading} object-cover`}
        />
      ) : (
        <canvas ref={canvas} role="img" aria-label={label} className={fading} />
      )}
      {children}
    </div>
  )
}
