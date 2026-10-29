import { courseFor } from '../../engine'
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
