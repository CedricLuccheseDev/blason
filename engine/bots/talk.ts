import { drawInt } from '../numbers'
import { density } from '../land'
import type { GameState, Order } from '../types'

// The bots' diplomacy: whom to ally with, when to renew, when to
// betray.

/** Diplomacy is weighed every five seconds. */
export const TALK_EVERY = 50

/** The lords this one fights now, either way. */
function foesOf(state: GameState, me: number): Set<number> {
  const foes = new Set<number>()
  for (const h of state.hosts) {
    if (h.owner === me) foes.add(h.target)
    if (h.target === me) foes.add(h.owner)
  }
  return foes
}

function alliesOf(state: GameState, me: number): Array<number> {
  return state.alliances.flatMap((x) => {
    if (x.a === me) return [x.b]
    return x.b === me ? [x.a] : []
  })
}

/** Its alliance offered to the strongest neighbour it is not fighting, while it has none. */
function offer(
  state: GameState,
  me: number,
  fronts: Map<number, Array<number>>,
  foes: Set<number>,
): Array<Order> {
  const neighbours = [...fronts.keys()].filter((o) => o >= 0 && !foes.has(o))
  neighbours.sort(
    (a, b) => state.players[b].tiles - state.players[a].tiles || a - b,
  )
  const strongest = neighbours.at(0)
  if (strongest === undefined) return []
  if (state.requests.some((r) => r.from === me && r.to === strongest)) return []
  return [{ player: me, type: 'ally', target: strongest }]
}

/** Its alliances renewed, unless bold enough to let them lapse. */
function renewals(
  state: GameState,
  me: number,
  allies: Array<number>,
  boldness: number,
): Array<Order> {
  return allies.flatMap((other) => {
    const roll = drawInt(state.seed, 100, 'renew', me, other, state.tick)
    return roll * 2 >= boldness
      ? [{ player: me, type: 'ally' as const, target: other }]
      : []
  })
}

/**
 * The bot's diplomacy, as a person's: it accepts the offers of those it is
 * not fighting while it has fewer than two allies, offers its own to the
 * strongest neighbour while it has none, renews what it holds unless bold
 * enough to let it lapse, and, bolder still, betrays an ally whose land is
 * held much thinner than its own, to fall on it.
 */
export function talk(
  state: GameState,
  me: number,
  fronts: Map<number, Array<number>>,
  boldness: number,
): Array<Order> {
  const foes = foesOf(state, me)
  const allies = alliesOf(state, me)
  const mine = density(state, me)
  for (const other of allies) {
    const weak = fronts.has(other) && density(state, other) * 2 < mine
    if (weak && boldness > 60)
      return [{ player: me, type: 'breakAlliance', target: other }]
  }
  const orders = renewals(state, me, allies, boldness)
  if (allies.length < 2)
    for (const r of state.requests)
      if (r.to === me && !foes.has(r.from))
        orders.push({ player: me, type: 'ally', target: r.from })
  if (allies.length === 0) orders.push(...offer(state, me, fronts, foes))
  return orders
}
