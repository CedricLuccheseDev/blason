import { UNIT } from './units'
import { createGame, setOwner } from './land'
import { RULES } from './rules'
import { step } from './step'
import type { Army } from './rules'
import type { GameState, Grid, Order } from './types'

// What the engine's tests share: a land of plain tiles, a game past its
// opening with nothing born nor earned, lords set on their tiles with their
// men and gold, and orders.

/** A land of so many tiles across and down, all of it land. */
export function field(width: number, height = 1): Grid {
  const land = Array.from({ length: width * height }, () => true)
  return { width, height, size: 4, land, area: land.length }
}

/** A game past its opening, no village, no income, nothing born: men and gold counted exactly. */
export function playing(grid: Grid, players = 2): GameState {
  const state = createGame(grid, players, 'test', {
    ...RULES,
    marketGold: 0,
    fillSeconds: Number.MAX_SAFE_INTEGER,
  })
  state.tick = state.rules.openingTicks
  state.villages = []
  return state
}

export function hold(state: GameState, owner: number, tiles: Array<number>) {
  for (const t of tiles) setOwner(state, t, owner)
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
