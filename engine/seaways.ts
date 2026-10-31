import { eachAround } from './grid'
import type { Grid } from './types'

// The ways over the water a warship sails (warships.ts): from the goal out
// over the water, to the first tile that will do as its start.

/** Each map's search buffers, made once and marked anew each search, so that a search makes no garbage. */
const BUFFERS = new WeakMap<
  Grid,
  { marks: Int32Array; next: Int32Array; queue: Int32Array; round: number }
>()

function buffersOf(grid: Grid) {
  let buffers = BUFFERS.get(grid)
  if (!buffers) {
    const n = grid.water.length
    buffers = {
      marks: new Int32Array(n),
      next: new Int32Array(n),
      queue: new Int32Array(n),
      round: 0,
    }
    BUFFERS.set(grid, buffers)
  }
  return buffers
}

/**
 * The way over the water to a tile of it, from the first tile a search out
 * from there finds that `start` accepts: that tile first, the goal last.
 * None if the water joins none, or none within `most` tiles searched.
 */
export function wayFrom(
  grid: Grid,
  goal: number,
  start: (tile: number) => boolean,
  most = Infinity,
): Array<number> | null {
  if (!grid.water[goal]) return null
  const buffers = buffersOf(grid)
  const round = (buffers.round += 1)
  const { marks, next, queue } = buffers
  marks[goal] = round
  next[goal] = -1
  queue[0] = goal
  let size = 1
  for (let i = 0; i < size && i < most; i++) {
    const at = queue[i]
    if (start(at)) {
      const way = [at]
      for (let t = next[at]; t >= 0; t = next[t]) way.push(t)
      return way
    }
    eachAround(grid, at, (n) => {
      if (!grid.water[n] || marks[n] === round) return
      marks[n] = round
      next[n] = at
      queue[size++] = n
    })
  }
  return null
}
