import { pop, push } from '../heap'

// The ways over the high mountains, as passes.ts looks for them: the lowest
// way from one land to another however long, and the short ways over a
// range from a foot of it; and the walk round over the land, to tell how
// much a way over spares. Each walks the cells by their wide sides only
// (pieces.ts), so that a way found is a way the tiles keep open.

type Sides = Array<Array<number>>
type Test = (c: number) => boolean

/** What a cell over the mountains costs beside its height: of two ways as low, the shorter. */
const STEP = 0.2

const rank = (h: number) => Math.round(h * 1_000_000)

/** The cells of a way, walked back from its end to the first of `from`, in order. */
function wayBack(back: Int32Array, end: number, from: Test): Array<number> {
  const path: Array<number> = []
  for (let c = end; c >= 0 && !from(c); c = back[c]) path.push(c)
  return path.reverse()
}

/**
 * The lowest, shortest way over the cells `over` from the cells `from` to
 * one of the cells `to`: the cells over the mountains it takes, or null.
 */
export function lowestWay(
  wide: Sides,
  heights: ArrayLike<number>,
  from: Test,
  to: Test,
  over: Test,
): Array<number> | null {
  const n = wide.length
  const cost = new Float64Array(n).fill(Infinity)
  const back = new Int32Array(n).fill(-1)
  const heap: Array<[number, number]> = []
  for (let c = 0; c < n; c++)
    if (from(c)) {
      cost[c] = 0
      push(heap, [0, c])
    }
  for (let item = pop(heap); item; item = pop(heap)) {
    const at = item[1]
    if (item[0] > rank(cost[at])) continue
    if (!from(at) && wide[at].some(to)) return wayBack(back, at, from)
    for (const next of wide[at]) {
      const c = cost[at] + heights[next] + STEP
      if (!over(next) || c >= cost[next]) continue
      cost[next] = c
      back[next] = at
      push(heap, [rank(c), next])
    }
  }
  return null
}

/** A short way over a range: from its foot to the free cell it comes down on, by its last cell over. */
export type Way = { foot: number; far: number; last: number; cost: number }

/**
 * The short ways over a range from its feet: walks through its cells, so
 * many deep at most, that come down on free land again, each with its cost,
 * the mean height of its cells over the range; and the cells of one.
 */
export function makeWays(wide: Sides, heights: ArrayLike<number>) {
  const n = wide.length
  const mark = new Int32Array(n)
  const back = new Int32Array(n)
  const depth = new Int32Array(n)
  const sum = new Float64Array(n)
  let stamp = 0
  /** Walks over the range from a foot, telling each way down. */
  function walk(foot: number, free: Test, range: Test, most: number) {
    const found: Array<Way> = []
    stamp++
    mark[foot] = stamp
    depth[foot] = 0
    sum[foot] = 0
    const queue = [foot]
    for (const at of queue)
      for (const next of wide[at]) {
        if (mark[next] === stamp || (free(next) && at === foot)) continue
        if (free(next)) {
          mark[next] = stamp
          found.push({ foot, far: next, last: at, cost: sum[at] / depth[at] })
        } else if (range(next) && depth[at] < most) {
          mark[next] = stamp
          back[next] = at
          depth[next] = depth[at] + 1
          sum[next] = sum[at] + heights[next]
          queue.push(next)
        }
      }
    return found
  }
  return {
    from: walk,
    /** The cells over the range of a way, walked again from its foot. */
    cells(way: Way, free: Test, range: Test, most: number): Array<number> {
      walk(way.foot, free, range, most)
      return wayBack(back, way.last, (c) => c === way.foot)
    },
  }
}

/** The walk over the free land between two cells, its marks kept from one walk to the next. */
export function makeWalker(wide: Sides) {
  const mark = new Int32Array(wide.length)
  const steps = new Int32Array(wide.length)
  let stamp = 0
  /** The steps from one cell to another over the free land, or `most` if it is so far or farther. */
  return (from: number, to: number, free: Test, most: number): number => {
    stamp++
    mark[from] = stamp
    steps[from] = 0
    const queue = [from]
    for (const at of queue) {
      if (steps[at] + 1 >= most) break
      for (const next of wide[at]) {
        if (mark[next] === stamp || !free(next)) continue
        if (next === to) return steps[at] + 1
        mark[next] = stamp
        steps[next] = steps[at] + 1
        queue.push(next)
      }
    }
    return most
  }
}
