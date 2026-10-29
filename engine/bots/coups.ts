import { drawInt } from '../numbers'
import { coupPrice, launchSite } from '../coups'
import { positionOf } from '../muster'
import { isAllied } from '../diplomacy'
import type { Coup } from '../rules'
import type { GameState, Order } from '../types'

// The bots' coups, played as a person would: rarely, and only against a lord
// they are at war with. Arrows on an army biting their land; the trebuchet on
// an enemy market within reach; the troublemaker on the enemy's work
// farthest from his armies. Never with gold the next work needs.

/** Out of 100, how often a bot that could launch a coup does, each time it thinks. */
const NERVE = 6

const order = (player: number, tile: number, coup: Coup): Order => ({
  player,
  type: 'coup',
  tile,
  coup,
})

/** Whether a lord has the gold for a coup and some to spare. */
function affords(state: GameState, me: number, coup: Coup) {
  return state.players[me].gold >= (coupPrice(state, me, coup) + 100) * 1000
}

/** Arrows on an enemy army in my land, if one is in reach. */
function volley(state: GameState, me: number): Array<Order> {
  if (!affords(state, me, 'archers')) return []
  for (const host of state.hosts) {
    if (host.target !== me) continue
    const at = positionOf(host)
    if (launchSite(state, me, at, 'archers') >= 0)
      return [order(me, at, 'archers')]
  }
  return []
}

/** the trebuchet on a market of the lords I am at war with, or the troublemaker on one of their works. */
function strike(state: GameState, me: number, foes: Set<number>) {
  for (const coup of ['trebuchet', 'troublemaker'] as const) {
    if (!affords(state, me, coup)) continue
    const marks = state.works.filter(
      (w) =>
        foes.has(w.owner) &&
        (coup === 'troublemaker' || w.work === 'market') &&
        launchSite(state, me, w.tile, coup) >= 0,
    )
    if (marks.length === 0) continue
    const pick = drawInt(state.seed, marks.length, 'coup', me, state.tick)
    return [order(me, marks[pick].tile, coup)]
  }
  return []
}

/** Now and then a coup, against a lord whose army strikes me or whom mine strike. */
export function plot(state: GameState, me: number): Array<Order> {
  if (drawInt(state.seed, 100, 'nerve', me, state.tick) >= NERVE) return []
  const foes = new Set(
    state.hosts.flatMap((h) => {
      if (h.owner === me && h.target >= 0) return [h.target]
      if (h.target === me) return [h.owner]
      return []
    }),
  )
  for (const foe of foes) if (isAllied(state, me, foe)) foes.delete(foe)
  if (foes.size === 0) return []
  const shot = volley(state, me)
  return shot.length ? shot : strike(state, me, foes)
}
