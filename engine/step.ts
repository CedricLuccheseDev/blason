import { TICKS_PER_SECOND } from './units'
import { fingerprint } from './numbers'
import { moveCaravans, sendCaravans } from './caravans'
import { ally, breakAlliance, expireDiplomacy } from './diplomacy'
import { grow } from './land'
import { grantStarts, pickStart } from './opening'
import { COUPS, WORKS } from './rules'
import { NO_ONE } from './types'
import { clash } from './battle'
import { enclose } from './enclosure'
import { advanceHosts, attack } from './war'
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
function judge(state: GameState): void {
  state.players.forEach((lord, id) => {
    if (!lord.alive || lord.tiles > 0) return
    lord.alive = false
    state.hosts = state.hosts.filter((host) => host.owner !== id)
    state.caravans = state.caravans.filter((c) => c.owner !== id)
    state.alliances = state.alliances.filter((x) => x.a !== id && x.b !== id)
  })
  const standing = state.players.flatMap((p, id) => (p.alive ? [id] : []))
  const share = victoryShare(state)
  const winner =
    standing.length === 1
      ? standing[0]
      : standing.find(
          (id) => state.players[id].tiles * 1000 >= share * state.grid.area,
        )
  if (winner !== undefined) state.winner = winner
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
])

function isValid(state: GameState, order: Order): boolean {
  if (!KINDS.has(order.type) || !isSeat(state, order.player)) return false
  if (order.type === 'ally' || order.type === 'breakAlliance')
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

/** The same game, ordered the same way, gives the same fingerprint each tick. */
export function stateHash(state: GameState): string {
  return fingerprint(JSON.stringify({ ...state, grid: null, rules: null }))
}
