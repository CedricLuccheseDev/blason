import { Container, Graphics } from 'pixi.js'
import { standing } from '../../../engine'
import { TONE, playerColor } from '../palette'
import { siteOf } from '../marks'
import { toldShown, workPx, workScale } from '../art/works'
import type { GameState } from '../../../engine'

// The works being built: each drawn pale (marks.ts), and over it a seal of
// parchment ringed by the time its building takes, the ring filling in its
// lord's colour round an hourglass until the work stands and serves; it
// swells a little as it beats, so that a work under way catches the eye.
// Sized on screen, never too small to read, and smaller from afar with the
// works: there only the player's own, another's coming as one zooms in
// (art/works.ts).

/** The seal's radius on screen, in pixels, at the most and the least, against the work's size; the ring's width against the radius; where it hangs over the work drawn at the map's scale, in map units. */
const [R, R_LEAST, R_WORK] = [15, 8, 0.55]
const RING = 0.3
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

export function makeBuilding(me: number) {
  const container = new Container()
  const g = container.addChild(new Graphics())
  let empty = true

  return {
    container,
    draw(state: GameState, zoom: number) {
      const building = state.works.some(
        (w) => !standing(state, w) && w.ready !== undefined,
      )
      // Nothing being built, nothing drawn again.
      if (!building && empty) return
      empty = !building
      g.clear()
      const s = 1 / zoom
      const beat = 1 + 0.06 * Math.sin((performance.now() / 1000) * 4)
      const theirs = toldShown(workPx(zoom))
      for (const work of state.works) {
        if (standing(state, work) || work.ready === undefined) continue
        const mine = work.owner === me
        const alpha = mine ? 1 : theirs
        if (alpha <= 0) continue
        const total = state.rules.buildTicks[work.work]
        const done = 1 - (work.ready - state.tick) / total
        const { x } = siteOf(state, work.tile)
        const y = siteOf(state, work.tile).y - ABOVE * workScale(zoom, mine)
        const size = R_WORK * workPx(zoom, mine)
        const r = Math.max(R_LEAST, Math.min(R, size)) * s * beat
        const [ring, inner] = [RING * r, r * (1 - RING * 0.6)]
        g.circle(x, y, r)
          .fill({ color: TONE.parchment, alpha: 0.95 * alpha })
          .stroke({ width: 1.4 * s, color: TONE.ink, alpha })
        g.circle(x, y, inner).stroke({
          width: ring,
          color: TONE.ink,
          alpha: 0.15 * alpha,
        })
        g.moveTo(x, y - inner)
          .arc(x, y, inner, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * done)
          .stroke({
            width: ring,
            color: playerColor(work.owner),
            alpha,
            cap: 'round',
          })
        hourglass(g, x, y, r * 0.8)
        g.fill({ color: TONE.gold, alpha }).stroke({
          width: 1.1 * s,
          color: TONE.ink,
          alpha,
          join: 'round',
        })
      }
    },
  }
}
