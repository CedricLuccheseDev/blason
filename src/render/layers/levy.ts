import { Container, Graphics } from 'pixi.js'
import { TONE, playerColor } from '../palette'
import { siteOf } from '../marks'
import { standing } from '../../../engine'
import type { GameState } from '../../../engine'

// Over each village, a small seal says where the army it levies is: in its
// lord's colour with the sleeper's "z z" while the army rests at home, ready
// to march; in red with crossed swords while it is out. Every lord's, so that
// the player reads at a glance who can strike now. At the land's scale, as
// the works, never too small to see.

/** The seal's radius, and where it hangs from the village's middle, in map units; never smaller on screen than so many pixels. */
const R = 3.4
const [DX, DY] = [6, -11]
const SEEN = 7

/** The sleeper's two z, centred on (x, y). */
function sleep(g: Graphics, x: number, y: number, k: number) {
  for (const [ox, oy, r] of [
    [-1.1 * k, 0.7 * k, k],
    [1.1 * k, -0.9 * k, 0.75 * k],
  ]) {
    g.moveTo(x + ox - r, y + oy - r)
      .lineTo(x + ox + r, y + oy - r)
      .lineTo(x + ox - r, y + oy + r)
      .lineTo(x + ox + r, y + oy + r)
  }
}

/** Crossed swords, centred on (x, y). */
function swords(g: Graphics, x: number, y: number, k: number) {
  const r = 1.8 * k
  g.moveTo(x - r, y - r)
    .lineTo(x + r, y + r)
    .moveTo(x + r, y - r)
    .lineTo(x - r, y + r)
}

export function makeLevySeals() {
  const container = new Container()
  const g = container.addChild(new Graphics())

  return {
    container,
    draw(state: GameState, zoom: number) {
      g.clear()
      const k = Math.max(1, SEEN / zoom / R)
      const out = new Set(state.hosts.map((h) => h.from))
      for (const work of state.works) {
        if (work.work !== 'village' || !standing(state, work)) continue
        const { x, y } = siteOf(state, work.tile)
        const [cx, cy] = [x + DX * k, y + DY * k]
        const away = out.has(work.tile)
        g.circle(cx, cy, R * k)
          .fill(away ? TONE.fight : playerColor(work.owner))
          .stroke({ width: 0.6 * k, color: TONE.ink })
        if (away) swords(g, cx, cy, k)
        else sleep(g, cx, cy, k)
        g.stroke({
          width: 0.55 * k,
          color: TONE.parchment,
          cap: 'round',
          join: 'round',
        })
      }
    },
  }
}
