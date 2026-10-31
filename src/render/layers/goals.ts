import { Container, Graphics } from 'pixi.js'
import { positionOf } from '../../../engine'
import { arrowHead, fadingDashes, targetCross } from '../art/arrow'
import { playerColor } from '../palette'
import { siteOf } from '../marks'
import { hostReach } from '../reach'
import type { GameState, Host } from '../../../engine'

// Where the player's armies are going, as the aim drew it before the click
// (« des pointillés avec une flèche qui deviennent transparents petit à
// petit … une croix de cible rouge pour dire où attaquer, mais pas de
// bannière », 31/10): from where each stands, dashes of his colour fading
// out where its men will be spent (render/reach.ts, set again each second),
// an arrowhead and a red target's cross on the tile it was sent at. At a
// glance, on a phone too, where each of his armies goes and how far.

/** Where an army stands now: on its road, or at the front it last took. */
function frontOf(host: Host): number {
  if (host.along < (host.road.length - 1) * 1000) return positionOf(host)
  return host.edge[0] ?? host.entry
}

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
        const from = siteOf(state, frontOf(host))
        const to = siteOf(state, hostReach(state, host).tile)
        const aim = siteOf(state, host.aim)
        const fade = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y))
        fadingDashes(g, [from, to], zoom, color, fade)
        // Its target taken, it pushes on past it: no arrow pointing back.
        if (state.owner[host.aim] === me) continue
        const toAim = Math.hypot(aim.x - from.x, aim.y - from.y)
        arrowHead(g, from, aim, zoom, color, Math.max(0.35, 1 - toAim / fade))
        targetCross(g, aim, zoom)
      }
    },
  }
}
