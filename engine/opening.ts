import { drawInt } from './numbers'
import { apart, around } from './grid'
import { pop, push } from './heap'
import { capOf, setOwner } from './land'
import { NEUTRAL } from './types'
import type { GameState, Grid } from './types'

// The opening, as on OpenFront. For its first seconds no land is anyone's:
// each lord plants his standard on any tile of the land and may move it as
// often as he likes, never too near another lord's (`standardGap`), so that
// the first to plant holds the ground round his. When the count ends each
// receives the land round his standard, as far as his start reaches, walking
// from it over the land and never across the sea; where two starts meet,
// each tile goes to the nearer standard. His first village stands on his
// standard's tile. Who planted none is given the spot with the most room.

/** Farther than any two tiles: how far the nearest standard is while none is planted. */
const FAR = 1e12
/** How many tiles are looked at to give a start to a lord who planted none. */
const GIVEN_DRAWS = 2000

/** How far the sea lies from each tile, in steps to a side or a corner: the land is whole round a tile one step short of it. Read once a game. */
const shores = new WeakMap<Grid, Int32Array>()

/** The steps from a tile to the sea, as far as swept; beyond the map's edge, the sea. */
function swept(far: Int32Array, grid: Grid, x: number, y: number): number {
  const off = x < 0 || y < 0 || x >= grid.width || y >= grid.height
  return off ? 0 : far[y * grid.width + x]
}

function shoreOf(grid: Grid): Int32Array {
  const known = shores.get(grid)
  if (known) return known
  const { width, land } = grid
  const far = new Int32Array(land.length)
  const at = (x: number, y: number) => swept(far, grid, x, y)
  // Two sweeps, down the map then back up: each tile of land one step
  // farther than the nearest of its neighbours already swept.
  for (let t = 0; t < land.length; t++) {
    if (!land[t]) continue
    const [x, y] = [t % width, Math.floor(t / width)]
    const up = Math.min(at(x - 1, y - 1), at(x, y - 1), at(x + 1, y - 1))
    far[t] = 1 + Math.min(at(x - 1, y), up)
  }
  for (let t = land.length - 1; t >= 0; t--) {
    if (!land[t]) continue
    const [x, y] = [t % width, Math.floor(t / width)]
    const down = Math.min(at(x - 1, y + 1), at(x, y + 1), at(x + 1, y + 1))
    far[t] = Math.min(far[t], 1 + Math.min(at(x + 1, y), down))
  }
  shores.set(grid, far)
  return far
}

/** Whether a lord has planted his standard. */
export function hasPicked(state: GameState, player: number): boolean {
  return state.players[player].standard >= 0
}

/** The tiles the standards stand on, of all lords or all but one. */
function standards(state: GameState, but = -1): Array<number> {
  return state.players.flatMap((p, id) =>
    id !== but && p.standard >= 0 ? [p.standard] : [],
  )
}

/** The square of the distance from a tile to the nearest of these standards, in tiles. */
function nearest(state: GameState, tile: number, planted: Array<number>) {
  return planted.reduce((m, s) => Math.min(m, apart(state.grid, s, tile)), FAR)
}

/** Whether a standard stands too near another so far from it, a square of tiles: within the gap. */
const tooNear = (state: GameState, near: number) =>
  near < state.rules.standardGap * state.rules.standardGap

/** The lords whose standards stand too near this tile for another lord's. */
export function barredBy(
  state: GameState,
  player: number,
  tile: number,
): Array<number> {
  return state.players.flatMap(({ standard }, id) => {
    if (id === player || standard < 0) return []
    return tooNear(state, apart(state.grid, standard, tile)) ? [id] : []
  })
}

/** Whether a lord may plant his standard on this tile: any tile of the land in the game, with no other lord's standard within the gap. */
export function canStart(
  state: GameState,
  player: number,
  tile: number,
): boolean {
  if (state.grid.land[tile] !== true) return false
  return barredBy(state, player, tile).length === 0
}

/** During the opening a lord plants his standard, or moves it, on a tile of the land. */
export function pickStart(state: GameState, player: number, tile: number) {
  if (canStart(state, player, tile)) state.players[player].standard = tile
}

/**
 * How a spot ranks for a start, the greatest first: whether a standard may
 * stand there; the room round it, as far as the land is whole or halfway to
 * the nearest standard, no more than a start reaches; then how far the
 * nearest standard is. In squares of tiles.
 */
function rank(state: GameState, tile: number, planted: Array<number>) {
  const near = nearest(state, tile, planted)
  const whole = Math.max(0, shoreOf(state.grid)[tile] - 1)
  const reach = state.rules.startRadius * state.rules.startRadius
  const room = Math.min(whole * whole, Math.floor(near / 4), reach)
  return [tooNear(state, near) ? 0 : 1, room, near]
}

/** Whether a rank comes before another: the first figure that differs is the greater. */
function above(a: Array<number>, b: Array<number>): boolean {
  const i = a.findIndex((v, k) => v !== b[k])
  return i >= 0 && a[i] > b[i]
}

/**
 * Of so many tiles drawn from the seed with these keys, the best spot for a
 * lord's start (rank): the first drawn of two alike; -1 if none is land.
 */
export function spotFor(
  state: GameState,
  player: number,
  draws: number,
  ...keys: Array<string | number>
): number {
  const { grid, seed } = state
  const planted = standards(state, player)
  let best = -1
  let top: Array<number> = []
  for (let k = 0; k < draws; k++) {
    const tile = drawInt(seed, grid.land.length, ...keys, k)
    if (!grid.land[tile]) continue
    const ranked = rank(state, tile, planted)
    if (best >= 0 && !above(ranked, top)) continue
    best = tile
    top = ranked
  }
  return best
}

/**
 * Each lord's start: the land within his start's reach of his standard that
 * he walks to from it, over the land alone. A tile two may reach goes to
 * the nearer standard, to the lower seat of two as near: the tiles are
 * taken nearest first, each from the land its lord already took.
 */
function shareStarts(state: GameState): void {
  const { grid, players } = state
  const reach = state.rules.startRadius * state.rules.startRadius
  const lords = players.length
  // [the square of the distance to the standard, then the seat, as one figure; the tile].
  const heap: Array<[number, number]> = []
  players.forEach(({ standard }, id) => {
    if (standard >= 0) push(heap, [id, standard])
  })
  for (let next = pop(heap); next; next = pop(heap)) {
    const [key, tile] = next
    if (state.owner[tile] !== NEUTRAL) continue
    const id = key % lords
    setOwner(state, tile, id)
    for (const n of around(grid, tile)) {
      const d = apart(grid, players[id].standard, n)
      if (grid.land[n] && state.owner[n] === NEUTRAL && d <= reach)
        push(heap, [d * lords + id, n])
    }
  }
}

/** At the end of the opening: who planted nothing is given the spot with the most room; then each lord receives the land round his standard, his first village on its tile, his peasants at the full. */
export function grantStarts(state: GameState): void {
  state.players.forEach((lord, id) => {
    if (lord.standard < 0)
      lord.standard = spotFor(state, id, GIVEN_DRAWS, 'given', id)
  })
  shareStarts(state)
  state.players.forEach((lord, id) => {
    if (lord.standard < 0) return
    state.works.push({ work: 'village', tile: lord.standard, owner: id })
    lord.peasants = capOf(state, id)
  })
}
