import { Container, Graphics } from 'pixi.js'
import { TONE } from '../palette'
import { siteOf } from '../marks'
import { pointOn } from '../roads'
import { pathOf } from './column'
import type { Front, Spot } from '../fronts'
import type { GameState } from '../../../engine'

// What the player must see coming, drawn where it is. An enemy army marching
// on his land: a red glow beats under its men, and a red arrow runs from them
// along what is left of their road to where they will strike his border. A
// battle: a red seal with crossed swords over the ground where the two armies
// meet, beating while one of them is his. Sized on screen, seen at any zoom.

/** The glow's radius and the seal's, on screen in pixels; the beat, in seconds. */
const GLOW = 26
const SEAL = 11
const BEAT = 1.2

/** Crossed swords centred on (x, y), so wide. */
function swords(g: Graphics, at: Spot, r: number) {
  g.moveTo(at.x - r, at.y - r)
    .lineTo(at.x + r, at.y + r)
    .moveTo(at.x + r, at.y - r)
    .lineTo(at.x - r, at.y + r)
    .moveTo(at.x - r * 0.95, at.y + r * 0.3)
    .lineTo(at.x - r * 0.3, at.y + r * 0.95)
    .moveTo(at.x + r * 0.95, at.y + r * 0.3)
    .lineTo(at.x + r * 0.3, at.y + r * 0.95)
}

export function makeWarning(me: number) {
  const container = new Container()
  const g = container.addChild(new Graphics())

  /** The road left before an army coming for me, in red, an arrowhead at my border. */
  function arrow(state: GameState, front: Front, s: number) {
    const { host, head } = front
    const path = pathOf(state, host)
    const start = pointOn(path, head)
    const points = [start, ...path.slice(Math.ceil(head + 0.01))]
    const end = siteOf(state, host.entry)
    points.push(end)
    g.moveTo(start.x, start.y)
    for (const p of points) g.lineTo(p.x, p.y)
    g.stroke({
      width: 3 * s,
      color: TONE.fight,
      alpha: 0.75,
      cap: 'round',
      join: 'round',
    })
    const before = points.at(-2) ?? start
    const d = Math.hypot(end.x - before.x, end.y - before.y) || 1
    const [ux, uy] = [(end.x - before.x) / d, (end.y - before.y) / d]
    const r = 9 * s
    g.poly([
      end.x + ux * r * 0.4,
      end.y + uy * r * 0.4,
      end.x - ux * r - uy * r * 0.6,
      end.y - uy * r + ux * r * 0.6,
      end.x - ux * r + uy * r * 0.6,
      end.y - uy * r - ux * r * 0.6,
    ]).fill({ color: TONE.fight, alpha: 0.9 })
  }

  /** A red glow beating under an army's men. */
  function glow(at: Spot, s: number, seconds: number) {
    for (const offset of [0, 0.5]) {
      const t = (seconds / BEAT + offset) % 1
      g.circle(at.x, at.y, GLOW * s * (0.4 + 0.8 * t))
      g.fill({ color: TONE.fight, alpha: 0.22 * (1 - t) })
    }
  }

  /** A battle's seal: crossed swords on red, beating if it is mine. */
  function seal(at: Spot, s: number, mine: boolean, seconds: number) {
    const beat = mine ? 1 + 0.12 * Math.sin((seconds / BEAT) * Math.PI * 2) : 1
    const r = SEAL * s * beat
    const over = { x: at.x, y: at.y - 18 * s }
    if (mine) glow(at, s, seconds)
    g.circle(over.x, over.y, r)
      .fill(TONE.fight)
      .stroke({ width: 1.6 * s, color: TONE.ink })
    swords(g, over, r * 0.5)
    g.stroke({ width: 1.8 * s, color: TONE.parchment, cap: 'round' })
  }

  return {
    container,
    draw(state: GameState, fronts: Array<Front>, zoom: number) {
      g.clear()
      const seconds = performance.now() / 1000
      const s = 1 / zoom
      const told = new Set<Front['host']>()
      for (const front of fronts) {
        const { host } = front
        if (front.phase === 'battle' && front.line && !told.has(host)) {
          if (front.foe) told.add(front.foe)
          const mine = host.owner === me || front.foe?.owner === me
          seal(front.line, s, mine, seconds)
        }
        if (me < 0 || host.target !== me || front.phase !== 'march') continue
        glow(front.at, s, seconds)
        arrow(state, front, s)
      }
    },
  }
}
