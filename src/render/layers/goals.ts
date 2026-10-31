import { Container, Graphics } from 'pixi.js'
import { drawBanner } from '../art/banner'
import { TONE, playerColor } from '../palette'
import { siteOf } from '../marks'
import { hostReach } from '../reach'
import type { GameState, Host } from '../../../engine'

// Where the player's armies are going: a war banner of his colour planted
// where each army's men will be spent, its foot ringed in red, standing
// while the army is (« Sur mobile quand on fait un clic pour envoyer une
// unité met un étendard de guerre »; then, 31/10, « l'étendard planté là où
// l'armée s'épuisera », the click a direction, render/reach.ts): at a
// glance, how far each of his armies will go, set again each second, back
// when a battle costs it men. Sized on screen.

/** On screen, in pixels: the banner's width. */
const WIDTH = 18

type Goal = { box: Container; zoom: number }

export function makeGoals(me: number) {
  const container = new Container()
  const goals = new Map<Host, Goal>()

  function plant(): Goal {
    const box = new Container()
    box.addChild(new Graphics(), new Graphics(), new Graphics())
    container.addChild(box)
    return { box, zoom: 0 }
  }

  function redraw(goal: Goal, zoom: number) {
    const [ring, pole, cloth] = goal.box.children as Array<Graphics>
    const s = 1 / zoom
    ring
      .clear()
      .ellipse(0, 0, 8 * s, 3 * s)
      .fill({ color: TONE.fight, alpha: 0.25 })
      .stroke({ width: 1.6 * s, color: TONE.fight })
    drawBanner(pole, cloth, playerColor(me), WIDTH * s, s)
    goal.zoom = zoom
  }

  return {
    container,
    draw(state: GameState, zoom: number) {
      const going = new Set(
        me < 0
          ? []
          : state.hosts.filter((h) => h.owner === me && h.men > 0),
      )
      for (const [host, goal] of goals)
        if (!going.has(host)) {
          goal.box.destroy({ children: true })
          goals.delete(host)
        }
      for (const host of going) {
        const goal = goals.get(host) ?? plant()
        goals.set(host, goal)
        if (goal.zoom !== zoom) redraw(goal, zoom)
        const { x, y } = siteOf(state, hostReach(state, host).tile)
        goal.box.position.set(x, y)
      }
    },
  }
}
