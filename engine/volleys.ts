import { UNIT } from './units'
import { apart } from './grid'
import type { GameState, Host } from './types'

// The castles' arrows (docs/RULES.md). On top of making the land round it
// hold, as the combat table says, a castle looses a volley every few seconds,
// from the moment it stands, at each enemy army fighting in its zone: an
// army striking its lord whose front, the tiles it took last, lies within
// the castle's radius. Each volley takes a share of the army's men, one at
// least; an army brought to nothing is gone, as one beaten in battle. An
// army striking someone else passes by, as in the battles.

type Building = GameState['works'][number]

/** Whether a castle looses a volley at a tick: once it stands, every so many ticks from the tick it was done. */
export function shootsAt(
  state: GameState,
  castle: Building,
  tick: number,
): boolean {
  const ready = castle.ready ?? 0
  return (
    castle.work === 'castle' &&
    tick >= ready &&
    (tick - ready) % state.rules.volleyTicks === 0
  )
}

/** The armies a castle's arrows reach: those striking its lord whose front lies within its radius. */
export function underFire(state: GameState, castle: Building): Array<Host> {
  const r = state.rules.castleRadius
  return state.hosts.filter(
    (host) =>
      host.men > 0 &&
      host.target === castle.owner &&
      host.edge.some((t) => apart(state.grid, castle.tile, t) <= r * r),
  )
}

/** The men a volley kills in an army of so many: so many in a hundred, one at least, never more than it has. */
function tollOf(state: GameState, men: number): number {
  const share = Math.floor((men * state.rules.volleyToll) / 100)
  return Math.min(men, Math.max(UNIT, share))
}

/** A tick of the castles: each whose time it is looses its volley at every enemy army fighting in its zone. */
export function shoot(state: GameState): void {
  for (const castle of state.works) {
    if (!shootsAt(state, castle, state.tick)) continue
    for (const host of underFire(state, castle))
      host.men -= tollOf(state, host.men)
  }
}
