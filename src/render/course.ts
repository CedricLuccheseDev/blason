import { courseFor, freeWorks, menFor } from '../../engine'
import type { Army, GameState } from '../../engine'

// The course under the pointer, worked out once a tick: the aim draws its
// road (layers/aim.ts) and the cartouche says where it enters (aiming.ts)
// from the same search over the whole map, never twice.

type Course = ReturnType<typeof courseFor>

let last = { key: '', course: null as Course }

/** The engine's course for the player's army at a tile, as it stands this tick. */
export function courseNow(
  state: GameState,
  player: number,
  tile: number,
  army: Army,
): Course {
  const key = `${state.tick}:${player}:${tile}:${army}`
  if (key !== last.key)
    last = { key, course: courseFor(state, player, tile, army) }
  return last.course
}

/** Whether a click would send the army: a village (or a market) with none out, and men to raise (« si tu peux pas envoyer d'armée ne met pas le chemin du village »). */
export const canSend = (state: GameState, player: number, army: Army) =>
  freeWorks(state, player, 0, state.rules.raisedAt[army]).length > 0 &&
  menFor(state, player, army) > 0
