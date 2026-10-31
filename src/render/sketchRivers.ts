import { RULES, halfWidthAt } from '../../engine'
import { css } from './art/ink'
import { TONE } from './palette'
import type { World } from '../../engine'

// The rivers on the small maps (sketch.ts): the home's card and the atlas's
// pictures, water as on the map (ground/rivers.ts), a fine ink.

/** A river's course in so many stretches, each one stroke as wide as its middle: a few strokes a river, as on the map (ground/rivers.ts). */
const STRETCHES = 3

/** The rivers, water as the sea's (engine/map/streams.ts): the sea's wash between the coast's ink, as wide as on the map, a line at least. */
export function sketchRivers(
  g: CanvasRenderingContext2D,
  world: World,
  px: number,
  /** The thinnest line, and the coast's ink, in pixels. */
  line: number,
  ink: number,
) {
  g.lineCap = 'round'
  g.lineJoin = 'round'
  for (const [extra, color] of [
    [ink * px, css(TONE.ink)],
    [0, css(TONE.seaWash)],
  ] as const)
    for (const river of world.rivers) {
      const n = river.length
      const step = Math.max(1, Math.ceil((n - 1) / STRETCHES))
      for (let from = 0; from < n - 1; from += step) {
        const to = Math.min(n - 1, from + step)
        const wide =
          (2 * halfWidthAt((from + to) / 2, n) + 0.4) * RULES.tileSize
        g.beginPath()
        g.moveTo(...river[from])
        for (let i = from + 1; i <= to; i++) g.lineTo(...river[i])
        g.lineWidth = Math.max(line * px, wide) + extra
        g.strokeStyle = color
        g.stroke()
      }
    }
}
