import { Container, Graphics } from 'pixi.js'
import { standing } from '../../../engine'
import { TONE, playerColor } from '../palette'
import { siteOf } from '../marks'
import type { GameState } from '../../../engine'

// The works being built: each drawn pale (marks.ts), and over it a seal of
// parchment ringed by the time its building takes, the ring filling in its
// lord's colour round an hourglass until the work stands and serves; it
// swells a little as it beats, so that a work under way catches the eye.
// Sized on screen, never too small to read.

/** The seal's radius on screen, in pixels, and the ring's width; where it hangs over the work, in map units. */
const R = 15
const RING = 4.5
const ABOVE = 9

/** An hourglass centred on (x, y), so tall. */
function hourglass(g: Graphics, x: number, y: number, h: number) {
  const w = h * 0.62
  g.moveTo(x - w / 2, y - h / 2)
    .lineTo(x + w / 2, y - h / 2)
    .lineTo(x - w / 2, y + h / 2)
    .lineTo(x + w / 2, y + h / 2)
    .closePath()
}

export function makeBuilding() {
  const container = new Container()
  const g = container.addChild(new Graphics())

  return {
    container,
    draw(state: GameState, zoom: number) {
      g.clear()
      const s = 1 / zoom
      const beat = 1 + 0.06 * Math.sin((performance.now() / 1000) * 4)
      for (const work of state.works) {
        if (standing(state, work) || work.ready === undefined) continue
        const total = state.rules.buildTicks[work.work]
        const done = 1 - (work.ready - state.tick) / total
        const { x } = siteOf(state, work.tile)
        const y = siteOf(state, work.tile).y - ABOVE
        const r = R * s * beat
        g.circle(x, y, r)
          .fill({ color: TONE.parchment, alpha: 0.95 })
          .stroke({ width: 1.4 * s, color: TONE.ink })
        g.circle(x, y, r - RING * s * 0.6).stroke({
          width: RING * s,
          color: TONE.ink,
          alpha: 0.15,
        })
        g.moveTo(x, y - (r - RING * s * 0.6))
          .arc(
            x,
            y,
            r - RING * s * 0.6,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * done,
          )
          .stroke({
            width: RING * s,
            color: playerColor(work.owner),
            cap: 'round',
          })
        hourglass(g, x, y, r * 0.8)
        g.fill({ color: TONE.gold }).stroke({
          width: 1.1 * s,
          color: TONE.ink,
          join: 'round',
        })
      }
    },
  }
}
