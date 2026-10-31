import { around } from './grid'
import { pop, push } from './heap'
import { passable } from './muster'
import { inBand, priority, struck } from './band'
import { priceOf } from './war'
import type { GameState, Host } from './types'

// How far an army will go (« l'étendard planté là où l'armée s'épuisera »,
// 31/10): the click gives it a direction and it takes all its men will pay
// for, past the click; its standard stands where they will be spent. Its
// push played over in thought, as war.ts plays it, the land left as it is:
// from where it entered, through its lord's land in its band, every tile it
// would take at what it costs now, the cheapest way first, until it cannot
// pay for the next. Where it ends is the tile taken farthest on its line.
// The land moves meanwhile, so the answer is asked again as it marches.

/** What a reach is worked out from: an army sent, or one on its way. */
export type Plan = Pick<
  Host,
  'owner' | 'target' | 'through' | 'entry' | 'aim' | 'wide' | 'men'
> & {
  /** Whether it comes ashore at its entry from the water (crossing.ts), which it strikes though it borders no land of its lord's. */
  ashore?: boolean
}

/** The tiles a reach looks through at most, so that a great army on a great map costs a moment. */
const MOST = 40_000

/** How far along the army's line a tile lies, from where it entered. */
function ahead(state: GameState, plan: Plan, tile: number): number {
  const w = state.grid.width
  const [ex, ey] = [plan.entry % w, Math.floor(plan.entry / w)]
  const [ax, ay] = [(plan.aim % w) - ex, Math.floor(plan.aim / w) - ey]
  return ((tile % w) - ex) * ax + (Math.floor(tile / w) - ey) * ay
}

/** The push in thought: what it has taken, what it has looked at, its men left, and the farthest tile on its line. */
type Thought = {
  seen: Set<number>
  taken: Set<number>
  queue: Array<[number, number]>
  men: number
  far: number
  farthest: number
}

/** Whether the army would strike the tile now: it borders the land the army walks or has taken, or the shore it lands on. */
function borders(state: GameState, plan: Plan, t: Thought, tile: number) {
  return (
    around(state.grid, tile).some(
      (n) => passable(state, plan.owner, n) || t.taken.has(n),
    ) ||
    (plan.ashore === true && tile === plan.entry)
  )
}

/** The tiles round one taken or crossed that the push may go on to: in its band, its target's or its lord's own. */
function spread(state: GameState, plan: Plan, t: Thought, tile: number) {
  for (const n of around(state.grid, tile)) {
    if (t.seen.has(n) || !inBand(state, plan, n)) continue
    if (!struck(state, plan, n) && !passable(state, plan.owner, n)) continue
    t.seen.add(n)
    push(t.queue, [priority(state, plan, n), n])
  }
}

/** One tile of the push: taken if it pays for it, crossed if its lord's own; whether the push goes on. */
function think(state: GameState, plan: Plan, t: Thought, tile: number) {
  if (!struck(state, plan, tile)) {
    // Its lord's own land in its band it crosses for nothing, to the front beyond.
    if (passable(state, plan.owner, tile)) spread(state, plan, t, tile)
    return true
  }
  if (!borders(state, plan, t, tile)) return true
  const cost = priceOf(state, tile)
  if (cost > t.men) return false
  t.men -= cost
  t.taken.add(tile)
  const along = ahead(state, plan, tile)
  if (along > t.farthest) [t.far, t.farthest] = [tile, along]
  spread(state, plan, t, tile)
  return true
}

/** The tile where the army's men will all be spent, on the land as it is now: the farthest on its line it would take; its entry when it can take none. */
export function reachOf(state: GameState, plan: Plan): number {
  const t: Thought = {
    seen: new Set([plan.entry]),
    taken: new Set(),
    queue: [[0, plan.entry]],
    men: plan.men,
    far: plan.entry,
    farthest: -Infinity,
  }
  for (let looked = 0; t.men > 0 && looked < MOST; looked++) {
    const next = pop(t.queue)
    if (!next || !think(state, plan, t, next[1])) break
  }
  return t.far
}
