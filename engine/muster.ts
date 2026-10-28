import { apart, around } from './grid'
import { standing } from './land'
import type { GameState, Host } from './types'

// Raising an army: each village levies one army at a time from its people,
// so a lord has as many armies out as he has villages. An attack is sent
// from the free village nearest the front and marches there over its lord's
// own land,
// seen by all, so that its target has the time to answer.

/** The lord's villages built and with no army out, the nearest the tile first. */
export function freeVillages(
  state: GameState,
  lord: number,
  tile: number,
): Array<number> {
  const busy = new Set(state.hosts.map((h) => h.from))
  return state.works
    .filter(
      (w) =>
        w.owner === lord &&
        w.work === 'village' &&
        standing(state, w) &&
        !busy.has(w.tile),
    )
    .map((w) => w.tile)
    .sort(
      (a, b) =>
        apart(state.grid, a, tile) - apart(state.grid, b, tile) || a - b,
    )
}

/** The road from a village to one of the lord's tiles touching the entry, over his own land; none if it is cut off. */
export function roadTo(
  state: GameState,
  lord: number,
  from: number,
  entry: number,
): Array<number> | null {
  const goals = new Set(
    around(state.grid, entry).filter((t) => state.owner[t] === lord),
  )
  if (goals.size === 0 || state.owner[from] !== lord) return null
  const before = new Map<number, number>([[from, -1]])
  const queue = [from]
  for (const t of queue) {
    if (goals.has(t)) {
      const road = [t]
      for (let p = before.get(t) ?? -1; p >= 0; p = before.get(p) ?? -1)
        road.push(p)
      return road.reverse()
    }
    for (const n of around(state.grid, t)) {
      if (before.has(n) || state.owner[n] !== lord) continue
      before.set(n, t)
      queue.push(n)
    }
  }
  return null
}

/** Whether an army is still on its road to the front. */
export const marching = (host: Host) =>
  host.along < (host.road.length - 1) * 1000

/** The tile an army stands on: on its road while it marches, at its front once it fights there. */
export function positionOf(host: Host): number {
  if (marching(host)) return host.road[Math.floor(host.along / 1000)]
  return host.edge.at(0) ?? host.road.at(-1) ?? host.entry
}
