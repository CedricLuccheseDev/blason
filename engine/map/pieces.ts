import type { Cells } from './cells'

// The pieces a land falls into, and the sides a road may cross: two cells
// are joined for a walk only by a side wide enough that the tiles either
// side of it meet (grid.ts cuts the land by the nearest cell), else a neck
// of land, or a gap between two mountains, could be a crack of a tile, or
// none at all.

/** Two cells joined by a side shorter than this, in map units, do not let a road through. */
export const WIDE = 9

/** Each cell's neighbours across a side wide enough for a road. */
export function wideSides(cells: Cells): Array<Array<number>> {
  return cells.polygons.map((ring, c) => {
    const found = new Set<number>()
    ring.forEach((a, k) => {
      const j = cells.across[c][k]
      const b = ring[(k + 1) % ring.length]
      const d = (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])
      if (j >= 0 && d >= WIDE * WIDE) found.add(j)
    })
    return [...found].sort((p, q) => p - q)
  })
}

/** The pieces of the cells kept, joined by their sides: each cell's piece, −1 for the others. */
export function piecesOf(
  neighbors: Array<Array<number>>,
  keep: (c: number) => boolean,
): Int32Array {
  const piece = new Int32Array(neighbors.length).fill(-1)
  neighbors.forEach((_, start) => {
    if (!keep(start) || piece[start] >= 0) return
    piece[start] = start
    const queue = [start]
    for (const at of queue)
      for (const n of neighbors[at])
        if (keep(n) && piece[n] < 0) {
          piece[n] = start
          queue.push(n)
        }
  })
  return piece
}
