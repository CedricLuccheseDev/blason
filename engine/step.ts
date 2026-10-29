import { TICKS_PER_SECOND } from './units'
import { fingerprint } from './numbers'
import { moveCaravans, sendCaravans } from './caravans'
import {
  ally,
  breakAlliance,
  expireDiplomacy,
  offer,
  sideOf,
} from './diplomacy'
import { grow } from './land'
import { grantStarts, pickStart } from './opening'
import { COUPS, WORKS } from './rules'
import { NO_ONE } from './types'
import { clash } from './battle'
import { enclose } from './enclosure'
import { advanceHosts, attack, recall } from './war'
import { shoot } from './volleys'
import { build } from './works'
import { launch, strikeCoups } from './coups'
import type { GameState, Order } from './types'

const MINUTE = 60 * TICKS_PER_SECOND

/** Share of the land that wins, in thousandths: it falls with time. */
export function victoryShare(state: GameState): number {
  const {
    victoryShare: start,
    victoryDropStart,
    victoryDropPerMinute,
  } = state.rules
  if (state.tick < victoryDropStart) return start
  const minutes = Math.floor((state.tick - victoryDropStart) / MINUTE) + 1
  return Math.max(
    state.rules.victoryFloor,
    start - minutes * victoryDropPerMinute,
  )
}

/** Ticks until the share that wins drops again; none once it rests on its floor. */
export function nextDrop(state: GameState): number | null {
  const { victoryDropStart, victoryFloor } = state.rules
  if (victoryShare(state) <= victoryFloor) return null
  if (state.tick < victoryDropStart) return victoryDropStart - state.tick
  return MINUTE - ((state.tick - victoryDropStart) % MINUTE)
}

/** A lord with no land left is out; a lord wins with his share of the land, or as the last one standing. */
/** Whether a lord's side won: himself, or his team. */
export const wonBy = (state: GameState, lord: number): boolean =>
  state.winner !== NO_ONE && sideOf(state, lord) === sideOf(state, state.winner)

function judge(state: GameState): void {
  state.players.forEach((lord, id) => {
    if (!lord.alive || lord.tiles > 0) return
    lord.alive = false
    state.hosts = state.hosts.filter((host) => host.owner !== id)
    state.caravans = state.caravans.filter((c) => c.owner !== id)
    state.alliances = state.alliances.filter((x) => x.a !== id && x.b !== id)
  })
  // A side is a team, its members' land together, or a lord alone; the one
  // left standing, or holding the share, wins, and its lord with the most
  // land is named its winner.
  const sides = new Map<string, Array<number>>()
  state.players.forEach((p, id) => {
    if (!p.alive) return
    const side = sideOf(state, id)
    sides.set(side, [...(sides.get(side) ?? []), id])
  })
  const land = (lords: Array<number>) =>
    lords.reduce((sum, id) => sum + state.players[id].tiles, 0)
  const share = victoryShare(state)
  const standing = [...sides.values()]
  // The last side standing wins a game begun with others; one begun with a
  // single side (a host alone, or every lord in one team) is won by the
  // share alone, not as soon as its opening ends.
  const last = standing.length === 1 && sidesAtStart(state) > 1
  const won = last
    ? standing[0]
    : standing.find((lords) => land(lords) * 1000 >= share * state.grid.area)
  if (!won) return
  state.winner = won.reduce(
    (a, b) => (state.players[b].tiles > state.players[a].tiles ? b : a),
    won[0],
  )
}

/** The sides a game began with: its teams, and its lords alone, of those given a standard at its opening, the fallen among them (an empty seat had none). */
function sidesAtStart(state: GameState): number {
  const sides = new Set<string>()
  state.players.forEach((lord, id) => {
    if (lord.standard >= 0) sides.add(sideOf(state, id))
  })
  return sides.size
}

function isSeat(state: GameState, seat: number): boolean {
  return (
    Number.isInteger(seat) &&
    seat >= 0 &&
    seat < state.players.length &&
    state.players[seat].alive
  )
}

/** The orders there are: any other word, which a distant player could send, is none. */
const KINDS: ReadonlySet<string> = new Set<Order['type']>([
  'pickStart',
  'attack',
  'build',
  'coup',
  'ally',
  'breakAlliance',
  'offering',
  'recall',
])

function isValid(state: GameState, order: Order): boolean {
  if (!KINDS.has(order.type) || !isSeat(state, order.player)) return false
  if (
    order.type === 'ally' ||
    order.type === 'breakAlliance' ||
    order.type === 'offering'
  )
    return isSeat(state, order.target)
  const { tile } = order
  if (!Number.isInteger(tile) || tile < 0 || tile >= state.owner.length)
    return false
  if (order.type === 'attack')
    return Object.hasOwn(state.rules.armies, order.army)
  if (order.type === 'build') return WORKS.includes(order.work)
  if (order.type === 'coup') return COUPS.includes(order.coup)
  return true
}

function apply(state: GameState, order: Order): void {
  if (order.type === 'pickStart') {
    if (state.tick < state.rules.openingTicks)
      pickStart(state, order.player, order.tile)
    return
  }
  if (state.tick < state.rules.openingTicks) return
  if (order.type === 'attack')
    attack(state, order.player, order.tile, order.army)
  else if (order.type === 'build')
    build(state, order.player, order.tile, order.work)
  else if (order.type === 'coup')
    launch(state, order.player, order.tile, order.coup)
  else if (order.type === 'ally') ally(state, order.player, order.target)
  else if (order.type === 'offering') offer(state, order.player, order.target)
  else if (order.type === 'recall') recall(state, order.player, order.tile)
  else breakAlliance(state, order.player, order.target)
}

/** One tick of the world: the orders of this tick, then the rules in turn. */
export function step(state: GameState, orders: Array<Order> = []) {
  if (state.winner !== NO_ONE) return
  for (const order of orders) if (isValid(state, order)) apply(state, order)
  if (state.tick === state.rules.openingTicks - 1) grantStarts(state)
  if (state.tick >= state.rules.openingTicks) {
    grow(state)
    clash(state)
    shoot(state)
    advanceHosts(state)
    strikeCoups(state)
    enclose(state)
    sendCaravans(state)
    moveCaravans(state)
    expireDiplomacy(state)
    judge(state)
  }
  state.tick += 1
}

/** The same game, ordered the same way, gives the same fingerprint each tick: what it was made of, its tiles and its rules, which never change, left out. */
export function stateHash(state: GameState): string {
  const still = { setup: undefined, grid: null, rules: null }
  return fingerprint(JSON.stringify({ ...state, ...still }))
}
