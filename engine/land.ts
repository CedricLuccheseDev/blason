import { TICKS_PER_SECOND, UNIT } from './units'
import { isqrt } from './numbers'
import { around } from './grid'
import { RULES } from './rules'
import { isFelon } from './diplomacy'
import { rebelled } from './scars'
import { NEUTRAL, NO_ONE, SEA } from './types'
import type { Rules } from './rules'
import type { GameSetup, GameState, Grid } from './types'

// The land, its peasants and its gold. At the start no land is anyone's:
// each lord plants his standard where he wants and receives the land round
// it when the opening ends (opening.ts). The rest is one free land, held by
// its villagers, every tile of it taken by a fight. A lord's peasants live
// on his land and hold it; his gold pays the men he raises from them.

/**
 * The land an army can reach: the largest piece, its tiles joined by their
 * sides, where a walk goes, and every other the water touches, where the
 * boats land (crossing.ts); not a piece the high mountains close all round.
 */
function reachedLand(grid: Grid): Array<boolean> {
  const piece = new Int32Array(grid.land.length).fill(-1)
  const wet = new Set<number>()
  const sizes = new Map<number, number>()
  let main = -1
  let most = 0
  grid.land.forEach((on, start) => {
    if (!on || piece[start] >= 0) return
    piece[start] = start
    const queue = [start]
    for (const t of queue)
      for (const n of around(grid, t)) {
        if (grid.water[n]) wet.add(start)
        if (!grid.land[n] || piece[n] >= 0) continue
        piece[n] = start
        queue.push(n)
      }
    sizes.set(start, queue.length)
    if (queue.length > most) [main, most] = [start, queue.length]
  })
  return grid.land.map(
    (on, tile) =>
      on &&
      (piece[tile] === main ||
        (wet.has(piece[tile]) && (sizes.get(piece[tile]) ?? 0) >= ISLE)),
  )
}

/** The fewest tiles an island keeps to be in the game: a speck the water touches, a shore's crumb cut off by the dead land, is not. */
const ISLE = 20

/**
 * A new game, as its setup says, a lord a seat, but for the empty ones: no
 * land anyone's yet, all of it free, held by its villagers; each lord a
 * little gold. The figures
 * are the rules' unless the arena or a test tries others; the setup's
 * opening is laid over them.
 */
export function createGame(
  grid: Grid,
  setup: GameSetup,
  rules: Rules = RULES,
): GameState {
  // Land no army reaches, a valley the high mountains close, is no part of
  // the game: no army could ever take it, so it does not count in the share
  // that wins either. The islands are, since the boats reach them.
  const land = reachedLand(grid)
  const reached = { ...grid, land, area: land.filter(Boolean).length }
  return {
    setup,
    seed: setup.seed,
    rules: { ...rules, openingTicks: setup.opening },
    grid: reached,
    tick: 0,
    owner: land.map((on) => (on ? NEUTRAL : SEA)),
    works: [],
    players: setup.seats.map((seat) => ({
      peasants: 0,
      gold: rules.startGold * UNIT,
      // A seat no bot plays and no person holds yet is empty: no lord
      // there, until a person takes it in the opening (takeSeat).
      alive: seat.person || seat.bot !== null,
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
    ships: [],
    strikes: [],
    scars: [],
    teams: setup.seats.map((seat) => seat.team),
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

/** A work passed to another lord with its tile: idle a while before it serves him (rules.ts, seizedTicks), as a work being built is. */
export function seize(
  state: GameState,
  work: GameState['works'][number],
  lord: number,
) {
  if (work.owner === lord) return
  work.owner = lord
  work.ready = Math.max(work.ready ?? 0, state.tick + state.rules.seizedTicks)
}

/** The peasants a lord's land feeds: fewer by the tile as it grows, as the square root of its size. */
export function fedByLand(state: GameState, lord: number): number {
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
