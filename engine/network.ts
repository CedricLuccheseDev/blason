import { apart, around } from './grid'
import { pop, push } from './heap'
import { standing } from './land'
import type { GameState } from './types'

// The trade network, as OpenFront's railways: each market reaches as far as
// its range, and two markets within range of each other are joined by a road
// over the land, whoever holds them; a road is laid only where no third
// market lies nearer to both, so that the network is a clear web from market
// to market rather than a tangle, and the caravans go along it, through as
// many markets as their journey takes (caravans.ts). Laid again only when the
// markets change.

/** A road of the network: its two markets, and its tiles from one to the other. */
export type Link = { a: number; b: number; road: Array<number> }

const laid = new WeakMap<GameState, { key: string; links: Array<Link> }>()

/** Each tile's reach once walked: it depends on the land and the range alone, which a game never changes, so a market built again where one stood, or the network laid again round it, walks nothing anew (« Le jeu ram quand y'a beaucoup trop de bâtiments »). */
const walked = new WeakMap<GameState, Map<number, Map<number, number>>>()

/** The tiles of land within a market's range, each with the tile it is reached from, walking from the market. */
function reach(state: GameState, from: number): Map<number, number> {
  let known = walked.get(state)
  if (!known) {
    known = new Map()
    walked.set(state, known)
  }
  const kept = known.get(from)
  if (kept) return kept
  const before = walk(state, from)
  known.set(from, before)
  return before
}

/** What a step of a road costs: a step across or down, one aslant, more for a turn, more by the water. */
const [STEP, SLANT, TURN, SHORE] = [10, 14, 6, 12]

/** The tiles a road may step to from one: the four beside it, and the four aslant where both tiles beside the step are land, so that a road never cuts a river's corner. */
function stepsFrom(state: GameState, t: number): Array<number> {
  const { width, height, land } = state.grid
  const [x, y] = [t % width, Math.floor(t / width)]
  const steps = around(state.grid, t)
  for (const [dx, dy] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const [nx, ny] = [x + dx, y + dy]
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
    if (land[y * width + nx] && land[ny * width + x])
      steps.push(ny * width + nx)
  }
  return steps
}

/** Whether a tile lies by the water, the sea's, a lake's or a river's. */
const byWater = (state: GameState, t: number) =>
  around(state.grid, t).some((n) => state.grid.water[n])

/**
 * The roads from a market over its range, as OpenFront's railways: in long
 * straight runs across, down and aslant (« rajoute la diagonale aussi pour
 * que ça fasse moins robotique »), few turns, a step off the water where the
 * land allows (« des chemins verticaux horizontaux comme openfront », « les
 * chemins des marchands collent trop proche » of the rivers), the cheapest
 * way to each tile, so that a road drawn on its own tiles reads as one, and
 * a village by it is a relay where it seems to be.
 */
function walk(state: GameState, from: number): Map<number, number> {
  const r = state.rules.tradeRange
  const before = new Map<number, number>([[from, -1]])
  const cost = new Map<number, number>([[from, 0]])
  const done = new Set<number>()
  const queue: Array<[number, number]> = [[0, from]]
  /** A step from a tile to the next, kept if it is the cheapest way there yet. */
  const step = (t: number, n: number, paid: number) => {
    if (done.has(n) || !state.grid.land[n]) return
    if (apart(state.grid, from, n) > r * r) return
    const back = before.get(t) ?? -1
    const turn = back >= 0 && n - t !== t - back ? TURN : 0
    const slant = Math.abs(n - t) !== 1 && Math.abs(n - t) !== state.grid.width
    const c =
      paid + (slant ? SLANT : STEP) + turn + (byWater(state, n) ? SHORE : 0)
    if (c >= (cost.get(n) ?? Infinity)) return
    cost.set(n, c)
    before.set(n, t)
    push(queue, [c, n])
  }
  for (let next = pop(queue); next; next = pop(queue)) {
    const [paid, t] = next
    if (done.has(t)) continue
    done.add(t)
    for (const n of stepsFrom(state, t)) step(t, n, paid)
  }
  return before
}

/** The road walked back from a tile to the market it was reached from. */
function walkBack(before: Map<number, number>, end: number): Array<number> {
  const road = [end]
  for (let p = before.get(end) ?? -1; p >= 0; p = before.get(p) ?? -1)
    road.push(p)
  return road.reverse()
}

/** Whether a third market lies nearer to both ends than they lie to each other. */
function crowded(state: GameState, a: number, b: number, all: Array<number>) {
  const d = apart(state.grid, a, b)
  return all.some(
    (c) =>
      c !== a &&
      c !== b &&
      apart(state.grid, a, c) < d &&
      apart(state.grid, b, c) < d,
  )
}

function lay(state: GameState, markets: Array<number>): Array<Link> {
  const links: Array<Link> = []
  for (const a of markets) {
    const before = reach(state, a)
    for (const b of markets)
      if (b > a && before.has(b) && !crowded(state, a, b, markets))
        links.push({ a, b, road: walkBack(before, b) })
  }
  return links
}

/** The roads of the network between the markets standing now. */
export function tradeLinks(state: GameState): Array<Link> {
  const markets = state.works
    .filter((w) => w.work === 'market' && standing(state, w))
    .map((w) => w.tile)
    .sort((x, y) => x - y)
  const key = markets.join()
  const known = laid.get(state)
  if (known?.key === key) return known.links
  const links = lay(state, markets)
  laid.set(state, { key, links })
  return links
}
