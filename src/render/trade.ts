import { Container, Graphics, Sprite } from 'pixi.js'
import { playerColor } from './palette'
import { siteOf } from './marks'
import type { Stamps } from './textures'
import type { Caravan, GameState } from '../../engine'

// The merchants on their roads: a wagon under its lord's pennant rolls tile
// by tile from its market to another lord's, jolting a little; mine at full
// ink with its road dotted ahead of it, others' a little paler, so that the
// gold coming to me stands out. Sized on screen.

/** A wagon's height on screen, in pixels, and as drawn in its stamp. */
const TALL = 20
const DRAWN = 16

export function makeTrade(stamps: Stamps, me: number) {
  const container = new Container()
  const roads = container.addChild(new Graphics())
  const sprites: Array<Sprite> = []

  /** Where a caravan is on its road now, and which way it goes. */
  function along(state: GameState, caravan: Caravan) {
    const { road } = caravan
    const at = Math.min(road.length - 1, caravan.along / 1000)
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
    draw(state: GameState, zoom: number) {
      const seconds = performance.now() / 1000
      roads.clear()
      state.caravans.forEach((caravan, n) => {
        sprites[n] ??= container.addChild(new Sprite())
        const sprite = sprites[n]
        const stamp = stamps.cart(playerColor(caravan.owner))
        const { x, y, right, next } = along(state, caravan)
        const k = TALL / DRAWN / zoom
        sprite.texture = stamp.texture
        sprite.anchor.set(stamp.anchor.x, stamp.anchor.y)
        sprite.position.set(
          x,
          y - (Math.abs(Math.sin(seconds * 7 + n)) * 0.8) / zoom,
        )
        sprite.scale.set(right ? k : -k, k)
        sprite.alpha = caravan.owner === me ? 1 : 0.72
        sprite.visible = true
        if (caravan.owner !== me) return
        // My road ahead, dotted every few tiles.
        for (let i = next; i < caravan.road.length; i += 3) {
          const p = siteOf(state, caravan.road[i])
          roads.circle(p.x, p.y, 1.1 / zoom + 0.4)
        }
      })
      roads.fill({ color: playerColor(me), alpha: 0.7 })
      for (let i = state.caravans.length; i < sprites.length; i++)
        sprites[i].visible = false
    },
  }
}
