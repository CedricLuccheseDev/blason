import { lowestWay, makeWalker, makeWays } from './crossings'
import { piecesOf } from './pieces'
import type { Cells } from './cells'

// The passes over the high mountains, the ways an army takes through a
// range: first so that the land stays one, every piece of it joined to the
// rest by the lowest way over (a piece too small for one is mountain too);
// then where a range parts two lands a long walk round it, cut where it is
// lowest, once for so many of its cells. The measures are the standard
// land's, in cells; a larger land's are as much longer as its side is.

/** A range is crossed where it is at most so many cells wide... */
const THROUGH = 5
/** ...when the walk round it is so many cells longer than the way over it... */
const DETOUR = 16
/** ...once for so many of its cells at most. */
const PER = 18

/** The land, its high mountains, and what opens a pass through them. */
export type Range = {
  cells: Cells
  wide: Array<Array<number>>
  heights: ArrayLike<number>
  water: Array<boolean>
  peak: Uint8Array
  open: (path: Array<number>) => void
}

/** How many cells each piece holds. */
function sizes(piece: Int32Array): Map<number, number> {
  const size = new Map<number, number>()
  piece.forEach((p) => p >= 0 && size.set(p, (size.get(p) ?? 0) + 1))
  return size
}

/** The largest piece, the first of two as large. */
function largest(size: Map<number, number>): number {
  let main = -1
  let most = 0
  for (const [p, k] of size)
    if (k > most || (k === most && p < main)) [main, most] = [p, k]
  return main
}

/**
 * Joins every piece of the land to the largest: a piece too small is
 * mountain too; another is joined by the lowest way over the mountains;
 * one no way over them reaches goes under the sea.
 */
export function joinLand(range: Range, pocket: number) {
  const { wide, heights, water, peak } = range
  const free = (c: number) => !water[c] && !peak[c]
  for (let round = 0; round < 200; round++) {
    const piece = piecesOf(wide, free)
    const size = sizes(piece)
    if (size.size <= 1) return
    const main = largest(size)
    const small = piece.filter(
      (p) => p >= 0 && p !== main && (size.get(p) ?? 0) < pocket,
    ).length
    if (small > 0) {
      piece.forEach((p, c) => {
        if (p >= 0 && p !== main && (size.get(p) ?? 0) < pocket) peak[c] = 1
      })
      continue
    }
    const path = lowestWay(
      wide,
      heights,
      (c) => piece[c] === main,
      (c) => piece[c] >= 0 && piece[c] !== main,
      (c) => peak[c] === 1,
    )
    if (!path) {
      piece.forEach((p, c) => p >= 0 && p !== main && (water[c] = true))
      return
    }
    range.open(path)
  }
}

/** Cuts the long ranges where the walk round them is long, at their lowest. */
export function cutRanges(range: Range, side: number) {
  const { cells, peak } = range
  const groups = piecesOf(cells.neighbors, (c) => peak[c] === 1)
  const ordered = [...sizes(groups)].sort((a, b) => a[0] - b[0])
  for (const [group, held] of ordered)
    for (let k = 0; k < Math.floor(held / (PER * side)); k++) {
      const path = shortcut(
        range,
        (c) => groups[c] === group && peak[c] === 1,
        side,
      )
      if (!path) break
      range.open(path)
    }
}

/**
 * Of the short ways over a range that spare a long walk round it, the
 * lowest, if any: the ways are tried from the lowest up, and the first that
 * spares enough is taken.
 */
function shortcut(
  { wide, heights, water, peak }: Range,
  inRange: (c: number) => boolean,
  side: number,
): Array<number> | null {
  const through = Math.round(THROUGH * side)
  const detour = Math.round(DETOUR * side)
  const free = (c: number) => !water[c] && !peak[c]
  const ways = makeWays(wide, heights)
  const found = wide.flatMap((around, foot) =>
    free(foot) && around.some(inRange)
      ? ways.from(foot, free, inRange, through)
      : [],
  )
  found.sort((a, b) => a.cost - b.cost || a.foot - b.foot || a.far - b.far)
  const walk = makeWalker(wide)
  for (const way of found) {
    const path = ways.cells(way, free, inRange, through)
    const most = path.length + 1 + detour
    if (walk(way.foot, way.far, free, most) >= most) return path
  }
  return null
}
