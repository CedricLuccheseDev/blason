import { drawInt } from '../numbers'
import { apart, around } from '../grid'
import { canStart, capOf, density, hasPicked } from '../land'
import { isAllied } from '../diplomacy'
import { NEUTRAL } from '../types'
import { menFor } from '../war'
import { canBuild, priceOf } from '../works'
import { TALK_EVERY, talk } from './talk'
import type { Army, Work } from '../rules'
import type { GameState, Order } from '../types'

// The bots, plain on purpose and calm: they read the land as a
// player sees it and click as one would. They take the free domains first,
// striking at their villages; they answer an army striking them by striking its
// lord there, so the two meet; they wage one war at a time, on the
// neighbour whose land is held thinnest, and rest between two attacks; they
// build with the gold left over. Each has its own boldness and patience,
// drawn from the seed.

export type Bot = (state: GameState, me: number) => Array<Order>

/** A bot thinks once a second, each at its own moment, and notices an attack after a moment. */
const EVERY = 10
const NOTICE = 15

const attack = (player: number, tile: number, army: Army): Order => ({
  player,
  type: 'attack',
  tile,
  army,
})

/** During the opening: of the free domains, the one farthest from the lords already settled. */
function opening(state: GameState, me: number): Array<Order> {
  if (hasPicked(state, me) || state.tick < 20 + (me % 10) * 5) return []
  const taken = state.owner.flatMap((o, t) => (o >= 0 ? [t] : []))
  let best = -1
  let score = -1
  for (const v of state.villages) {
    if (!canStart(state, v)) continue
    const near = taken.reduce(
      (m, o) => Math.min(m, apart(state.grid, o, v)),
      1e12,
    )
    const s = near + drawInt(state.seed, 2000, 'pick', me, v)
    if (s > score) {
      score = s
      best = v
    }
  }
  return best < 0 ? [] : [{ player: me, type: 'pickStart', tile: best }]
}

/** The tiles of each other lord, or of the free land, that border mine. */
function frontier(state: GameState, me: number) {
  const found = new Map<number, Set<number>>()
  state.owner.forEach((o, t) => {
    if (o !== me) return
    for (const n of around(state.grid, t)) {
      const other = state.owner[n]
      if (other === me || other < NEUTRAL) continue
      const set = found.get(other) ?? new Set<number>()
      set.add(n)
      found.set(other, set)
    }
  })
  return new Map([...found].map(([o, set]) => [o, [...set]]))
}

/** An army striking me, noticed after a moment: strike its lord where it fights, so the armies meet. */
function answer(state: GameState, me: number, seen: Map<number, number>) {
  for (const lord of seen.keys())
    if (!state.hosts.some((h) => h.owner === lord && h.target === me))
      seen.delete(lord)
  for (const host of state.hosts) {
    if (host.target !== me) continue
    const at = seen.get(host.owner) ?? state.tick
    seen.set(host.owner, at)
    if (state.tick - at < NOTICE || menFor(state, me, 'host') < 10_000) continue
    // One army at a time against the same lord: no new one every second.
    if (state.hosts.some((h) => h.owner === me && h.target === host.owner))
      continue
    // Where it fights now, on a tile it still holds; none left, nothing to strike.
    const front = host.edge.find((t) => state.owner[t] === host.owner)
    if (front !== undefined) return [attack(me, front, 'host')]
  }
  return []
}

/** Where a work goes: a castle facing the enemy, the others as far from the borders as can be. */
function placeFor(
  state: GameState,
  me: number,
  work: Work,
  borders: Array<number>,
): number {
  let best = -1
  let score = -Infinity
  for (let k = 0; k < 60; k++) {
    const t = drawInt(state.seed, state.owner.length, 'site', me, state.tick, k)
    if (!canBuild(state, me, t)) continue
    const near = borders.reduce(
      (m, b) => Math.min(m, apart(state.grid, b, t)),
      1e12,
    )
    const s = work === 'castle' ? -near : near
    if (s > score) {
      score = s
      best = t
    }
  }
  return best
}

/** With the gold left over, now and then a work: a castle when an enemy borders, else a village or a market. */
function construct(
  state: GameState,
  me: number,
  fronts: Map<number, Array<number>>,
  thrift: number,
): Array<Order> {
  if (drawInt(state.seed, 100, 'build', me, state.tick) >= thrift) return []
  const enemies = [...fronts.keys()].filter((o) => o >= 0)
  const roll = drawInt(state.seed, 100, 'work', me, state.tick)
  let work: Work = roll < 50 ? 'village' : 'market'
  if (enemies.length && roll < 30) work = 'castle'
  if (state.players[me].gold < (priceOf(state, me, work) + 40) * 1000) return []
  const borders = enemies.flatMap((o) => fronts.get(o) ?? []).slice(0, 40)
  const tile = placeFor(state, me, work, borders)
  return tile < 0 ? [] : [{ player: me, type: 'build', tile, work }]
}

/** The free land, a domain at a time: the one whose village stands nearest an edge drawn, struck at its village, or where it touches mine once its village is gone. */
function expand(state: GameState, me: number, free: Array<number>) {
  const edge = free[drawInt(state.seed, free.length, 'edge', me, state.tick)]
  const realm = state.realm[edge]
  const aim = state.villages.includes(realm) ? realm : edge
  return [attack(me, aim, 'host')]
}

/** The neighbour whose land is held thinnest, and how thin. */
function thinnest(
  state: GameState,
  me: number,
  fronts: Map<number, Array<number>>,
) {
  let prey = -1
  let thin = Infinity
  for (const owner of fronts.keys()) {
    if (owner < 0 || isAllied(state, me, owner)) continue
    const held = density(state, owner)
    if (held < thin) {
      thin = held
      prey = owner
    }
  }
  return { prey, thin }
}

/** One war at a time, on the neighbour held thinnest, when it holds thicker; it waits for the gold to pay most of the army. */
function war(
  state: GameState,
  me: number,
  fronts: Map<number, Array<number>>,
  boldness: number,
): Array<Order> {
  const { prey, thin } = thinnest(state, me, fronts)
  const mine = density(state, me)
  if (prey < 0 || mine * 100 < thin * (130 - boldness / 2)) return []
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

export function createBot(self: number, seed: string): Bot {
  /** Out of 100: how full its gauge must be before it strikes, how bold it is, how readily it builds. */
  const patience = 70 + drawInt(seed, 25, 'patience', self)
  const boldness = drawInt(seed, 100, 'boldness', self)
  const thrift = 20 + drawInt(seed, 40, 'thrift', self)
  const seen = new Map<number, number>()
  let rest = 0

  return (state, me) => {
    if ((state.tick + me) % EVERY !== 0) return []
    if (state.tick < state.rules.openingTicks) return opening(state, me)
    const answered = answer(state, me, seen)
    if (answered.length) return answered
    const fronts = frontier(state, me)
    if ((state.tick + me) % TALK_EVERY < EVERY) {
      const said = talk(state, me, fronts, boldness)
      if (said.length) return said
    }
    const built = construct(state, me, fronts, thrift)
    if (built.length) return built
    const full = state.players[me].peasants * 100 >= capOf(state, me) * patience
    if (state.tick < rest || !full) return []
    if (state.hosts.some((h) => h.owner === me)) return []
    const free = fronts.get(NEUTRAL)
    const orders = free
      ? expand(state, me, free)
      : war(state, me, fronts, boldness)
    if (orders.length)
      rest =
        state.tick +
        (free ? 50 : 200) +
        drawInt(state.seed, 100, 'rest', me, state.tick)
    return orders
  }
}
