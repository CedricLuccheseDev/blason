import { UNIT } from './units'
import { apart, eachAround } from './grid'
import { capOf, standing } from './land'
import { isAllied } from './diplomacy'
import { hired } from './armies'
import { pop, push } from './heap'
import { stepCost } from './paving'
import type { Army, Work } from './rules'
import type { GameState, Host } from './types'

// Raising an army: each village levies one army at a time from its people,
// so a lord has as many armies out as he has villages; each market hires one
// company of mercenaries at a time. An attack is sent from the free village
// (or market) nearest the front by the march, and marches there over its
// lord's own land and his allies', seen by all, so that its target has the
// time to answer.

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

/** Whose land the lord's armies walk, lord by lord: his own, and his allies'. */
export const walkers = (state: GameState, lord: number): Array<boolean> =>
  state.players.map((_, p) => p === lord || isAllied(state, lord, p))

/**
 * The marches out of the lord's villages (or markets) given, all at once,
 * over the land his armies walk (walkers), each the way soonest, the ground
 * counted (paving.ts: the roads speed it, the woods slow it, « il faut
 * calculer par rapport au terrain »): `visit` sees each tile walked in the
 * order an army reaches it, with what its march there costs, in hundredths
 * of a plain tile, from the nearest of them, and stops the search by
 * returning false. What comes back is the road to any tile walked, from the
 * village it is soonest from.
 */
export function marchOut(
  state: GameState,
  lord: number,
  sites: Array<number>,
  visit: (tile: number, cost: number) => boolean,
): (tile: number) => Array<number> {
  const walks = walkers(state, lord)
  const { owner, grid } = state
  // Each tile's cost from the nearest village, -1 not reached, and the tile before it.
  const cost = new Int32Array(owner.length).fill(-1)
  const before = new Int32Array(owner.length).fill(-1)
  const done = new Uint8Array(owner.length)
  const queue: Array<[number, number]> = []
  for (const site of sites)
    if (owner[site] === lord) {
      cost[site] = 0
      push(queue, [0, site])
    }
  let from = -1
  const reach = (next: number) => {
    const o = owner[next]
    if (done[next] || o < 0 || !walks[o]) return
    const c = cost[from] + stepCost(state, next)
    if (cost[next] !== -1 && cost[next] <= c) return
    cost[next] = c
    before[next] = from
    push(queue, [c, next])
  }
  for (let next = pop(queue); next; next = pop(queue)) {
    from = next[1]
    if (done[from]) continue
    done[from] = 1
    if (!visit(from, cost[from])) break
    eachAround(grid, from, reach)
  }
  return (tile) => {
    const road = [tile]
    for (let at = before[tile]; at >= 0; at = before[at]) road.push(at)
    return road.reverse()
  }
}

/** How far an army goes on the march a tick, in thousandths of a tile: the armies' pace, faster for a raid, slower for the levy. */
export function paceOf(state: GameState, host: Pick<Host, 'army'>): number {
  return Math.floor(
    (state.rules.marchPace * state.rules.armySpeed[host.army]) / 100,
  )
}

/** Whether an army is still on its road to the front. */
export const marching = (host: Host) =>
  host.along < (host.road.length - 1) * 1000

/** The tile an army stands on: on its road while it marches, at its front once it fights there. */
export function positionOf(host: Host): number {
  if (marching(host)) return host.road[Math.floor(host.along / 1000)]
  return host.edge.at(0) ?? host.road.at(-1) ?? host.entry
}
