import { Container, Graphics } from 'pixi.js'
import { around } from '../../engine'
import { drawPaving } from './art/paving'
import { drawRoad } from './roads'
import type { GameState } from '../../engine'

// The roads within a realm: each market of a lord is joined to his nearest
// other market by a paved road over his own land, so that his markets make
// a web of their own beside the roads of trade with the others (trade.ts).
// Drawn again only when the markets change. At the land's scale.

/** Tiles searched at most for a road, so that two markets far apart cost little. */
const SEARCH = 20000
/** How the road is drawn: its corners smoothed so often, wandering so far aside, in map units. */
const ROUNDS = 3
const STRAY = 4

/** The road from one tile to another over a lord's land, or none. */
function wayOver(state: GameState, lord: number, from: number, to: number) {
  const before = new Map<number, number>([[from, -1]])
  const queue = [from]
  for (const t of queue) {
    if (t === to) {
      const road = [t]
      for (let p = before.get(t) ?? -1; p >= 0; p = before.get(p) ?? -1)
        road.push(p)
      return road.reverse()
    }
    if (queue.length > SEARCH) return null
    for (const n of around(state.grid, t)) {
      if (before.has(n) || state.owner[n] !== lord) continue
      before.set(n, t)
      queue.push(n)
    }
  }
  return null
}

/** Each market of a lord with his nearest other market, each pair once. */
function pairsOf(state: GameState) {
  const { width } = state.grid
  const markets = state.works.filter((w) => w.work === 'market')
  const pairs = new Map<string, [number, number, number]>()
  for (const a of markets) {
    let near: number | null = null
    let far = Infinity
    for (const b of markets) {
      if (b === a || b.owner !== a.owner) continue
      const dx = (a.tile % width) - (b.tile % width)
      const dy = Math.floor(a.tile / width) - Math.floor(b.tile / width)
      if (dx * dx + dy * dy < far) {
        far = dx * dx + dy * dy
        near = b.tile
      }
    }
    if (near === null) continue
    const [x, y] = a.tile < near ? [a.tile, near] : [near, a.tile]
    pairs.set(`${x}-${y}`, [x, y, a.owner])
  }
  return pairs
}

export function makeWays(me: number) {
  const container = new Container()
  const drawn = new Map<string, Graphics>()
  let known = ''

  return {
    container,
    draw(state: GameState) {
      if (state.tick % 10 !== 0) return
      const markets = state.works
        .filter((w) => w.work === 'market')
        .map((w) => `${w.tile}:${w.owner}`)
        .join()
      if (markets === known) return
      known = markets
      const pairs = pairsOf(state)
      for (const [key, g] of drawn)
        if (!pairs.has(key)) {
          g.destroy()
          drawn.delete(key)
        }
      for (const [key, [a, b, lord]] of pairs) {
        if (drawn.has(key)) continue
        const way = wayOver(state, lord, a, b)
        if (!way) continue
        const path = drawRoad(
          state,
          way,
          (t) => state.owner[t] === lord,
          ROUNDS,
          STRAY,
        )
        const g = container.addChild(new Graphics())
        drawPaving(g, path, lord === me)
        drawn.set(key, g)
      }
    },
  }
}
