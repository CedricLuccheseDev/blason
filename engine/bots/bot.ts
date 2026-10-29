import { drawInt } from '../numbers'
import { apart, around } from '../grid'
import { capOf, worksOf } from '../land'
import { canStart, hasPicked, standards } from '../opening'
import { NEUTRAL } from '../types'
import { menFor } from '../war'
import { canBuild, priceOf } from '../works'
import { TALK_EVERY, talk } from './talk'
import { attack, war } from './war'
import { SKILLS } from './levels'
import { plot } from './coups'
import type { Level, Skill } from './levels'
import type { Work } from '../rules'
import type { GameState, Order } from '../types'

// The bots, plain on purpose and calm: they read the land as a
// player sees it and click as one would. They take the free domains first,
// striking at their villages; they answer an army striking them by striking its
// lord there, so the two meet; they wage one war at a time, on the
// neighbour whose land is held thinnest and not already hunted by others
// (war.ts), and rest between two attacks; they
// build with the gold left over; now and then a coup (coups.ts). Each has its own boldness and patience,
// drawn from the seed, and the level chosen for the game (levels.ts).

export type Bot = (state: GameState, me: number) => Array<Order>

/** During the opening: of the free domains, the one farthest from the standards already planted; a bot keeps his first. */
function opening(state: GameState, me: number): Array<Order> {
  if (hasPicked(state, me) || state.tick < 20 + (me % 10) * 5) return []
  const planted = standards(state, me)
  let best = -1
  let score = -1
  for (const v of state.villages) {
    if (!canStart(state, me, v)) continue
    const near = planted.reduce(
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
  for (let k = 0; k < 60; k++) {
    const t = drawInt(state.seed, state.owner.length, 'site', me, state.tick, k)
    if (!canBuild(state, me, t, work)) continue
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
  const enemies = [...fronts.keys()].filter((o) => o >= 0)
  // The first market and village before all, free: no gold nor peasants without them.
  const missing = (['market', 'village'] as const).find(
    (w) => worksOf(state, me, w) === 0,
  )
  let work: Work = missing ?? 'village'
  if (!missing) {
    if (drawInt(state.seed, 100, 'build', me, state.tick) >= thrift) return []
    const roll = drawInt(state.seed, 100, 'work', me, state.tick)
    if (roll >= 45) work = 'market'
    if (enemies.length && roll < 25) work = 'castle'
  }
  if (state.players[me].gold < (priceOf(state, me, work) + 40) * 1000) return []
  const borders = enemies.flatMap((o) => fronts.get(o) ?? []).slice(0, 40)
  const tile = placeFor(state, me, work, borders)
  return tile < 0 ? [] : [{ player: me, type: 'build', tile, work }]
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

  return (state, me) => {
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
    const full = state.players[me].peasants * 100 >= capOf(state, me) * patience
    if (state.tick < rest || !full) return []
    const out = state.hosts.filter((h) => h.owner === me).length
    if (out >= worksOf(state, me, 'village')) return []
    const free = fronts.get(NEUTRAL)
    const orders = free
      ? expand(state, me, free)
      : war(state, me, fronts, boldness, skill.slips, skill.hunters)
    if (orders.length)
      rest =
        state.tick +
        Math.floor(
          (((free ? 50 : 60) +
            drawInt(state.seed, 100, 'rest', me, state.tick)) *
            skill.rest) /
            100,
        )
    return orders
  }
}
