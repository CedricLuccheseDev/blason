import { drawInt } from './numbers'
import { standing } from './land'
import { atWar, isAllied, warsOf } from './diplomacy'
import { around } from './grid'
import { relay } from './relays'
import { tradeLinks } from './network'
import { NEUTRAL } from './types'
import type { Caravan, GameState } from './types'
import type { Link } from './network'

// The merchants, as OpenFront's trains (docs/RULES.md): now and then a
// market sends a caravan to a market of another lord drawn by lot among all
// those the trade network reaches (network.ts), the far ones and the allies'
// more often, and less often the more caravans its lord has on the roads. It
// goes along the network's roads, through as many markets as it takes, over
// any land but a lord's at war with its own (« On fait comme OpenFront ? »,
// « go »); each village it passes by is a relay, which pays its lord and the
// caravan's, as OpenFront's stations do. It makes one journey at a walk;
// arriving, it pays both markets, more the longer its road, twice as much
// between allies. An enemy who takes a tile of the road ahead takes the
// caravan: it turns to his nearest market and pays him alone, or is
// plundered if he has none it can reach.

/** Tiles a road may cross for this lord: any land but a lord's at war with him (« On fait comme OpenFront ? », « go »), who takes the caravan there. */
function open(state: GameState, lord: number, tile: number): boolean {
  const owner = state.owner[tile]
  return (
    owner === NEUTRAL || (owner >= 0 && !warsOf(state).has(lord * 64 + owner))
  )
}

/** Tiles searched at most for a road, so a market far from all costs little. */
const SEARCH = 30000

/** The road walked back from a tile to where it began. */
function walkBack(before: Map<number, number>, end: number, from: number) {
  const road = [end, from]
  for (let p = before.get(from) ?? -1; p >= 0; p = before.get(p) ?? -1)
    road.push(p)
  return road.reverse()
}

/** The roads from a tile to the markets it may reach, nearest first, by the steps a road may take. */
function roadsFrom(
  state: GameState,
  start: number,
  goals: Set<number>,
  may: (from: number, to: number) => boolean,
): Array<Array<number>> {
  const roads: Array<Array<number>> = []
  const before = new Map<number, number>([[start, -1]])
  const queue = [start]
  for (const t of queue) {
    if (queue.length > SEARCH) break
    for (const n of around(state.grid, t)) {
      if (before.has(n)) continue
      // The step first: a market is only reached by a step the road may take.
      if (!may(t, n)) continue
      before.set(n, t)
      if (goals.has(n)) roads.push(walkBack(before, n, t))
      queue.push(n)
    }
  }
  return roads
}

/** A journey: the market it ends at, its road there, and the lords whose markets it goes through. */
type Journey = { end: number; road: Array<number>; via: Array<number> }

/** Of the journeys found, the shortest not yet gone on from. */
function nearest(found: Map<number, Journey>, done: Set<number>) {
  let next: Journey | null = null
  for (const j of found.values())
    if (!done.has(j.end) && (!next || j.road.length < next.road.length))
      next = j
  return next
}

/** A journey gone on by a road of the network from the market it ends at, if the road leaves from there and the lord may take it. */
function onward(
  state: GameState,
  lord: number,
  from: Journey,
  link: Link,
  owners: Map<number, number>,
): Journey | null {
  if (link.a !== from.end && link.b !== from.end) return null
  const to = link.a === from.end ? link.b : link.a
  const owner = owners.get(to) ?? NEUTRAL
  const road = link.a === from.end ? link.road : [...link.road].reverse()
  // Open land, or the land of a lord whose market it goes to or through.
  const may = (t: number) =>
    open(state, lord, t) ||
    state.owner[t] === owner ||
    from.via.includes(state.owner[t])
  if (!road.every(may)) return null
  const via = owner === lord ? from.via : [...from.via, owner]
  return { end: to, road: [...from.road, ...road.slice(1)], via }
}

/**
 * The journeys from a market along the network, shortest first: a road is
 * taken where it crosses only the lord's land, his allies' and the free land,
 * or the land of the lord whose market it goes to.
 */
function journeys(state: GameState, lord: number, from: number) {
  const owners = new Map(
    state.works
      .filter((w) => w.work === 'market' && standing(state, w))
      .map((w) => [w.tile, w.owner]),
  )
  const found = new Map<number, Journey>([
    [from, { end: from, road: [from], via: [] }],
  ])
  const done = new Set<number>()
  const links = tradeLinks(state)
  for (let next = nearest(found, done); next; next = nearest(found, done)) {
    done.add(next.end)
    for (const link of links) {
      const on = onward(state, lord, next, link, owners)
      if (on && (found.get(on.end)?.road.length ?? Infinity) > on.road.length)
        found.set(on.end, on)
    }
  }
  // Its lord's other markets too (« les marchés internes ne s'envoient pas
  // de marchands ? »), never a lord's it is at war with (« les caravanes
  // vont jusqu'aux marchés des royaumes où on est en guerre ? »).
  return [...found.values()].filter(
    (j) => j.end !== from && !atWar(state, lord, owners.get(j.end) ?? NEUTRAL),
  )
}

