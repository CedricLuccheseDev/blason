import { isqrt } from './numbers'
import { apart, eachAround } from './grid'
import { walkers } from './muster'
import type { GameState } from './types'

// The land an army crosses to the click (course.ts): the target's tiles it
// reaches from there, how many steps round what bars the way, and the border
// it may enter by.

/**
 * The tiles from which the tile aimed at is reached over the land of these
 * owners, no high mountain nor sea crossed (« bug on peut pas traverser les
 * montagnes »: the army entered where a range stood between it and the
 * click, and the aim drew its line across).
 */
export function reachable(
  state: GameState,
  tile: number,
  owners: ReadonlySet<number>,
): (t: number) => boolean {
  const { seen, queue, steps } = buffersOf(state)
  const round = (seen.round += 1)
  const { marks } = seen
  let size = 0
  marks[tile] = round
  steps[tile] = 0
  queue[size++] = tile
  let from = tile
  const visit = (n: number) => {
    if (marks[n] === round || !owners.has(state.owner[n])) return
    marks[n] = round
    steps[n] = steps[from] + 1
    queue[size++] = n
  }
  for (let i = 0; i < size; i++) {
    from = queue[i]
    eachAround(state.grid, from, visit)
  }
  return (t) => marks[t] === round
}

/** The steps from the tile last searched from (reachable) to a tile it reached, round what bars the way. */
const walkFrom = (state: GameState, t: number) => buffersOf(state).steps[t]

/** Whether the way from a border tile to the click goes far round (a river, a range between): the army's band, a strip along the straight line, would not get there; a boat may. */
export const roundabout = (state: GameState, entry: number, tile: number) =>
  2 * walkFrom(state, entry) > 3 * isqrt(apart(state.grid, entry, tile)) + 12

/**
 * Each map's search buffers, made once and marked anew each search, never
 * cleared: a search over a great map's free land, under the pointer each
 * tick, made two arrays as large as the map every time, and their garbage
 * brought the page down (« sur europe au bout de 10s », « ça plante »).
 * A search's answer holds only until the next one.
 */
const BUFFERS = new WeakMap<
  GameState['grid'],
  {
    seen: { marks: Int32Array; round: number }
    queue: Int32Array
    steps: Int32Array
  }
>()

function buffersOf(state: GameState) {
  let buffers = BUFFERS.get(state.grid)
  if (!buffers) {
    const n = state.owner.length
    buffers = {
      seen: { marks: new Int32Array(n), round: 0 },
      queue: new Int32Array(n),
      steps: new Int32Array(n),
    }
    BUFFERS.set(state.grid, buffers)
  }
  return buffers
}

/**
 * The border an army may enter by: the target's tiles beside land the lord's
 * armies walk, from which the tile aimed at is reached (`reach`), each with
 * how far it is from it (the square of the distance).
 */
export function borderOf(
  state: GameState,
  player: number,
  target: number,
  tile: number,
  reach: (t: number) => boolean,
) {
  const walks = walkers(state, player)
  const { owner } = state
  const gaps = new Map<number, number>()
  const mark = (t: number) => {
    if (owner[t] === target && reach(t) && !gaps.has(t))
      gaps.set(t, apart(state.grid, t, tile))
  }
  for (let t = 0; t < owner.length; t++)
    if (owner[t] >= 0 && walks[owner[t]]) eachAround(state.grid, t, mark)
  return gaps
}

/** The tile of a border nearest the tile aimed at, the first on a tie; -1 for none. */
export function nearestOf(gaps: Map<number, number>) {
  let [nearest, near] = [-1, Infinity]
  for (const [t, gap] of gaps)
    if (gap < near || (gap === near && t < nearest)) [nearest, near] = [t, gap]
  return nearest
}
