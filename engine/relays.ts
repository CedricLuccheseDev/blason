import { isAllied } from './diplomacy'
import { apart } from './grid'
import { standing } from './land'
import type { Caravan, GameState } from './types'

// The relays (« les villages sur les chemins des marchands comme sur
// openfront », « On fait comme OpenFront ? », « go »): a village within a
// few tiles of a caravan's road, as OpenFront's stations, pays once a
// caravan its own lord and the caravan's, nothing taken from the merchant:
// allies the most, another lord less, a lord's own caravan least.

/** What a relay pays each of its lord and the caravan's, in thousandths: the same lord's less, allies' more (OpenFront's stations). */
export function relayGold(state: GameState, caravan: number, village: number) {
  const { self, other, ally } = state.rules.relayGold
  if (caravan === village) return self
  return isAllied(state, caravan, village) ? ally : other
}

/** The villages a caravan passes by, each paying once, as a relay, its lord and the caravan's (the same lord once). */
export function relay(state: GameState, c: Caravan, at: number) {
  const reach = state.rules.relayReach
  for (const w of state.works) {
    if (w.work !== 'village' || !standing(state, w)) continue
    if (c.stops?.includes(w.tile)) continue
    if (apart(state.grid, w.tile, at) > reach * reach) continue
    c.stops = [...(c.stops ?? []), w.tile]
    const gold = relayGold(state, c.owner, w.owner)
    state.players[w.owner].gold += gold
    if (w.owner !== c.owner) state.players[c.owner].gold += gold
  }
}
