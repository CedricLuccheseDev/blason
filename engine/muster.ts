import { UNIT } from './units'
import { apart, eachAround } from './grid'
import { capOf, standing } from './land'
import { isAllied } from './diplomacy'
import { hired } from './armies'
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
 * over the land his armies walk (walkers): `visit` sees each tile walked in
 * the order an army reaches it, with how many tiles it is from the nearest of
 * them, and stops the search by returning false. What comes back is the road
 * to any tile walked, from the village it is nearest.
 */
export function marchOut(
  state: GameState,
  lord: number,
  sites: Array<number>,
  visit: (tile: number, steps: number) => boolean,
): (tile: number) => Array<number> {
  const walks = walkers(state, lord)
  const { owner, grid } = state
  const { width } = grid
  // Each tile's steps from the nearest village, -1 not walked, and that village.
  const steps = new Int32Array(owner.length).fill(-1)
  const root = new Int32Array(owner.length).fill(-1)
  const queue = sites.filter((site) => owner[site] === lord)
  for (const site of queue) [steps[site], root[site]] = [0, site]
  let from = -1
  const reach = (next: number) => {
    const o = owner[next]
    if (steps[next] !== -1 || o < 0 || !walks[o]) return
    steps[next] = steps[from] + 1
    root[next] = root[from]
    queue.push(next)
  }
  // A ring of tiles at a time, each a tile further than the one before.
  for (const tile of queue) {
    from = tile
    if (!visit(from, steps[from])) break
    eachAround(grid, from, reach)
  }
  // Of the roads as short, the one nearest the straight line from its
  // village: a regular stair rather than a right angle (« il fait faire des
  // angles droits par les alliés »), as long to walk.
  return (tile) => {
    const road = [tile]
    const village = root[tile]
    if (village < 0) return road
    const [ax, ay] = [tile % width, Math.floor(tile / width)]
    const [bx, by] = [village % width, Math.floor(village / width)]
    const off = (t: number) =>
      Math.abs(
        ((t % width) - ax) * (by - ay) -
          (Math.floor(t / width) - ay) * (bx - ax),
      )
    let at = tile
    while (steps[at] > 0) {
      let next = -1
      eachAround(grid, at, (n) => {
        if (steps[n] !== steps[at] - 1 || root[n] !== village) return
        if (next < 0 || off(n) < off(next)) next = n
      })
      at = next
      road.push(at)
    }
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
