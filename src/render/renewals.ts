import { canRenew } from '../../engine'
import type { Anchor } from './heralds'
import type { Spot } from './fronts'
import type { GameState } from '../../engine'

/**
 * The seal of each of my alliances in its last moments, when it asks to be
 * renewed, for the HUD to lay beside my ally's name (PactSeal.tsx), at the
 * heart of his land while it is not written.
 */
export function renewalsOf(
  state: GameState,
  me: number,
  besideOf: (lord: number) => Spot | null,
  placeOf: (lord: number) => Spot | undefined,
): Array<Anchor> {
  return state.alliances.flatMap((x): Array<Anchor> => {
    if ((x.a !== me && x.b !== me) || !canRenew(state, x)) return []
    const ally = x.a === me ? x.b : x.a
    const at = besideOf(ally) ?? placeOf(ally)
    return at ? [{ key: `pact:${ally}`, kind: 'pact', lord: ally, at }] : []
  })
}
