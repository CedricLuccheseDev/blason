import { Container, Graphics, Sprite } from 'pixi.js'
import { drawPaving } from './art/paving'
import { playerColor } from './palette'
import { drawRoad, pointOn } from './roads'
import type { Spot } from './roads'
import type { Stamps } from './textures'
import type { Caravan, GameState } from '../../engine'

// The merchants on their roads: a wagon under its lord's pennant rolls from
// its market to another lord's, smoothly between two ticks and jolting a
// little. Each market trades with the nearest market of another lord, and
// the roads between them make a web: one paved road of old for two markets
// (art/paving.ts), near straight from market to market and rounding the
// sea in soft bends (roads.ts), until one of its two markets is gone or no
// caravan has taken it for a while; mine a little darker. The wagon and the
// road at the land's scale, as the armies.

/** A wagon's height on the land, in map units (a man stands some four), and as drawn in its stamp. */
const TALL = 5
const DRAWN = 16

/** A road paved between two markets, and when a caravan last took it. */
type Route = {
  road: Array<number>
  path: Array<Spot>
  drawn: Graphics
  used: number
}

/** Ticks a road stays with no caravan on it: each market trades with its nearest, and the roads it no longer takes go. */
const UNUSED = 300

/** How many times a road's corners are smoothed, and how far it wanders aside, in map units. */
const ROUNDS = 3
const STRAY = 5

/** Whether a market still stands on a tile. */
const market = (state: GameState, tile: number) =>
  state.works.some((w) => w.tile === tile && w.work === 'market')

/** A road's key: its two markets, whichever way the wagon goes, so that two markets share one road. */
const keyOf = (road: Array<number>) => {
  const [a, b] = [road[0], road.at(-1) ?? road[0]]
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

export function makeTrade(stamps: Stamps, me: number) {
  const container = new Container()
  /** The roads lie under the works; the wagons roll over them. */
  const roads = new Container()
  const sprites: Array<Sprite> = []
  /** The roads taken, by their two markets, each paved once. */
  const routes = new Map<string, Route>()

  /** A caravan's road paved, the first time a caravan takes it; taken again, it is kept. */
  function pave(state: GameState, caravan: Caravan): Route {
    const { road, owner } = caravan
    const key = keyOf(road)
    const known = routes.get(key)
    if (known) {
      known.used = state.tick
      return known
    }
    const path = drawRoad(state, road, (t) => state.grid.land[t], ROUNDS, STRAY)
    const drawn = roads.addChild(new Graphics())
    drawPaving(drawn, path, owner === me)
    const route = { road, path, drawn, used: state.tick }
    routes.set(key, route)
    return route
  }

  /** The roads no caravan took for a while, or whose market fell, taken up. */
  function forget(state: GameState) {
    for (const [key, { road, drawn, used }] of routes)
      if (
        state.tick - used > UNUSED ||
        !market(state, road[0]) ||
        !market(state, road.at(-1) ?? -1)
      ) {
        drawn.destroy()
        routes.delete(key)
      }
  }

  /** Where a caravan is on its road now, so far into the next tick, and which way it goes. */
  function along(state: GameState, caravan: Caravan, between: number) {
    const route = pave(state, caravan)
    const { path } = route
    const moved = caravan.along + state.rules.caravanPace * between
    // Its share of its own road, laid on the road shared, from its own end.
    const share = Math.min(
      1,
      moved / 1000 / Math.max(1, caravan.road.length - 1),
    )
    const back = route.road[0] !== caravan.road[0]
    const at = (back ? 1 - share : share) * (path.length - 1)
    const p = pointOn(path, at)
    return back ? { ...p, right: !p.right } : p
  }

  return {
    container,
    roads,
    draw(state: GameState, between = 0) {
      const seconds = performance.now() / 1000
      if (state.tick % 10 === 0) forget(state)
      state.caravans.forEach((caravan, n) => {
        sprites[n] ??= container.addChild(new Sprite())
        const sprite = sprites[n]
        const stamp = stamps.cart(playerColor(caravan.owner))
        const { x, y, right } = along(state, caravan, between)
        const k = TALL / DRAWN
        sprite.texture = stamp.texture
        sprite.anchor.set(stamp.anchor.x, stamp.anchor.y)
        sprite.position.set(x, y - Math.abs(Math.sin(seconds * 7 + n)) * 0.25)
        sprite.scale.set(right ? k : -k, k)
        const mine = caravan.owner === me
        sprite.alpha = mine ? 1 : 0.72
        sprite.visible = true
      })
      for (let i = state.caravans.length; i < sprites.length; i++)
        sprites[i].visible = false
    },
  }
}
