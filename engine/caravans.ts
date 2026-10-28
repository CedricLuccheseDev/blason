import { around } from './grid'
import { isAllied, isFriendly } from './diplomacy'
import { NEUTRAL } from './types'
import type { GameState } from './types'

// The merchants, as OpenFront's trade ships (docs/RULES.md): each
// market sends a caravan now and then to the nearest market of another
// lord, by a road through its lord's land, his allies' and the free land,
// entering at the last the land of the lord it trades with; any other lord
// bars the way. It travels at a walk; arriving, it pays both
// markets, more the longer its road, twice as much between allies. An
// enemy taking a tile of the road ahead pillages it.

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

/** The road from a market to the nearest market of another lord, by the open land, or none. */
function roadFrom(state: GameState, market: number): Array<number> | null {
  const lord = state.owner[market]
  const goals = new Set(
    state.works
      .filter((w) => w.work === 'market' && w.owner !== lord)
      .map((w) => w.tile),
  )
  if (goals.size === 0) return null
  const before = new Map<number, number>([[market, -1]])
  const queue = [market]
  for (const t of queue) {
    if (queue.length > SEARCH) return null
    for (const n of around(state.grid, t)) {
      if (before.has(n)) continue
      // The step first: a market is only reached by a step the road may take.
      if (!canStep(state, lord, t, n)) continue
      if (goals.has(n)) return walkBack(before, n, t)
      before.set(n, t)
      queue.push(n)
    }
  }
  return null
}

/** Each market sends a caravan now and then, each at its own moment. */
export function sendCaravans(state: GameState) {
  const { caravanTicks, caravanGold, allyTrade } = state.rules
  for (const work of state.works) {
    if (work.work !== 'market') continue
    if ((state.tick + work.tile * 7) % caravanTicks !== 0) continue
    if (state.caravans.some((c) => c.road[0] === work.tile)) continue
    const road = roadFrom(state, work.tile)
    if (!road) continue
    const to = state.owner[road[road.length - 1]]
    const bonus = isAllied(state, work.owner, to) ? allyTrade : 100
    const gold = Math.floor((road.length * caravanGold * bonus) / 100)
    state.caravans.push({ owner: work.owner, to, road, along: 0, gold })
  }
}

/** The caravans a tick further: pillaged where an enemy holds the road ahead, paying both markets when they arrive. */
export function moveCaravans(state: GameState) {
  state.caravans = state.caravans.filter((c) => {
    if (!state.players[c.owner].alive) return false
    c.along += state.rules.caravanPace
    const here = Math.floor(c.along / 1000)
    const last = c.road.length - 1
    for (let i = Math.min(here, last - 1); i < last; i++) {
      const tile = c.road[i]
      if (!open(state, c.owner, tile) && state.owner[tile] !== c.to)
        return false
    }
    if (here < last) return true
    const market = state.works.find(
      (w) => w.tile === c.road[last] && w.work === 'market',
    )
    state.players[c.owner].gold += c.gold
    if (market && market.owner !== c.owner)
      state.players[market.owner].gold += c.gold
    return false
  })
}
