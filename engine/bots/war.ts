import { drawInt } from '../numbers'
import { density } from '../land'
import { isAllied } from '../diplomacy'
import { menFor } from '../war'
import type { Army } from '../rules'
import type { GameState, Order } from '../types'

// The bots' wars: whom to strike, and with which army. A lord its host could
// sweep away whole first, else the neighbour whose land is held thinnest; a
// lord already struck by as many others as the level allows is left alone,
// so that no one is hunted from every side at once; a bot that slips
// strikes a neighbour drawn by lot, whenever, short of men.

export const attack = (player: number, tile: number, army: Army): Order => ({
  player,
  type: 'attack',
  tile,
  army,
})

/** Whether so many other lords' armies strike a lord already, mine apart. */
function hunted(state: GameState, me: number, lord: number, hunters: number) {
  const by = new Set<number>()
  for (const host of state.hosts)
    if (host.target === lord && host.owner !== me) by.add(host.owner)
  return by.size >= hunters
}

/** The lords bordering mine that I may strike: no ally, none already hunted. */
function preys(
  state: GameState,
  me: number,
  fronts: Map<number, Array<number>>,
  hunters: number,
): Array<number> {
  return [...fronts.keys()].filter(
    (owner) =>
      owner >= 0 &&
      !isAllied(state, me, owner) &&
      !hunted(state, me, owner, hunters),
  )
}

/** The neighbour whose land is held thinnest, and how thin. */
function thinnest(state: GameState, open: Array<number>) {
  let prey = -1
  let thin = Infinity
  for (const owner of open) {
    const held = density(state, owner)
    if (held < thin) {
      thin = held
      prey = owner
    }
  }
  return { prey, thin }
}

/** The neighbour with the fewest men, if its host outnumbers them all: none, -1. */
function weakest(state: GameState, me: number, open: Array<number>): number {
  const men = menFor(state, me, 'host')
  let found = -1
  for (const owner of open) {
    const held = state.players[owner].peasants
    if (held < men && (found < 0 || held < state.players[found].peasants))
      found = owner
  }
  return found
}

/** A slip: a war on an enemy neighbour drawn by lot, at once, whatever its men. */
function blunder(
  state: GameState,
  me: number,
  fronts: Map<number, Array<number>>,
): Array<Order> {
  const foes = [...fronts.keys()].filter(
    (o) => o >= 0 && !isAllied(state, me, o),
  )
  if (foes.length === 0) return []
  const foe = foes[drawInt(state.seed, foes.length, 'blunder', me, state.tick)]
  const cells = fronts.get(foe) ?? []
  const at = cells[drawInt(state.seed, cells.length, 'stray', me, state.tick)]
  return [attack(me, at, 'raid')]
}

/** One war at a time, on the neighbour held thinnest, when it holds thicker; it waits for the gold to pay most of the army; a bot may slip, out of 100 so often; a lord struck by so many hunters already is left alone. */
export function war(
  state: GameState,
  me: number,
  fronts: Map<number, Array<number>>,
  boldness: number,
  slips = 0,
  hunters = 1,
): Array<Order> {
  if (drawInt(state.seed, 100, 'slip', me, state.tick) < slips)
    return blunder(state, me, fronts)
  const open = preys(state, me, fronts, hunters)
  // A neighbour its host could sweep away whole is struck first, however
  // thick its land is held: a lord reduced to a corner is finished off.
  const last = weakest(state, me, open)
  if (last >= 0) {
    const cells = fronts.get(last) ?? []
    const at = cells[drawInt(state.seed, cells.length, 'end', me, state.tick)]
    return [attack(me, at, 'host')]
  }
  const { prey, thin } = thinnest(state, open)
  const mine = density(state, me)
  if (prey < 0 || mine * 100 < thin * (115 - boldness / 2)) return []
  let army: Army = 'host'
  const roll = drawInt(state.seed, 100, 'army', me, state.tick)
  if (roll < 20) army = 'raid'
  else if (boldness > 60 && mine > thin * 1.5) army = 'ban'
  const share = (state.players[me].peasants * state.rules.armies[army]) / 100
  if (menFor(state, me, army) * 10 < share * 8) return []
  const cells = fronts.get(prey) ?? []
  const aim = cells[drawInt(state.seed, cells.length, 'aim', me, state.tick)]
  return [attack(me, aim, army)]
}
