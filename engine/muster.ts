import { UNIT } from './units'
import { apart, around } from './grid'
import { capOf, standing } from './land'
import { isAllied } from './diplomacy'
import { hired } from './armies'
import type { Army, Work } from './rules'
import type { GameState, Host } from './types'

// Raising an army: each village levies one army at a time from its people,
// so a lord has as many armies out as he has villages; each market hires one
// company of mercenaries at a time. An attack is sent from the free village
// (or market) nearest the front and marches there over its lord's own land
// and his allies', seen by all, so that its target has the time to answer.

/** What a man of an army costs, in thousandths of gold: a mercenary his hire, a peasant raised the levy's price, nothing today. */
const priceOf = (state: GameState, army: Army) =>
  hired(state, army) ? state.rules.mercenaryPrice : state.rules.menPrice

/** The men an army would take now: its share of the peasants, or for mercenaries of the cap; as many as the gold pays. */
export function menFor(state: GameState, player: number, army: Army): number {
  const lord = state.players[player]
  const pool = hired(state, army) ? capOf(state, player) : lord.peasants
  const share = Math.floor((pool * state.rules.armies[army]) / 100)
  const price = priceOf(state, army)
  if (price === 0) return share
  return Math.min(share, Math.floor((lord.gold * UNIT) / price))
}

/** What so many men of an army cost, in thousandths of gold. */
export function costOf(state: GameState, men: number, army: Army): number {
  return Math.floor((men * priceOf(state, army)) / UNIT)
}

/** The lord's works of a kind (villages, markets) built and with no army out, the nearest the tile first. */
export function freeWorks(
  state: GameState,
  lord: number,
  tile: number,
  work: Work = 'village',
): Array<number> {
  const busy = new Set(state.hosts.map((h) => h.from))
  return state.works
    .filter(
      (w) =>
        w.owner === lord &&
        w.work === work &&
        standing(state, w) &&
        !busy.has(w.tile),
    )
    .map((w) => w.tile)
    .sort(
      (a, b) =>
        apart(state.grid, a, tile) - apart(state.grid, b, tile) || a - b,
    )
}

/** Whether an army of the lord may walk a tile: his own land, or an ally's. */
export const passable = (state: GameState, lord: number, tile: number) =>
  state.owner[tile] === lord || isAllied(state, lord, state.owner[tile])

/** The road from a village to a tile touching the entry, over the lord's own land and his allies'; none if it is cut off. */
export function roadTo(
  state: GameState,
  lord: number,
  from: number,
  entry: number,
): Array<number> | null {
  const goals = new Set(
    around(state.grid, entry).filter((t) => passable(state, lord, t)),
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
      if (before.has(n) || !passable(state, lord, n)) continue
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
