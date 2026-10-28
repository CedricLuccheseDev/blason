import { Container, Graphics, Sprite } from 'pixi.js'
import { drawPaving } from './art/paving'
import { playerColor } from './palette'
import { drawRoad, pointOn } from './roads'
import type { Spot } from './roads'
import type { Stamps } from './textures'
import type { Caravan, GameState } from '../../engine'

// The merchants on their roads: a wagon under its lord's pennant rolls from
// its market to another lord's, smoothly between two ticks and jolting a
// little. Every road a caravan once took stays on the map as a paved road of
// old (art/paving.ts), near straight from market to market and rounding the
// sea in soft bends (roads.ts), until one of its two markets is gone; mine a
// little darker. The wagon is sized on screen, the road at the land's scale.

/** A wagon's height on screen, in pixels, and as drawn in its stamp. */
const TALL = 20
const DRAWN = 16

type Route = { road: Array<number>; path: Array<Spot>; drawn: Graphics }

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

  /** The roads of the caravans out now kept and paved; those whose market fell taken up. */
  function remember(state: GameState) {
    for (const caravan of state.caravans) {
      const { road, owner } = caravan
      const key = keyOf(road)
      if (routes.has(key)) continue
      const path = drawRoad(
        state,
        road,
        (t) => state.grid.land[t],
        ROUNDS,
        STRAY,
      )
      const drawn = roads.addChild(new Graphics())
      drawPaving(drawn, path, owner === me)
      routes.set(key, { road, path, drawn })
    }
    for (const [key, { road, drawn }] of routes)
      if (!market(state, road[0]) || !market(state, road.at(-1) ?? -1)) {
        drawn.destroy()
        routes.delete(key)
      }
  }

  /** Where a caravan is on its road now, so far into the next tick, and which way it goes. */
  function along(state: GameState, caravan: Caravan, between: number) {
    const route = routes.get(keyOf(caravan.road))
    const path =
      route?.path ??
      drawRoad(state, caravan.road, (t) => state.grid.land[t], ROUNDS, STRAY)
    const moved = caravan.along + state.rules.caravanPace * between
    // Its share of its own road, laid on the road shared, from its own end.
    const share = Math.min(
      1,
      moved / 1000 / Math.max(1, caravan.road.length - 1),
    )
    const back = route !== undefined && route.road[0] !== caravan.road[0]
    const at = (back ? 1 - share : share) * (path.length - 1)
    const p = pointOn(path, at)
    return back ? { ...p, right: !p.right } : p
  }

  return {
    container,
    roads,
    draw(state: GameState, zoom: number, between = 0) {
      const seconds = performance.now() / 1000
      if (state.tick % 10 === 0 || routes.size === 0) remember(state)
      state.caravans.forEach((caravan, n) => {
        sprites[n] ??= container.addChild(new Sprite())
        const sprite = sprites[n]
        const stamp = stamps.cart(playerColor(caravan.owner))
        const { x, y, right } = along(state, caravan, between)
        const k = TALL / DRAWN / zoom
        sprite.texture = stamp.texture
        sprite.anchor.set(stamp.anchor.x, stamp.anchor.y)
        sprite.position.set(
          x,
          y - (Math.abs(Math.sin(seconds * 7 + n)) * 0.8) / zoom,
        )
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