/** What a caravan's lord makes of trade with the market's, in percent: an ally's more, his own less. */
function tradeWith(state: GameState, lord: number, to: number): number {
  if (to === lord) return state.rules.homeTrade
  return isAllied(state, lord, to) ? state.rules.allyTrade : 100
}

/** A journey drawn by lot among those a market may make: the longer and the allies' more often. */
function drawJourney(
  state: GameState,
  lord: number,
  market: number,
): Journey | null {
  const all = journeys(state, lord, market)
  const weights = all.map(
    (j) => j.road.length * tradeWith(state, lord, state.owner[j.end]),
  )
  const total = weights.reduce((a, b) => a + b, 0)
  if (total === 0) return null
  let lot = drawInt(state.seed, total, 'caravan', state.tick, market)
  for (const [i, journey] of all.entries()) {
    lot -= weights[i]
    if (lot < 0) return journey
  }
  return null
}

/** Whether a market sends a caravan this time: less likely the more its lord has on the roads. */
function sends(state: GameState, lord: number, market: number): boolean {
  const { caravanCrowd } = state.rules
  const out = state.caravans.filter((c) => c.owner === lord).length
  const lot = drawInt(
    state.seed,
    caravanCrowd + out,
    'send',
    state.tick,
    market,
  )
  return lot < caravanCrowd
}

/** Each market sends a caravan now and then, each at its own moment. */
export function sendCaravans(state: GameState) {
  const { caravanTicks, caravanGold } = state.rules
  for (const work of state.works) {
    if (work.work !== 'market' || !standing(state, work)) continue
    if ((state.tick + work.tile * 7) % caravanTicks !== 0) continue
    if (!sends(state, work.owner, work.tile)) continue
    const journey = drawJourney(state, work.owner, work.tile)
    if (!journey) continue
    const { road, via } = journey
    const to = state.owner[journey.end]
    const bonus = tradeWith(state, work.owner, to)
    const gold = Math.floor((road.length * caravanGold * bonus) / 100)
    state.caravans.push({ owner: work.owner, to, via, road, along: 0, gold })
  }
}

/**
 * A caravan taken at a tile of its road by the lord who took the tile: it
 * goes on to that tile, then to his nearest market by his open land, and pays
 * him alone; none if he has no market it can reach, and it is plundered.
 */
function seize(state: GameState, c: Caravan, at: number): boolean {
  const taker = state.owner[c.road[at]]
  const goals = new Set(
    state.works
      .filter(
        (w) => w.work === 'market' && w.owner === taker && standing(state, w),
      )
      .map((w) => w.tile),
  )
  if (goals.has(c.road[at])) {
    c.road = c.road.slice(0, at + 1)
  } else {
    const may = (_: number, to: number) => open(state, taker, to)
    const road = roadsFrom(state, c.road[at], goals, may).at(0)
    if (!road) return false
    c.road = [...c.road.slice(0, at), ...road]
  }
  c.owner = taker
  c.to = taker
  c.via = [taker]
  c.taken = at
  return true
}

/** The caravans a tick further: taken where an enemy holds the road ahead, paying both markets when they arrive. */
export function moveCaravans(state: GameState) {
  state.caravans = state.caravans.filter((c) => {
    if (!state.players[c.owner].alive) return false
    c.along += state.rules.caravanPace
    const here = Math.floor(c.along / 1000)
    const last = c.road.length - 1
    // Taken, the road behind the place it was taken is no longer looked at.
    const from = Math.max(Math.min(here, last - 1), c.taken ?? 0)
    for (let i = from; i < c.road.length - 1; i++) {
      const tile = c.road[i]
      if (!open(state, c.owner, tile) && !c.via.includes(state.owner[tile]))
        if (!seize(state, c, i)) return false
    }
    relay(state, c, c.road[Math.min(here, last)])
    if (here < c.road.length - 1) return true
    const end = c.road[c.road.length - 1]
    const market = state.works.find(
      (w) => w.tile === end && w.work === 'market',
    )
    // A market gone (burnt, taken down) pays no one: the trade is lost.
    if (!market) return false
    state.players[c.owner].gold += c.gold
    if (market.owner !== c.owner) state.players[market.owner].gold += c.gold
    return false
  })
}
