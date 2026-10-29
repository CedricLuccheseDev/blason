import type { Army } from './rules'
import type { GameState, Host } from './types'

// What an army is made of, and where its men go once it is done: levied at a
// village, its men are the lord's peasants and come home to them; hired at a
// market, they are mercenaries, paid in gold, who go their way.

/** Whether an army is hired at a market for gold rather than levied from the peasants. */
export const hired = (state: GameState, army: Army): boolean =>
  state.rules.raisedAt[army] === 'market'

/** An army done: its survivors go home to the peasants, the mercenaries their way. */
export function disband(state: GameState, host: Host): void {
  if (!hired(state, host.army)) state.players[host.owner].peasants += host.men
  host.men = 0
}
