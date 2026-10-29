import { TICKS_PER_SECOND, UNIT } from './units'
import { isqrt } from './numbers'
import { around } from './grid'
import { RULES } from './rules'
import { isFelon } from './diplomacy'
import { rebelled } from './scars'
import { NEUTRAL, NO_ONE, SEA } from './types'
import type { Rules } from './rules'
import type { GameState, Grid } from './types'

// The land, its peasants and its gold. At the start no land is anyone's:
// each lord plants his standard where he wants and receives the land round
// it when the opening ends (opening.ts). The rest is one free land, held by
// its villagers, every tile of it taken by a fight. A lord's peasants live
// on his land and hold it; his gold pays the men he raises from them.

/** The largest piece of the land, its tiles joined by their sides: the land a walk reaches. */
function mainLand(grid: Grid): Array<boolean> {
  const piece = new Int32Array(grid.land.length).fill(-1)
  let main = -1
  let most = 0
  grid.land.forEach((on, start) => {
    if (!on || piece[start] >= 0) return
    piece[start] = start
    const queue = [start]
    for (const t of queue)
      for (const n of around(grid, t)) {
        if (!grid.land[n] || piece[n] >= 0) continue
        piece[n] = start
        queue.push(n)
      }
    if (queue.length > most) [main, most] = [start, queue.length]
  })
  return grid.land.map((on, tile) => on && piece[tile] === main)
}

/** A new game: no land anyone's yet, all of it free, held by its villagers; each lord a little gold. */
export function createGame(
  grid: Grid,
  players: number,
  seed: string,
  rules: Rules = RULES,
  /** Each seat's team, or none: every lord for himself. */
  teams: Array<number> = [],
): GameState {
  // Land no walk reaches, an islet cut off by the sea, is no part of the
  // game: no army could ever take it, so it does not count in the share
  // that wins either.
  const land = mainLand(grid)
  const reached = { ...grid, land, area: land.filter(Boolean).length }
  return {
    seed,
    rules,
    grid: reached,
    tick: 0,
    owner: land.map((on) => (on ? NEUTRAL : SEA)),
    works: [],
    players: Array.from({ length: players }, () => ({
      peasants: 0,
      gold: rules.startGold * UNIT,
      alive: true,
      felonUntil: 0,
      tiles: 0,
      coups: {},
      standard: -1,
    })),
    hosts: [],
    alliances: [],
    requests: [],
    offerings: [],
    caravans: [],
    strikes: [],
    scars: [],
    teams: Array.from({ length: players }, (_, seat) => teams[seat] ?? -1),
    winner: NO_ONE,
  }
}

/** The works of a kind a lord holds. */
export function worksOf(state: GameState, lord: number, work: string) {
  return state.works.filter((w) => w.owner === lord && w.work === work).length
}

/** Whether a work stands done and serves: one being built does nothing yet. */
export const standing = (state: GameState, work: GameState['works'][number]) =>
  (work.ready ?? 0) <= state.tick

/** The peasants a lord's land feeds: fewer by the tile as it grows, as the square root of its size. */
function fedByLand(state: GameState, lord: number): number {
  const { land, tiles } = state.rules.peasants
  const held = state.players[lord].tiles
  return isqrt(Math.floor((land * land * UNIT * UNIT * held) / tiles))
}

/** The peasants a lord's land and villages feed: his land, then so many more for each village built. */
export function capOf(state: GameState, lord: number): number {
  const villages = state.works.filter(
    (w) => w.owner === lord && w.work === 'village' && standing(state, w),
  ).length
  return fedByLand(state, lord) + state.rules.peasants.village * villages * UNIT
}

/** The men holding each of a lord's tiles: his peasants spread over his land. */
export function density(state: GameState, lord: number): number {
  const { peasants, tiles } = state.players[lord]
  return Math.floor(peasants / Math.max(1, tiles))
}

/** The peasants a lord loses a tick to sickness: so much of those over what his land and villages feed, one at least while any are. */
export function sicknessOf(state: GameState, lord: number): number {
  const over = state.players[lord].peasants - capOf(state, lord)
  if (over <= 0 || state.rules.sickness === 0) return 0
  const lost = (over * state.rules.sickness) / 100 / TICKS_PER_SECOND
  return Math.min(over, Math.max(UNIT, Math.floor(lost)))
}

/**
 * Each tick, peasants born up to what a lord's land and villages feed; those
 * over it, land or a village lost, an army come home, fall sick and die
 * away. Gold comes only by the merchants (caravans.ts).
 */
export function grow(state: GameState): void {
  state.players.forEach((lord, id) => {
    if (!lord.alive) return
    const cap = capOf(state, id)
    lord.peasants -= sicknessOf(state, id)
    if (lord.peasants >= cap) return
    const born = Math.floor(cap / (state.rules.fillSeconds * TICKS_PER_SECOND))
    lord.peasants = Math.min(cap, lord.peasants + born)
  })
}

/** A tile changes hands, its lords' counts with it. */
export function setOwner(state: GameState, tile: number, owner: number) {
  const was = state.owner[tile]
  if (was >= 0) state.players[was].tiles--
  if (owner >= 0) state.players[owner].tiles++
  state.owner[tile] = owner
}

/** The men holding a free tile: so many in a hundred of what holds the mean lord's tile, never under the floor. */
function neutralHold(state: GameState): number {
  const lords = state.players.filter((p) => p.alive && p.tiles > 0)
  if (lords.length === 0) return 0
  const peasants = lords.reduce((sum, p) => sum + p.peasants, 0)
  const tiles = lords.reduce((sum, p) => sum + p.tiles, 0)
  const half = Math.floor((peasants * state.rules.neutralHold) / 100 / tiles)
  return Math.max(state.rules.neutralFloor, half)
}

/** The men holding a tile: its lord's share of his peasants, half as many while he is a traitor; on free land, half what holds a lord's, more where rebels hold it. */
export function holdOf(state: GameState, tile: number): number {
  const owner = state.owner[tile]
  const { rules } = state
  if (owner === NEUTRAL)
    return rebelled(state, tile)
      ? Math.floor((neutralHold(state) * rules.rebelHold) / 100)
      : neutralHold(state)
  const mark = isFelon(state, owner) ? rules.felonHold : 100
  return Math.floor((density(state, owner) * mark) / 100)
}
