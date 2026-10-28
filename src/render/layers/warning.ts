import { Container, Graphics } from 'pixi.js'
import { TONE } from '../palette'
import { siteOf } from '../marks'
import { pathOf } from './column'
import type { GameState } from '../../../engine'
import type { Track } from '../tracks'

// A battle coming for the player: while an enemy army marches on his land,
// its road is traced in red over its dots, and where it will strike his
// border, two red rings beat with crossed swords between them, until the
// fight is over. Sized on screen, so that it is seen at any zoom.

/** The rings' radius on screen, in pixels, and their beat, in seconds. */
const RING = 22
const BEAT = 1.1

/** Crossed swords centred on (x, y), so wide. */
function swords(g: Graphics, x: number, y: number, r: number) {
  g.moveTo(x - r, y - r)
    .lineTo(x + r, y + r)
    .moveTo(x + r, y - r)
    .lineTo(x - r, y + r)
    .moveTo(x - r * 0.9, y + r * 0.35)
    .lineTo(x - r * 0.35, y + r * 0.9)
    .moveTo(x + r * 0.9, y + r * 0.35)
    .lineTo(x + r * 0.35, y + r * 0.9)
}

export function makeWarning(me: number) {
  const container = new Container()
  const g = container.addChild(new Graphics())

  return {
    container,
    draw(state: GameState, tracks: Array<Track>, zoom: number) {
      g.clear()
      if (me < 0) return
      const seconds = performance.now() / 1000
      const s = 1 / zoom
      for (const track of tracks) {
        const { host } = track
        if (host.target !== me || host.owner === me) continue
        const path = pathOf(state, host)
        const at = siteOf(state, host.entry)
        const alpha = track.alpha
        // Its road, from where it walks now to my border, in red.
        const from = Math.max(0, Math.floor(track.head))
        if (track.march > 0) {
          g.moveTo(track.x, track.y)
          for (const p of path.slice(from + 1)) g.lineTo(p.x, p.y)
          g.lineTo(at.x, at.y)
          g.stroke({
            width: 2.2 * s,
            color: TONE.fight,
            alpha: 0.7 * alpha * track.march,
            cap: 'round',
            join: 'round',
          })
        }
        // Where it strikes: two rings beating out of step, crossed swords in the middle.
        for (const offset of [0, 0.5]) {
          const t = (seconds / BEAT + offset) % 1
          g.circle(at.x, at.y, RING * s * (0.5 + t))
          g.stroke({
            width: 2.4 * s,
            color: TONE.fight,
            alpha: (1 - t) * 0.85 * alpha,
          })
        }
        swords(g, at.x, at.y, 7 * s)
        g.stroke({
          width: 2.6 * s,
          color: TONE.fightDark,
          alpha,
          cap: 'round',
        })
      }
    },
  }
}
