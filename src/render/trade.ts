import { Container, Graphics, Sprite } from 'pixi.js'
import { playerColor } from './palette'
import { siteOf } from './marks'
import type { Stamps } from './textures'
import type { Caravan, GameState } from '../../engine'

// The merchants on their roads: a wagon under its lord's pennant rolls from
// its market to another lord's, smoothly between two ticks and jolting a
// little, its road dotted ahead of it in its lord's colour; mine at full ink,
// others' paler, so that the gold coming to me stands out. Sized on screen.

/** A wagon's height on screen, in pixels, and as drawn in its stamp. */
const TALL = 20
const DRAWN = 16

export function makeTrade(stamps: Stamps, me: number) {
  const container = new Container()
  const roads = container.addChild(new Graphics())
  const sprites: Array<Sprite> = []

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
      next: i + 1,
    }
  }

  return {
    container,
    draw(state: GameState, zoom: number, between = 0) {
      const seconds = performance.now() / 1000
      roads.clear()
      state.caravans.forEach((caravan, n) => {
        sprites[n] ??= container.addChild(new Sprite())
        const sprite = sprites[n]
        const stamp = stamps.cart(playerColor(caravan.owner))
        const { x, y, right, next } = along(state, caravan, between)
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
        // The road ahead, dotted every few tiles.
        for (let i = next; i < caravan.road.length; i += 3) {
          const p = siteOf(state, caravan.road[i])
          roads.circle(p.x, p.y, 1.1 / zoom + 0.4)
        }
        roads.fill({
          color: playerColor(caravan.owner),
          alpha: mine ? 0.8 : 0.4,
        })
      })
      for (let i = state.caravans.length; i < sprites.length; i++)
        sprites[i].visible = false
    },
  }
}
