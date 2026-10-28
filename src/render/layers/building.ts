import { Container, Graphics } from 'pixi.js'
import { standing } from '../../../engine'
import { TONE, playerColor } from '../palette'
import { siteOf } from '../marks'
import type { GameState } from '../../../engine'

// The works being built: each drawn pale (marks.ts), ringed by the time its
// building takes, the ring filling in its lord's colour until the work
// stands and serves. Never smaller on screen than a finger can see.

/** The ring's radius in map units, never under so many pixels on screen. */
const R = 9
const SEEN = 14

export function makeBuilding() {
  const container = new Container()
  const g = container.addChild(new Graphics())

  return {
    container,
    draw(state: GameState, zoom: number) {
      g.clear()
      const r = Math.max(R, SEEN / zoom)
      for (const work of state.works) {
        if (standing(state, work) || work.ready === undefined) continue
        const total = state.rules.buildTicks[work.work]
        const done = 1 - (work.ready - state.tick) / total
        const { x, y } = siteOf(state, work.tile)
        g.circle(x, y, r).stroke({
          width: 2.4 / zoom,
          color: TONE.ink,
          alpha: 0.3,
        })
        g.moveTo(x, y - r)
          .arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * done)
          .stroke({
            width: 3 / zoom,
            color: playerColor(work.owner),
            cap: 'round',
          })
      }
    },
  }
}
