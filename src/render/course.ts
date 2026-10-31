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

/** Tiles a way is sought over at most: past them, none is drawn, rather than the page searching a great map's whole free land each tick (« sur europe au bout de 10s », « ça plante »). */
const MOST = 200_000

/** The search's buffers, made once for the map and marked anew each search, never cleared, so that a search makes no garbage. */
let marks = new Int32Array(0)
let before = new Int32Array(0)
let queue = new Int32Array(0)
let round = 0

/**
 * The way an army goes from where it enters to the tile aimed at, over the
 * land it takes (its target's, and the free land on its way to a lord it
 * does not touch), tile by tile round the high mountains and the sea, so
 * that the aim draws it as it will go (« les pointillets traverses encore
 * les montagnes »); none if no such way, or none near enough.
 */
export function wayTo(
  state: GameState,
  from: number,
  to: number,
  through: boolean,
): Array<number> {
  const { owner } = state
  if (marks.length !== owner.length) {
    marks = new Int32Array(owner.length)
    before = new Int32Array(owner.length)
    queue = new Int32Array(owner.length)
    round = 0
  }
  round += 1
  const target = owner[to]
  const { width } = state.grid
  let size = 0
  const visit = (t: number, n: number) => {
    if (marks[n] === round) return
    const o = owner[n]
    if (o !== target && !(through && o === NEUTRAL)) return
    marks[n] = round
    before[n] = t
    queue[size++] = n
  }
  marks[from] = round
  before[from] = -1
  queue[size++] = from
  for (let i = 0; i < size && size < MOST; i++) {
    const t = queue[i]
    if (t === to) break
    const x = t % width
    if (x > 0) visit(t, t - 1)
    if (x < width - 1) visit(t, t + 1)
    if (t >= width) visit(t, t - width)
    if (t + width < owner.length) visit(t, t + width)
  }
  if (marks[to] !== round) return []
  const way = [to]
  for (let t = before[to]; t >= 0; t = before[t]) way.push(t)
  return way.reverse()
}
