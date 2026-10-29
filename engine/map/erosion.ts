import { isqrt } from '../numbers'
import { pop, push } from '../heap'
import type { Cells } from './cells'

// The water's work on the relief: rain falls on every cell and runs down to
// the sea, each cell's water to its lowest way out (a priority flood from
// the shore, so that no hollow traps it), and the more water runs through a
// cell the deeper it digs it. The valleys it leaves run from the heights to
// the sea, the drowned ones by the shore become rias and estuaries, and a
// range a great river crosses is cut by its valley: a pass.

/** Heights to whole ranks, so that the flood takes its cells in the same order everywhere. */
const rank = (h: number) => Math.round(h * 1_000_000)

/**
 * For each cell of land, the next one down on the water's way to the sea
 * (−1 for the sea itself), and the order the flood reached them, the
 * shore first.
 */
function drain(
  cells: Cells,
  heights: ArrayLike<number>,
  sea: Array<boolean>,
): { down: Int32Array; order: Array<number> } {
  const n = cells.sites.length
  const down = new Int32Array(n).fill(-1)
  const seen = new Uint8Array(n)
  const heap: Array<[number, number]> = []
  const order: Array<number> = []
  sea.forEach((wet, c) => {
    if (!wet) return
    seen[c] = 1
    for (const next of cells.neighbors[c])
      if (!sea[next] && !seen[next]) {
        seen[next] = 1
        down[next] = c
        push(heap, [rank(heights[next]), next])
      }
  })
  for (let item = pop(heap); item; item = pop(heap)) {
    const [floor, at] = item
    order.push(at)
    for (const next of cells.neighbors[at]) {
      if (seen[next]) continue
      seen[next] = 1
      down[next] = at
      push(heap, [Math.max(floor, rank(heights[next])), next])
    }
  }
  return { down, order }
}

/**
 * Digs the land along the water's ways: each cell sinks by so much of the
 * strength as the water through it is great, the most where the most runs,
 * the shore's mouths of the great rivers.
 */
export function erode(
  cells: Cells,
  heights: Float64Array,
  sea: Array<boolean>,
  strength: number,
): void {
  const { down, order } = drain(cells, heights, sea)
  const flow = new Int32Array(heights.length)
  for (const c of order) flow[c] = 1
  for (let k = order.length - 1; k >= 0; k--) {
    const c = order[k]
    if (down[c] >= 0 && !sea[down[c]]) flow[down[c]] += flow[c]
  }
  const most = isqrt(flow.reduce((m, f) => Math.max(m, f), 1))
  for (const c of order) heights[c] -= (strength * isqrt(flow[c])) / most
}
