import { apart, eachAround } from './grid'
import { marchOut, marching, positionOf } from './muster'
import type { GameState, Host } from './types'

// The crossing (« les armées qui traversent l'eau vers une autre rive »,
// « de n'importe quelle tuile comme openfront »): a land the army cannot
// reach by land, it reaches by water. It lands on the shore of that land
// nearest the click; it walks its lord's land to the coast that brings it
// there soonest, the crossing counted, takes to the water from any tile of
// it, and sails, a tile a step as on land, to the landing. Its road runs on
// over the water: it takes nothing while it sails and is seen on the sea,
// then strikes from where it landed, as from a border.

/** Whether an army is at sea, on the water of its road. */
export const afloat = (state: GameState, host: Host) =>
  marching(host) && state.grid.water[positionOf(host)]

/** Each map's search buffers, made once and marked anew each search, so that a search makes no garbage. */
const BUFFERS = new WeakMap<
  GameState['grid'],
  { marks: Int32Array; steps: Int32Array; queue: Int32Array; round: number }
>()

function buffersOf(state: GameState) {
  let buffers = BUFFERS.get(state.grid)
  if (!buffers) {
    const n = state.owner.length
    buffers = {
      marks: new Int32Array(n),
      steps: new Int32Array(n),
      queue: new Int32Array(n),
      round: 0,
    }
    BUFFERS.set(state.grid, buffers)
  }
  return buffers
}

/** Whether a tile lies by the water. */
const byWater = (state: GameState, tile: number) => {
  let wet = false
  eachAround(state.grid, tile, (n) => {
    if (state.grid.water[n]) wet = true
  })
  return wet
}

/** Of the owner's tiles a search reached from the click, the one by the water nearest the click, the first on a tie; -1 for none. */
export function landingOf(
  state: GameState,
  owner: number,
  tile: number,
  reach: (t: number) => boolean,
): number {
  let [best, near] = [-1, Infinity]
  for (let t = 0; t < state.owner.length; t++) {
    if (state.owner[t] !== owner || !reach(t) || !byWater(state, t)) continue
    const gap = apart(state.grid, t, tile)
    if (gap < near) [best, near] = [t, gap]
  }
  return best
}

/**
 * The road from the lord's villages (or markets) given to a landing: over
 * the land his armies walk to the coast, then over the water to the tile
 * beside the landing; the soonest, counted in tiles. None if no water
 * joins them.
 */
export function sailTo(
  state: GameState,
  lord: number,
  sites: Array<number>,
  landing: number,
): Array<number> | null {
  const buffers = buffersOf(state)
  const round = (buffers.round += 1)
  const { marks, steps, queue } = buffers
  const { water } = state.grid
  // The water's tiles, each with its steps to the landing.
  let size = 0
  eachAround(state.grid, landing, (n) => {
    if (!water[n] || marks[n] === round) return
    marks[n] = round
    steps[n] = 0
    queue[size++] = n
  })
  for (let i = 0; i < size; i++) {
    const t = queue[i]
    eachAround(state.grid, t, (n) => {
      if (!water[n] || marks[n] === round) return
      marks[n] = round
      steps[n] = steps[t] + 1
      queue[size++] = n
    })
  }
  if (size === 0) return null
  // The march to the coast, the crossing after it counted.
  const best = { total: Infinity, coast: -1, sea: -1 }
  const roadTo = marchOut(state, lord, sites, (at, walked) => {
    if (walked + 1 > best.total) return false
    eachAround(state.grid, at, (n) => {
      if (marks[n] !== round) return
      const total = walked + 1 + steps[n]
      if (total < best.total) Object.assign(best, { total, coast: at, sea: n })
    })
    return true
  })
  if (best.coast < 0) return null
  const road = roadTo(best.coast)
  // Over the water, a tile nearer the landing each step.
  for (let at = best.sea; at >= 0;) {
    road.push(at)
    let next = -1
    eachAround(state.grid, at, (n) => {
      if (next < 0 && marks[n] === round && steps[n] === steps[at] - 1) next = n
    })
    at = steps[at] === 0 ? -1 : next
  }
  return road
}
