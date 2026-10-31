import { UNIT } from './units'
import { apart } from './grid'
import { worksOf } from './land'
import { burnt } from './scars'
import { byWater } from './ships'
import type { Work } from './rules'
import type { GameState, Grid } from './types'

// The works: a village feeds the peasants and levies the armies, a market
// brings gold, a castle makes the land round it fight one for one, a port
// trades by sea and fits out the warships. Built anywhere on one's own land,
// a port only by the water, a few tiles from any other work so that none
// lies on another, castles further apart. The first village and market cost
// nothing, so that a lord can always start again from nothing; each one more
// costs double the one before.

/** A work's price for a lord, in gold. */
export function priceOf(state: GameState, lord: number, work: Work): number {
  const { workPrice, firstFree, priceDoublings } = state.rules
  const held = worksOf(state, lord, work)
  const free = firstFree.includes(work)
  if (free && held === 0) return 0
  const doublings = Math.min(held - (free ? 1 : 0), priceDoublings)
  return workPrice[work] * (1 << doublings)
}

/** Whether the lord may build this work on the tile: his own, a few tiles from any work, a castle clear of every other castle, a port by the water. */
export function canBuild(
  state: GameState,
  lord: number,
  tile: number,
  work: Work,
): boolean {
  if (state.owner[tile] !== lord || burnt(state, tile)) return false
  if (work === 'port' && !byWater(state.grid, tile)) return false
  const { castleGap, workGap } = state.rules
  return state.works.every((w) => {
    const gap = work === 'castle' && w.work === 'castle' ? castleGap : workGap
    return apart(state.grid, w.tile, tile) >= gap * gap
  })
}

/** The tiles nearer a work than the gap, shut. */
function shut(room: Uint8Array, grid: Grid, tile: number, gap: number) {
  const [x, y] = [tile % grid.width, Math.floor(tile / grid.width)]
  for (let dy = 1 - gap; dy < gap; dy++)
    for (let dx = 1 - gap; dx < gap; dx++) {
      const [nx, ny] = [x + dx, y + dy]
      const off = nx < 0 || ny < 0 || nx >= grid.width || ny >= grid.height
      if (!off && dx * dx + dy * dy < gap * gap) room[ny * grid.width + nx] = 0
    }
}

/**
 * Every tile where the lord may build this work, 1 where he may: what
 * `canBuild` says of each, read for the whole map at once, each work's room
 * stamped round it, so that the screen may light them all as he holds it
 * (« illumine les endroits où tu peux poser, ou assombrie le reste »).
 */
export function roomFor(
  state: GameState,
  lord: number,
  work: Work,
): Uint8Array {
  const { grid, owner } = state
  const room = new Uint8Array(owner.length)
  owner.forEach((o, t) => {
    if (o === lord && !burnt(state, t) && (work !== 'port' || byWater(grid, t)))
      room[t] = 1
  })
  const { castleGap, workGap } = state.rules
  for (const w of state.works)
    shut(
      room,
      grid,
      w.tile,
      work === 'castle' && w.work === 'castle' ? castleGap : workGap,
    )
  return room
}

/** A work on one of the lord's tiles, for its price; it serves once built. */
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
  const ready = state.tick + state.rules.buildTicks[work]
  state.works.push({ work, tile, owner: lord, ready })
}
