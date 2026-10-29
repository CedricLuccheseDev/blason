import { UNIT } from './units'
import { createGame, setOwner } from './land'
import { RULES } from './rules'
import { botsSetup } from './setup'
import { step } from './step'
import type { Level } from './bots/levels'
import type { Army } from './rules'
import type { GameSetup, GameState, Grid, Order } from './types'

// What the engine's tests share: a land of plain tiles, a game past its
// opening with nothing born nor earned, lords set on their tiles with their
// men and gold, and orders.

/** A land of so many tiles across and down, all of it land. */
export function field(width: number, height = 1): Grid {
  const land = Array.from({ length: width * height }, () => true)
  return { width, height, size: 4, land, area: land.length }
}

/** A game of so many lords on the seed, each in his team if any is given, his bot of the level. */
export function setupOf(
  lords: number,
  {
    teams = [],
    ...more
  }: {
    seed?: string
    teams?: Array<number>
    level?: Level
    opening?: number
  } = {},
): GameSetup {
  const setup = botsSetup({ seed: 'test', ...more, lords })
  const seats = setup.seats.map((seat, id) => ({
    ...seat,
    team: teams[id] ?? -1,
  }))
  return { ...setup, seats }
}

/** A game past its opening, no village, no income, nothing born and no one sick: men and gold counted exactly. */
export function playing(grid: Grid, players = 2): GameState {
  // The tests' lands are narrow, every piece by the edge: none is taken
  // for being small (seaWalled), only for being ringed.
  const state = createGame(grid, setupOf(players), {
    ...RULES,
    fillSeconds: Number.MAX_SAFE_INTEGER,
    sickness: 0,
    seaWalled: 0,
  })
  state.tick = state.rules.openingTicks
  return state
}

export function hold(state: GameState, owner: number, tiles: Array<number>) {
  for (const t of tiles) setOwner(state, t, owner)
}

/** A village of the lord's on the tile, to levy his armies from. */
export function muster(state: GameState, lord: number, tile: number) {
  state.works.push({ work: 'village', tile, owner: lord })
}

export function endow(
  state: GameState,
  lord: number,
  peasants: number,
  gold = 1000,
) {
  state.players[lord].peasants = peasants * UNIT
  state.players[lord].gold = gold * UNIT
}

export function run(
  state: GameState,
  ticks: number,
  orders: Array<Order> = [],
) {
  step(state, orders)
  for (let i = 1; i < ticks; i++) step(state)
}

export const attack = (player: number, tile: number, army: Army): Order => ({
  player,
  type: 'attack',
  tile,
  army,
})

export const owned = (state: GameState, lord: number) =>
  state.owner.flatMap((o, t) => (o === lord ? [t] : []))
