import { drawInt } from '../numbers'
import type { Cells } from './cells'
import type { Point } from './points'

/** Irregular borders, the same seen from both sides, so cells look like lands. */
export type Borders = {
  /** The border between two cells, from the first point given. */
  between: (i: number, j: number, from: Point, to: Point) => Array<Point>
  outline: (i: number) => Array<Point>
}

type Edge = { start: Point; points: Array<Point> }

/** `plainer` takes so many levels of wiggle off: small cells need fewer. */
export function makeBorders(
  seed: string,
  cells: Cells,
  sea: Array<boolean>,
  plainer = 0,
): Borders {
  const cache = new Map<string, Edge>()

  function between(i: number, j: number, from: Point, to: Point) {
    const key = `${Math.min(i, j)}-${Math.max(i, j)}`
    let edge = cache.get(key)
    if (!edge) {
      const coast = sea[i] !== sea[j]
      const points = wobble(
        seed,
        key,
        from,
        to,
        (coast ? 4 : 3) - plainer,
        coast ? 200 : 150,
      )
      edge = { start: from, points }
      cache.set(key, edge)
    }
    const forward = closer(
      from,
      edge.start,
      edge.points[edge.points.length - 1],
    )
    return forward ? edge.points : [...edge.points].reverse()
  }

  function outline(i: number): Array<Point> {
    const ring = cells.polygons[i]
    return ring.flatMap((a, k) => {
      const j = cells.across[i][k]
      if (j < 0) return [a]
      return between(i, j, a, ring[(k + 1) % ring.length]).slice(0, -1)
    })
  }

  return { between, outline }
}

function closer(p: Point, a: Point, b: Point): boolean {
  const da = (p[0] - a[0]) * (p[0] - a[0]) + (p[1] - a[1]) * (p[1] - a[1])
  const db = (p[0] - b[0]) * (p[0] - b[0]) + (p[1] - b[1]) * (p[1] - b[1])
  return da <= db
}

/**
 * Midpoint displacement: the middle of a side moves a little across it, then
 * each half does the same. The side keeps its two ends.
 */
function wobble(
  seed: string,
  key: string,
  from: Point,
  to: Point,
  depth: number,
  permille: number,
  path = '',
): Array<Point> {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  if (depth === 0 || dx * dx + dy * dy < 9) return [from, to]
  const shift =
    ((drawInt(seed, 2001, 'edge', key, path) - 1000) * permille) / 1e6
  const middle: Point = [
    (from[0] + to[0]) / 2 - dy * shift,
    (from[1] + to[1]) / 2 + dx * shift,
  ]
  const left = wobble(seed, key, from, middle, depth - 1, permille, `${path}l`)
  const right = wobble(seed, key, middle, to, depth - 1, permille, `${path}r`)
  return [...left.slice(0, -1), ...right]
}
