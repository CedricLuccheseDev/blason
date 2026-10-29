import { journeyOf } from '../../engine'
import { siteOf } from './marks'
import type { Graphics } from 'pixi.js'
import type { GameState, Grid, Strike } from '../../engine'

// The way a coup goes, as drawn: the troublemaker's straight walk, the arc
// a volley or a trebuchet's stone flies, how far along it is between two ticks,
// the tiles round where it falls, and the dotted lines that show them.

export type At = { x: number; y: number }

/** How high a flight rises over the straight line, against its length. */
const LIFT = 0.35

/** How far a coup is on its way, 0 to 1, smoothed between two ticks. */
export function progress(state: GameState, strike: Strike, between: number) {
  const total = journeyOf(state, strike)
  const done = total - (strike.lands - state.tick) + between
  return Math.max(0, Math.min(1, done / total))
}

/** A point on the coup's way at `t`: straight on foot, on an arc in flight; and which way it heads there. */
export function along(a: At, b: At, t: number, flies: boolean) {
  const lift = flies ? Math.hypot(b.x - a.x, b.y - a.y) * LIFT : 0
  const x = a.x + (b.x - a.x) * t
  const y = a.y + (b.y - a.y) * t - lift * 4 * t * (1 - t)
  const dx = b.x - a.x
  const dy = b.y - a.y - lift * 4 * (1 - 2 * t)
  return { x, y, angle: Math.atan2(dy, dx) }
}

/** Where a strike left from and where it falls, in map units. */
export function endsOf(state: GameState, strike: Strike) {
  return { a: siteOf(state, strike.from), b: siteOf(state, strike.target) }
}

/** The tiles of land within a radius of a tile, as the coups strike them. */
export function tilesRound(grid: Grid, tile: number, radius: number) {
  const [cx, cy] = [tile % grid.width, Math.floor(tile / grid.width)]
  const found: Array<number> = []
  for (let y = Math.max(0, cy - radius); y <= cy + radius; y++)
    for (let x = Math.max(0, cx - radius); x <= cx + radius; x++) {
      if (y >= grid.height || x >= grid.width) continue
      const t = y * grid.width + x
      const d = (x - cx) * (x - cx) + (y - cy) * (y - cy)
      if (d <= radius * radius && grid.land[t]) found.push(t)
    }
  return found
}

/** A dotted line through points, dots and gaps of `step`; stroked by the caller. */
export function dots(g: Graphics, points: ReadonlyArray<At>, step: number) {
  let carry = 0
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]]
    const d = Math.hypot(b.x - a.x, b.y - a.y)
    let s = carry
    for (; s < d; s += 2 * step) {
      const t0 = s / d
      const t1 = Math.min(1, (s + step) / d)
      g.moveTo(a.x + (b.x - a.x) * t0, a.y + (b.y - a.y) * t0)
      g.lineTo(a.x + (b.x - a.x) * t1, a.y + (b.y - a.y) * t1)
    }
    carry = s - d
  }
}

/** The points of a coup's way from a to b, for a dotted line: two on foot, more on an arc. */
export function wayOf(a: At, b: At, flies: boolean, from = 0, to = 1) {
  const n = flies ? 16 : 1
  return Array.from({ length: n + 1 }, (_, i) =>
    along(a, b, from + ((to - from) * i) / n, flies),
  )
}
