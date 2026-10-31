import { DIRECTIONS } from './noise'
import { piecesOf, wideSides } from './pieces'
import { largestLand } from './terrain'
import type { Cells } from './cells'

// The sea of a raised land (relief.ts): the level it rises to, to cover so
// many of the cells; the coast it draws, with the way out to sea from each
// cell of it, where a recipe sets its gulfs and peninsulas; and one land
// under it, its islets sunk and its great pieces joined.

/** A piece of land so many in a thousand of the land is too great to sink: a neck joins it. */
const GREAT = 120
/** A pond of so few cells is filled: water so small is no sea. */
const POND = 4

/**
 * The cells of land along the coast the sea draws at its share, in heights
 * of the map from its middle, and of the sixteen directions the one most
 * towards the sea round each.
 */
export function shoreOf(
  cells: Cells,
  heights: Float64Array,
  share: number,
  width: number,
  height: number,
) {
  const level = levelOf(heights, share)
  return cells.sites.flatMap(([x, y], c) => {
    if (heights[c] < level) return []
    let [gx, gy] = [0, 0]
    for (const n of cells.neighbors[c])
      if (heights[n] < level) {
        gx += cells.sites[n][0] - x
        gy += cells.sites[n][1] - y
      }
    if (gx === 0 && gy === 0) return []
    const out = DIRECTIONS.reduce((best, d) =>
      d[0] * gx + d[1] * gy > best[0] * gx + best[1] * gy ? d : best,
    )
    const at: readonly [number, number] = [
      (x - width / 2) / height,
      (y - height / 2) / height,
    ]
    return [{ at, out }]
  })
}

/** The height under which so many of the cells in a thousand lie. */
export function levelOf(heights: Float64Array, share: number): number {
  const sorted = [...heights].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length * share) / 1000)]
}

/**
 * The sea of one land: a great piece of land cut off from the largest is
 * joined to it by a neck over the shortest strait; the smaller pieces (an
 * islet, or land joined by too narrow a side) go under; the ponds left in
 * the land are filled.
 */
export function oneLand(cells: Cells, sea: Array<boolean>): Array<boolean> {
  const wide = wideSides(cells)
  const wet = [...sea]
  for (let round = 0; round < 8; round++) {
    const neck = neckFor(wide, wet)
    if (neck.length === 0) break
    neck.forEach((c) => (wet[c] = false))
  }
  const land = largestLand(wide, wet)
  return fillPonds(
    cells,
    wet.map((_, c) => !land.has(c)),
  )
}

/**
 * The sea of a map of the Earth (atlas.ts): its lands as they are, islands
 * and all, none joined to another (« l'irlande est connecté a l'angleterre
 * pareille pour le danemark et la suede »); only the islets under `least`
 * cells go under, and the ponds left in the land are filled.
 */
export function keepLands(
  cells: Cells,
  sea: Array<boolean>,
  least: number,
): Array<boolean> {
  const piece = piecesOf(wideSides(cells), (c) => !sea[c])
  const size = new Map<number, number>()
  piece.forEach((p) => p >= 0 && size.set(p, (size.get(p) ?? 0) + 1))
  return fillPonds(
    cells,
    sea.map((w, c) => w || (size.get(piece[c]) ?? 0) < least),
  )
}

/** The neck to raise for the greatest piece of land cut off from the largest, if it is great enough. */
function neckFor(wide: Array<Array<number>>, wet: Array<boolean>) {
  const piece = piecesOf(wide, (c) => !wet[c])
  const size = new Map<number, number>()
  piece.forEach((p) => p >= 0 && size.set(p, (size.get(p) ?? 0) + 1))
  const sorted = [...size].sort((a, b) => b[1] - a[1] || a[0] - b[0])
  const land = sorted.reduce((sum, [, k]) => sum + k, 0)
  if (sorted.length < 2 || sorted[1][1] * 1000 < land * GREAT) return []
  const [main, second] = [sorted[0][0], sorted[1][0]]
  return strait(
    wide,
    wet,
    (c) => piece[c] === main,
    (c) => piece[c] === second,
  )
}

/** The water left in the land in pieces of so few cells is filled. */
function fillPonds(cells: Cells, wet: Array<boolean>): Array<boolean> {
  const seen = new Uint8Array(wet.length)
  wet.forEach((w, start) => {
    if (!w || seen[start]) return
    seen[start] = 1
    const pond = [start]
    for (const at of pond)
      for (const next of cells.neighbors[at])
        if (wet[next] && !seen[next]) {
          seen[next] = 1
          pond.push(next)
        }
    if (pond.length < POND) pond.forEach((c) => (wet[c] = false))
  })
  return wet
}

/** The water cells of the shortest way over the sea from one piece of land to another. */
function strait(
  wide: Array<Array<number>>,
  wet: Array<boolean>,
  from: (c: number) => boolean,
  to: (c: number) => boolean,
): Array<number> {
  const back = new Int32Array(wide.length).fill(-2)
  const queue = wide.flatMap((_, c) => (from(c) ? [c] : []))
  queue.forEach((c) => (back[c] = -1))
  for (const at of queue) {
    const end = wide[at].find((next) => back[next] === -2 && to(next))
    if (end !== undefined) return wayBack(back, at)
    for (const next of wide[at])
      if (back[next] === -2 && wet[next]) {
        back[next] = at
        queue.push(next)
      }
  }
  return []
}

/** The water cells walked back from the last to the land the walk set out from. */
function wayBack(back: Int32Array, last: number): Array<number> {
  const path: Array<number> = []
  for (let c = last; back[c] >= 0; c = back[c]) path.push(c)
  return path
}
