import { apart } from './grid'
import type { GameState, Scar } from './types'

// What the coups leave on the land (coups.ts): free land held by rebels,
// who hold it better than the free land holds and are never encircled, until
// a lord takes it back; ashes where no one may build until they cool.

/** Whether a tile lies under a scar of this kind still lasting. */
function under(state: GameState, tile: number, kind: Scar['kind']) {
  return state.scars.some(
    (s) =>
      s.kind === kind &&
      (s.until < 0 || s.until > state.tick) &&
      apart(state.grid, s.tile, tile) <= s.radius * s.radius,
  )
}

/** Whether a free tile is held by rebels. */
export const rebelled = (state: GameState, tile: number) =>
  state.owner[tile] < 0 && under(state, tile, 'rebels')

/** Whether a tile lies in ashes, where no one may build. */
export const burnt = (state: GameState, tile: number) =>
  under(state, tile, 'ash')

/** The scars gone: ashes cooled, rebels whose land is all taken back. */
export function heal(state: GameState) {
  state.scars = state.scars.filter((s) =>
    s.kind === 'ash' ? s.until > state.tick : rebelled(state, s.tile),
  )
}
