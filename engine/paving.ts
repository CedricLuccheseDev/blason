import { tradeLinks } from './network'
import type { GameState } from './types'

// The ground an army marches on (« les forêts ralentissent les unités et les
// routes accélèrent … il faut que le moteur de déplacement décide si c'est +
// rapide de passer par les routes », 31/10): the merchants' roads, which
// speed it, the woods, which slow it; what a step costs, so that its march
// takes the way soonest, not the shortest.

const paved = new WeakMap<object, Uint8Array>()

/** The tiles of the merchants' roads, 1 on a road; read again when the network is laid anew. */
export function roadsOf(state: GameState): Uint8Array {
  const links = tradeLinks(state)
  const known = paved.get(links)
  if (known) return known
  const roads = new Uint8Array(state.owner.length)
  for (const { road } of links) for (const t of road) roads[t] = 1
  paved.set(links, roads)
  return roads
}

/** What a step onto a tile costs an army on the march, in hundredths of a plain tile: less on a road, more in the woods, a road through the woods a road. */
export function stepCost(state: GameState, tile: number): number {
  if (roadsOf(state)[tile]) return Math.floor(10_000 / state.rules.roadPace)
  if (state.grid.wood?.[tile])
    return Math.floor(10_000 / state.rules.forestPace)
  return 100
}
