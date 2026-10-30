import { NEUTRAL, courseFor, freeWorks, menFor } from '../../engine'
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

/**
 * The way an army goes from where it enters to the tile aimed at, over the
 * land it takes (its target's, and the free land on its way to a lord it
 * does not touch), tile by tile round the high mountains and the sea, so
 * that the aim draws it as it will go (« les pointillets traverses encore
 * les montagnes »); none if no such way.
 */
export function wayTo(
  state: GameState,
  from: number,
  to: number,
  through: boolean,
): Array<number> {
  const target = state.owner[to]
  const open = (t: number) =>
    state.owner[t] === target || (through && state.owner[t] === NEUTRAL)
  const before = new Map<number, number>([[from, -1]])
  const queue = [from]
  const { width, land } = state.grid
  const visit = (t: number, n: number) => {
    if (before.has(n) || !open(n)) return
    before.set(n, t)
    queue.push(n)
  }
  for (const t of queue) {
    if (t === to) break
    const x = t % width
    if (x > 0) visit(t, t - 1)
    if (x < width - 1) visit(t, t + 1)
    if (t >= width) visit(t, t - width)
    if (t + width < land.length) visit(t, t + width)
  }
  if (!before.has(to)) return []
  const way = [to]
  for (let t = before.get(to) ?? -1; t >= 0; t = before.get(t) ?? -1)
    way.push(t)
  return way.reverse()
}
