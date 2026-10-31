import { Container, Graphics } from 'pixi.js'
import { arrowHead, fadingDashes, targetCross } from '../art/arrow'
import { playerColor } from '../palette'
import { siteOf } from '../marks'
import { hostReach } from '../reach'
import type { GameState } from '../../../engine'

// Where the player's armies are going, as the aim drew it before the click
// (« des pointillés avec une flèche qui deviennent transparents petit à
// petit … une croix de cible rouge pour dire où attaquer, mais pas de
// bannière », 31/10): from where each stands, dashes of his colour fading
// out where its men will be spent (render/reach.ts, set again each second),
// an arrowhead and a red target's cross on the tile it was sent at. At a
// glance, on a phone too, where each of his armies goes and how far.

export function makeGoals(me: number) {
  const container = new Container()
  const g = container.addChild(new Graphics())

  return {
    container,
    draw(state: GameState, zoom: number) {
      g.clear()
      if (me < 0) return
      const color = playerColor(me)
      for (const host of state.hosts) {
        if (host.owner !== me || host.men <= 0) continue
        // Its target taken, nothing more to show (« enlève le tracé bleu après la cible »).
        if (state.owner[host.aim] === me) continue
        // From where it entered, as the aim drew it, not from its moving front.
        const from = siteOf(state, host.entry)
        const aim = siteOf(state, host.aim)
        const reach = hostReach(state, host)
        const to = siteOf(state, reach.tile)
        const fade = reach.short
          ? Math.max(1, Math.hypot(to.x - from.x, to.y - from.y))
          : Infinity
        fadingDashes(g, [from, aim], zoom, color, fade)
        arrowHead(g, from, aim, zoom, color, reach.short ? 0.35 : 1)
        targetCross(g, aim, zoom)
      }
    },
  }
}
