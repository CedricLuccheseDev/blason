import { drawInt } from '../numbers'
import { inside } from './cells'
import { DIRECTIONS } from './noise'
import type { Point } from './points'
import type { Biome } from './terrain'

/**
 * A pond in a few inland cells, set towards the top of the cell so that the
 * village, its buildings and its name keep their place. Decor only.
 */
export function lakeFor(
  seed: string,
  id: number,
  site: Point,
  outline: Array<Point>,
  biome: Biome,
  coastal: boolean,
): Array<Point> | null {
  if (coastal || biome === 'hills' || drawInt(seed, 100, 'lake', id) >= 5) {
    return null
  }
  const top = outline.reduce(
    (best, p) => (rise(site, p) > rise(site, best) ? p : best),
    outline[0],
  )
  const cx = site[0] + (top[0] - site[0]) * 0.55
  const cy = site[1] + (top[1] - site[1]) * 0.55
  for (let r = 7; r > 3; r -= 0.8) {
    const ring = blob(seed, id, cx, cy, r)
    const margin = blob(seed, id, cx, cy, r + 1.5)
    if (margin.every((p) => inside(p, outline))) return ring
  }
  return null
}

function rise(site: Point, p: Point): number {
  return site[1] - p[1] - Math.abs(p[0] - site[0]) * 0.4
}

function blob(
  seed: string,
  id: number,
  cx: number,
  cy: number,
  r: number,
): Array<Point> {
  return DIRECTIONS.map(([dx, dy], k) => {
    const wobble = 1 + (drawInt(seed, 41, 'pond', id, k) - 20) / 100
    return [cx + dx * r * wobble, cy + dy * r * 0.72 * wobble]
  })
}
