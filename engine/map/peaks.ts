import { cutRanges, joinLand } from './passes'
import { WIDE, piecesOf, wideSides } from './pieces'
import type { Cells } from './cells'
import type { Point } from './points'

// The high mountains, which no one takes, crosses or builds on, as the sea:
// the ground that rises the most, the ranges' crests first, in ranges, and
// the passes that cut them (passes.ts). A range is the front between the
// lands either side of it, and its passes the ways an army takes. A pass is
// a cell wide, its sides wide enough that the tiles across them meet
// (pieces.ts); and no range leaves a crack a tile wide where two of its
// cells meet by a short side.

/** A group of mountains under so many cells (on the standard land) is only a hill. */
const SMALLEST = 3
/** A piece of land walled in by mountains under so many cells is mountain too: no pass for so little. */
const POCKET = 8

export type Peaks = {
  peaks: Array<boolean>
  /** The middle of each pass. */
  passes: Array<Point>
}

/**
 * The high mountains of a land: of its cells, the `share` in a thousand that
 * rise the most, less the groups too small to be a range; then the passes,
 * so that the land between them stays one. `side` is how many times the
 * standard land's side this one's is. `join`: whether the pieces of land
 * cut off are given a pass or sunk; a map of the Earth's islands are cut off
 * by the sea, not by its ranges, and stay as they are (atlas.ts).
 */
export function raisePeaks(
  cells: Cells,
  heights: ArrayLike<number>,
  rise: ArrayLike<number>,
  water: Array<boolean>,
  share: number,
  side: number,
  join = true,
): Peaks {
  const area = side * side
  const land = cells.sites.flatMap((_, c) => (water[c] ? [] : [c]))
  const high = [...land].sort((a, b) => rise[b] - rise[a] || a - b)
  const peak = new Uint8Array(cells.sites.length)
  high
    .slice(0, Math.floor((land.length * share) / 1000))
    .forEach((c) => (peak[c] = 1))
  const groups = piecesOf(cells.neighbors, (c) => peak[c] === 1)
  const size = new Map<number, number>()
  groups.forEach((g) => g >= 0 && size.set(g, (size.get(g) ?? 0) + 1))
  groups.forEach((g, c) => {
    if (g >= 0 && (size.get(g) ?? 0) < SMALLEST * area) peak[c] = 0
  })
  seal(cells, heights, water, peak)
  const passes: Array<Point> = []
  const range = {
    cells,
    wide: wideSides(cells),
    heights,
    water,
    peak,
    open(path: Array<number>) {
      path.forEach((c) => (peak[c] = 0))
      passes.push(cells.sites[path[Math.floor(path.length / 2)]])
    },
  }
  if (join) joinLand(range, POCKET * area)
  cutRanges(range, side)
  return { peaks: [...peak].map((p) => p === 1), passes }
}

/**
 * Seals the chinks of the ranges: where two cells of mountain meet by a
 * short side, the tiles of the two cells of land at its ends could touch
 * across it, a crack no army should find; the higher of the two becomes
 * mountain.
 */
function seal(
  cells: Cells,
  heights: ArrayLike<number>,
  water: Array<boolean>,
  peak: Uint8Array,
) {
  const open = (c: number) => c >= 0 && !water[c] && !peak[c]
  const higher = (r: number, s: number) =>
    heights[r] > heights[s] || (heights[r] === heights[s] && r < s) ? r : s
  cells.polygons.forEach((ring, p) => {
    if (!peak[p]) return
    ring.forEach((a, k) => {
      const q = cells.across[p][k]
      const b = ring[(k + 1) % ring.length]
      const d = (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])
      if (q < 0 || !peak[q] || d >= WIDE * WIDE) return
      const r = cells.across[p][(k + ring.length - 1) % ring.length]
      const s = cells.across[p][(k + 1) % ring.length]
      if (open(r) && open(s) && !cells.neighbors[r].includes(s))
        peak[higher(r, s)] = 1
    })
  })
}
