import { TONE } from '../palette'
import type { Graphics } from 'pixi.js'
import type { Spot } from '../roads'

// A paved road as an old map shows one, small and quiet: a pale band of
// beaten earth, and on it two rows of worn stones laid by hand, none quite
// the size or the shape of its neighbour, some of them missing. At the
// land's scale, in map units; light enough never to weigh on the map.

const EARTH = 0xcdb68a
/** The band's width; the room between two stones along the road and across it; a stone's size. */
const WIDE = 1.9
const ALONG = 1.15
const ACROSS = 0.48
const SIZE = 0.36
/** Out of a hundred, the stones gone. */
const GONE = 18

/** A number from 0 to 1 drawn from a place, the same every time: the road looks the same each time it is drawn. */
function hash(x: number, y: number, salt: number): number {
  const h = Math.sin(x * 12.9898 + y * 78.233 + salt * 37.719) * 43758.5453
  return h - Math.floor(h)
}

/** One worn stone: four corners pushed about. */
function stone(g: Graphics, x: number, y: number, angle: number) {
  const corners: Array<number> = []
  for (let c = 0; c < 4; c++) {
    const a = angle + (c * Math.PI) / 2 + Math.PI / 4
    const r = SIZE * (0.75 + 0.5 * hash(x, y, c))
    corners.push(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8)
  }
  g.poly(corners)
}

/** The stones of one stretch of road, two rows of them, some gone. */
function lay(g: Graphics, a: Spot, b: Spot) {
  const d = Math.hypot(b.x - a.x, b.y - a.y)
  if (d === 0) return
  const [ux, uy] = [(b.x - a.x) / d, (b.y - a.y) / d]
  const angle = Math.atan2(uy, ux)
  for (let s = 0; s < d; s += ALONG)
    for (const side of [-1, 1]) {
      const x0 = a.x + ux * s
      const y0 = a.y + uy * s
      if (hash(x0, y0, side) * 100 < GONE) continue
      const shift = (side + (hash(y0, x0, 7) - 0.5) * 0.6) * ACROSS
      const slip = (hash(x0, y0, 9) - 0.5) * 0.4
      stone(g, x0 - uy * shift + ux * slip, y0 + ux * shift + uy * slip, angle)
    }
}

export function drawPaving(g: Graphics, path: Array<Spot>, mine: boolean) {
  g.moveTo(path[0].x, path[0].y)
  for (const p of path.slice(1)) g.lineTo(p.x, p.y)
  g.stroke({
    width: WIDE,
    color: EARTH,
    alpha: mine ? 0.55 : 0.4,
    cap: 'round',
    join: 'round',
  })
  for (let i = 0; i < path.length - 1; i++) lay(g, path[i], path[i + 1])
  g.fill({ color: TONE.stone, alpha: mine ? 0.95 : 0.8 })
  g.stroke({ width: 0.1, color: TONE.ink, alpha: mine ? 0.45 : 0.3 })
}
