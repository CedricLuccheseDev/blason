import { drawInt } from '../numbers'
import { apart, around } from '../grid'
import { capOf, worksOf } from '../land'
import { canStart, hasPicked, spotFor } from '../opening'
import { NEUTRAL } from '../types'
import { hired } from '../armies'
import { menFor } from '../muster'
import { canBuild, priceOf } from '../works'
import { byWater } from '../ships'
import { navy } from './fleet'
import { TALK_EVERY, talk } from './talk'
import { attack, canHire, war } from './war'
import { SKILLS } from './levels'
import { plot } from './coups'
import { freeAfar } from './shores'
import type { Level, Skill } from './levels'
import type { Work } from '../rules'
import type { GameState, Order } from '../types'

// The bots, plain on purpose and calm: they read the land as a
// player sees it and click as one would. They plant their standards where
// there is room and take the free land first; they answer an army striking
// them by striking its lord there, so the two meet; they wage one war at a
// time, on the neighbour whose land is held thinnest and not already hunted
// by others (war.ts), and rest between two attacks; they
// build with the gold left over; now and then a coup (coups.ts). Each has its own boldness and patience,
// drawn from the seed, and the level chosen for the game (levels.ts).

export type Bot = (state: GameState, me: number) => Array<Order>

/** During the opening: of a few tiles of the land drawn from the seed, the one with the most room round it, the farthest from the standards planted; a bot keeps his first. */
function opening(state: GameState, me: number): Array<Order> {
  if (hasPicked(state, me) || state.tick < 20 + (me % 10) * 5) return []
  const tile = spotFor(state, me, 40, 'plant', me, state.tick)
  if (tile < 0 || !canStart(state, me, tile)) return []
  return [{ player: me, type: 'pickStart', tile }]
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

/** An army striking me, noticed after a moment: strike its lord where it fights, so the armies meet; a bot that slips lets it be a while. */
function answer(
  state: GameState,
  me: number,
  seen: Map<number, number>,
  skill: Skill,
) {
  for (const lord of seen.keys())
    if (!state.hosts.some((h) => h.owner === lord && h.target === me))
      seen.delete(lord)
  for (const host of state.hosts) {
    if (host.target !== me) continue
    const at = seen.get(host.owner) ?? state.tick
    seen.set(host.owner, at)
    if (state.tick - at < skill.notice || menFor(state, me, 'host') < 10_000)
      continue
    if (drawInt(state.seed, 100, 'let', me, state.tick) < skill.slips) continue
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
  // A port only by the water: drawn among its shore, not the whole map.
  const shore = work === 'port' ? shoreOf(state, me) : null
  for (let k = 0; k < 60; k++) {
    const t = shore
      ? (shore[drawInt(state.seed, shore.length, 'shore', me, state.tick, k)] ??
        -1)
      : drawInt(state.seed, state.owner.length, 'site', me, state.tick, k)
    if (t < 0 || !canBuild(state, me, t, work)) continue
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

/** The lord's tiles by the water, where a port may stand. */
function shoreOf(state: GameState, me: number): Array<number> {
  const shore: Array<number> = []
  state.owner.forEach((o, t) => {
    if (o === me && byWater(state.grid, t)) shore.push(t)
  })
  return shore
}

/** A bot builds as a player would, at the measure of its land: beyond its first two works, one for so many tiles it holds, those it took with the land counted. */
const ROOM = 300

/** Whether its works already fill its land, at a bot's measure. */
const crowded = (state: GameState, me: number) =>
  state.works.filter((w) => w.owner === me).length >=
  2 + Math.floor(state.players[me].tiles / ROOM)

/** With the gold left over, now and then a work, while its land has room for one: a castle when an enemy borders, else a village or a market. */
function construct(
  state: GameState,
  me: number,
  fronts: Map<number, Array<number>>,
  thrift: number,
): Array<Order> {
  const enemies = [...fronts.keys()].filter((o) => o >= 0)
  // The first market and village before all, free: no gold nor peasants without them.
  const missing = (['market', 'village'] as const).find(
    (w) => worksOf(state, me, w) === 0,
  )
  let work: Work = missing ?? 'village'
  if (!missing) {
    if (crowded(state, me)) return []
    if (drawInt(state.seed, 100, 'build', me, state.tick) >= thrift) return []
    const roll = drawInt(state.seed, 100, 'work', me, state.tick)
    if (roll >= 45) work = 'market'
    // A port, one at first, more as the land grows, if it has a shore.
    const ports = 1 + Math.floor(state.players[me].tiles / (4 * ROOM))
    if (roll >= 85 && worksOf(state, me, 'port') < ports) work = 'port'
    if (enemies.length && roll < 25) work = 'castle'
  }
  if (state.players[me].gold < (priceOf(state, me, work) + 40) * 1000) return []
  const borders = enemies.flatMap((o) => fronts.get(o) ?? []).slice(0, 40)
  const tile = placeFor(state, me, work, borders)
  return tile < 0 ? [] : [{ player: me, type: 'build', tile, work }]
}

/** Whether it has an army to send: a village with none out, or, every village's out, the gold to hire mercenaries at a market. */
function armed(state: GameState, me: number): boolean {
  const levied = state.hosts.filter(
    (h) => h.owner === me && !hired(state, h.army),
  ).length
  return levied < worksOf(state, me, 'village') || canHire(state, me)
}

/** The free land, at a point of its edge drawn, struck well inside. */
function expand(state: GameState, me: number, free: Array<number>) {
  const edge = free[drawInt(state.seed, free.length, 'edge', me, state.tick)]
  return [attack(me, edge, 'host')]
}

export function createBot(
  self: number,
  seed: string,
  level: Level = 'normal',
): Bot {
  const skill = SKILLS[level]
  /** Out of 100: how full its gauge must be before it strikes, how bold it is, how readily it builds. */
  const patience = 55 + drawInt(seed, 30, 'patience', self) + skill.patience
  const boldness = drawInt(seed, 100, 'boldness', self)
  const thrift = 20 + drawInt(seed, 40, 'thrift', self) + skill.thrift
  const seen = new Map<number, number>()
  let rest = 0
  /** The tick before which it acts no more: its pause after its last act. */
  let ready = 0

  /** Its army out, once its peasants are full enough and its rest over: to the free land, or to war; its rest begins. */
  const strike = (
    state: GameState,
    me: number,
    fronts: Map<number, Array<number>>,
  ): Array<Order> => {
    const full = state.players[me].peasants * 100 >= capOf(state, me) * patience
    if (state.tick < rest || !full || !armed(state, me)) return []
    // The free land at its border; else, the free land it reaches by boat.
    const free = fronts.get(NEUTRAL) ?? freeAfar(state, me) ?? undefined
    const orders = free
      ? expand(state, me, free)
      : war(state, me, fronts, boldness, skill.slips, skill.hunters)
    if (orders.length === 0) return orders
    const drawn = drawInt(state.seed, 100, 'rest', me, state.tick)
    rest =
      state.tick + Math.floor((((free ? 50 : 60) + drawn) * skill.rest) / 100)
    return orders
  }

  const decide: Bot = (state, me) => {
    if ((state.tick + me) % skill.every !== 0) return []
    if (state.tick < state.rules.openingTicks) return opening(state, me)
    const answered = answer(state, me, seen, skill)
    if (answered.length) return answered
    const plotted = skill.slips < 20 ? plot(state, me) : []
    if (plotted.length) return plotted
    const fronts = frontier(state, me)
    if ((state.tick + me) % TALK_EVERY < skill.every) {
      const said = talk(state, me, fronts, boldness)
      if (said.length) return said
    }
    const built = construct(state, me, fronts, thrift)
    if (built.length) return built
    const fitted = navy(state, me)
    if (fitted.length) return fitted
    return strike(state, me, fronts)
  }

  // A pause after each act, drawn within its level's: never two at once.
  return (state, me) => {
    if (state.tick < ready) return []
    const orders = decide(state, me)
    if (orders.length > 0) {
      const [least, most] = skill.pause
      ready =
        state.tick +
        least +
        drawInt(state.seed, most - least + 1, 'pause', me, state.tick)
    }
    return orders
  }
}
