import { around } from './grid'
import { drawInt } from './numbers'
import { standing } from './land'
import { isAllied, isFriendly } from './diplomacy'
import { NEUTRAL } from './types'
import type { Caravan, GameState } from './types'

// The merchants, as OpenFront's trade ships (docs/RULES.md): now and then a
// market sends a caravan to a market of another lord drawn by lot among all
// those a road reaches, the far ones and the allies' more often, and less
// often the more caravans its lord has on the roads. The road goes through
// its lord's land, his allies' and the free land, entering at the last the
// land of the lord it trades with; any other lord bars the way. It makes one
// journey at a walk; arriving, it pays both markets, more the longer its
// road, twice as much between allies. An enemy who takes a tile of the road
// ahead takes the caravan: it turns to his nearest market and pays him alone,
// or is plundered if he has none it can reach.

/** Tiles a road may cross for this lord: his, his allies', free land. */
function open(state: GameState, lord: number, tile: number): boolean {
  const owner = state.owner[tile]
  return owner === NEUTRAL || (owner >= 0 && isFriendly(state, lord, owner))
}

/** Tiles searched at most for a road, so a market far from all costs little. */
const SEARCH = 30000

/**
 * Whether a road may go on from one tile to the next: through open land, or
 * into another lord's land, then only within it, the market it goes to
 * being there; never on the sea.
 */
function canStep(state: GameState, lord: number, from: number, to: number) {
  const owner = state.owner[to]
  if (open(state, lord, from)) return owner >= NEUTRAL
  return owner === state.owner[from]
}

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

/** A road drawn by lot among those a market reaches: the longer and the allies' more often. */
function drawRoad(
  state: GameState,
  lord: number,
  market: number,
): Array<number> | null {
  const goals = new Set(
    state.works
      .filter(
        (w) => w.work === 'market' && w.owner !== lord && standing(state, w),
      )
      .map((w) => w.tile),
  )
  if (goals.size === 0) return null
  const may = (from: number, to: number) => canStep(state, lord, from, to)
  const roads = roadsFrom(state, market, goals, may)
  const weights = roads.map((road) => {
    const to = state.owner[road[road.length - 1]]
    const bonus = isAllied(state, lord, to) ? state.rules.allyTrade : 100
    return road.length * bonus
  })
  const total = weights.reduce((a, b) => a + b, 0)
  if (total === 0) return null
  let lot = drawInt(state.seed, total, 'caravan', state.tick, market)
  for (const [i, road] of roads.entries()) {
    lot -= weights[i]
    if (lot < 0) return road
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
  const { caravanTicks, caravanGold, allyTrade } = state.rules
  for (const work of state.works) {
    if (work.work !== 'market' || !standing(state, work)) continue
    if ((state.tick + work.tile * 7) % caravanTicks !== 0) continue
    if (!sends(state, work.owner, work.tile)) continue
    const road = drawRoad(state, work.owner, work.tile)
    if (!road) continue
    const to = state.owner[road[road.length - 1]]
    const bonus = isAllied(state, work.owner, to) ? allyTrade : 100
    const gold = Math.floor((road.length * caravanGold * bonus) / 100)
    state.caravans.push({ owner: work.owner, to, road, along: 0, gold })
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
      if (!open(state, c.owner, tile) && state.owner[tile] !== c.to)
        if (!seize(state, c, i)) return false
    }
    if (here < c.road.length - 1) return true
    const end = c.road[c.road.length - 1]
    const market = state.works.find(
      (w) => w.tile === end && w.work === 'market',
    )
    state.players[c.owner].gold += c.gold
    if (market && market.owner !== c.owner)
      state.players[market.owner].gold += c.gold
    return false
  })
}
