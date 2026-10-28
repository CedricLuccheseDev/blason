import { UNIT } from './units'
import { apart } from './grid'
import { worksOf } from './land'
import type { Work } from './rules'
import type { GameState } from './types'

// The works, one resource each: a village feeds the peasants, a market
// brings gold, a barracks sends the armies, a castle makes the land round it
// hold three times better. Built anywhere on one's own land, a few tiles
// from any other work so that none lies on another, castles further apart. The first village, market and
// barracks cost nothing, so that a lord can always start again from nothing;
// each one more costs double the one before.

/** A work's price for a lord, in gold. */
export function priceOf(state: GameState, lord: number, work: Work): number {
  const { workPrice, firstFree, priceDoublings } = state.rules
  const held = worksOf(state, lord, work)
  const free = firstFree.includes(work)
  if (free && held === 0) return 0
  const doublings = Math.min(held - (free ? 1 : 0), priceDoublings)
  return workPrice[work] * (1 << doublings)
}

/** Whether the lord may build this work on the tile: his own, a few tiles from any work, and a castle clear of every other castle. */
export function canBuild(
  state: GameState,
  lord: number,
  tile: number,
  work: Work,
): boolean {
  if (state.owner[tile] !== lord) return false
  const { castleGap, workGap } = state.rules
  return state.works.every((w) => {
    const gap = work === 'castle' && w.work === 'castle' ? castleGap : workGap
    return apart(state.grid, w.tile, tile) >= gap * gap
  })
}

/** A work on one of the lord's tiles, for its price. */
export function build(
  state: GameState,
  lord: number,
  tile: number,
  work: Work,
): void {
  if (!canBuild(state, lord, tile, work)) return
  const price = priceOf(state, lord, work) * UNIT
  const player = state.players[lord]
  if (player.gold < price) return
  player.gold -= price
  state.works.push({ work, tile, owner: lord })
}
