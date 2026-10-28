import { Container, Graphics, Sprite } from 'pixi.js'
import { playerColor } from './palette'
import { siteOf } from './marks'
import type { Stamps } from './textures'
import type { Caravan, GameState } from '../../engine'

// The merchants on their roads: a wagon under its lord's pennant rolls from
// its market to another lord's, smoothly between two ticks and jolting a
// little. Every road a caravan once took stays dotted on the map in its
// lord's colour, as OpenFront's trade routes, until one of its two markets
// is gone; mine at full ink, others' paler, so that the gold coming to me
// stands out. Sized on screen.

/** A wagon's height on screen, in pixels, and as drawn in its stamp. */
const TALL = 20
const DRAWN = 16

type Route = { owner: number; road: Array<number> }

/** Whether a market still stands on a tile. */
const market = (state: GameState, tile: number) =>
  state.works.some((w) => w.tile === tile && w.work === 'market')

export function makeTrade(stamps: Stamps, me: number) {
  const container = new Container()
  const roads = container.addChild(new Graphics())
  const sprites: Array<Sprite> = []
  /** The roads taken, by their two markets, and how they were last drawn. */
  const routes = new Map<string, Route>()
  let drawn = { version: -1, zoom: 0 }
  let version = 0

  /** The roads of the caravans out now kept, those whose market fell let go. */
  function remember(state: GameState) {
    for (const caravan of state.caravans) {
      const { road, owner } = caravan
      const key = `${road[0]}-${road.at(-1)}`
      if (routes.has(key)) continue
      routes.set(key, { owner, road })
      version += 1
    }
    for (const [key, { road }] of routes)
      if (!market(state, road[0]) || !market(state, road.at(-1) ?? -1)) {
        routes.delete(key)
        version += 1
      }
  }

  /** Every road kept, dotted every few tiles; drawn again only when they or the zoom change. */
  function paint(state: GameState, zoom: number) {
    const same = Math.abs(zoom / drawn.zoom - 1) < 0.15
    if (version === drawn.version && same) return
    drawn = { version, zoom }
    roads.clear()
    for (const { owner, road } of routes.values()) {
      for (let i = 1; i < road.length - 1; i += 3) {
        const p = siteOf(state, road[i])
        roads.circle(p.x, p.y, 0.9 / zoom + 0.3)
      }
      roads.fill({ color: playerColor(owner), alpha: owner === me ? 0.7 : 0.3 })
    }
  }

  /** Where a caravan is on its road now, so far into the next tick, and which way it goes. */
  function along(state: GameState, caravan: Caravan, between: number) {
    const { road } = caravan
    const moved = caravan.along + state.rules.caravanPace * between
    const at = Math.min(road.length - 1, moved / 1000)
    const i = Math.min(road.length - 2, Math.floor(at))
    const t = at - i
    const a = siteOf(state, road[i])
    const b = siteOf(state, road[i + 1])
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      right: b.x >= a.x,
    }
  }

  return {
    container,
    draw(state: GameState, zoom: number, between = 0) {
      const seconds = performance.now() / 1000
      if (state.tick % 10 === 0 || drawn.version < 0) remember(state)
      paint(state, zoom)
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
