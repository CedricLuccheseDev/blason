import { UNIT } from './units'
import { apart } from './grid'
import { worksOf } from './land'
import type { Work } from './rules'
import type { GameState } from './types'

// The works, as in OpenFront: built anywhere on one's own land, one a
// place, kept clear of each other. A village feeds more peasants, a castle
// makes the land round it hold three times better, a market brings gold.
// Each costs double for every one of its kind the lord holds already.

/** A work's price for a lord, in gold: doubled for each one of its kind he holds, up to a ceiling. */
export function priceOf(state: GameState, lord: number, work: Work): number {
  const held = worksOf(state, lord, work)
  const doublings = Math.min(held, state.rules.priceDoublings)
  return state.rules.workPrice * (1 << doublings)
}

/** Whether the lord may build on the tile: his own, clear of every other work. */
export function canBuild(state: GameState, lord: number, tile: number) {
  if (state.owner[tile] !== lord) return false
  const gap = state.rules.workGap
  return state.works.every((w) => apart(state.grid, w.tile, tile) >= gap * gap)
}

/** A work on one of the lord's tiles, for its price. */
export function build(
  state: GameState,
  lord: number,
  tile: number,
  work: Work,
): void {
  if (!canBuild(state, lord, tile)) return
  const price = priceOf(state, lord, work) * UNIT
  const player = state.players[lord]
  if (player.gold < price) return
  player.gold -= price
  state.works.push({ work, tile, owner: lord })
}
