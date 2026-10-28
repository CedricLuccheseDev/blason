import { Container, Graphics } from 'pixi.js'
import { drawBanner } from '../art/banner'
import { TONE, playerColor } from '../palette'
import { siteOf } from '../marks'
import type { GameState } from '../../../engine'

// The standards of the opening: each lord's banner planted by the village
// of the free domain he has chosen, the player's a little taller and ringed
// in gold at its foot. A standard moved hops to its new village. No land is
// anyone's yet: the domain is his only when the count ends, and then the
// standards are gone. Sized on screen.

/** On screen, in pixels: a planted banner's width; how high a moved one hops. */
const WIDTH = 22
const HOP = 28
/** How long a hop takes, in milliseconds. */
const HOP_MS = 360
/** Beside the village, in map units, so as not to hide it. */
const BESIDE = { x: 5, y: 2 }

type At = { x: number; y: number }
type Planted = {
  box: Container
  ring: Graphics
  pole: Graphics
  cloth: Graphics
  realm: number
  from: At
  to: At
  since: number
  zoom: number
}

export function makePlanted(me: number) {
  const container = new Container()
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const planted = new Map<number, Planted>()

  function plant(lord: number): Planted {
    const box = new Container()
    const ring = box.addChild(new Graphics())
    const pole = box.addChild(new Graphics())
    const cloth = box.addChild(new Graphics())
    const none = { x: 0, y: 0 }
    const p = { box, ring, pole, cloth, realm: -1, from: none, to: none }
    const made = { ...p, since: 0, zoom: 0 }
    planted.set(lord, made)
    return made
  }

  /** Where a standard stands, `now` along its hop. */
  function place(p: Planted, now: number, zoom: number): At {
    const t = still ? 1 : Math.min(1, (now - p.since) / HOP_MS)
    const k = t * t * (3 - 2 * t)
    const lift = Math.sin(Math.PI * t) * (HOP / zoom)
    return {
      x: p.from.x + (p.to.x - p.from.x) * k,
      y: p.from.y + (p.to.y - p.from.y) * k - lift,
    }
  }

  function redraw(p: Planted, lord: number, zoom: number) {
    const s = (lord === me ? 1.25 : 1) / zoom
    drawBanner(p.pole, p.cloth, playerColor(lord), WIDTH * s, s)
    p.ring.clear()
    if (lord === me)
      p.ring
        .ellipse(0, 0, 9 * s, 3.5 * s)
        .fill({ color: TONE.goldLight, alpha: 0.5 })
        .stroke({ width: 1.6 * s, color: TONE.goldDeep })
    p.zoom = zoom
  }

  return {
    container,
    draw(state: GameState, zoom: number, now = performance.now()) {
      container.visible = state.tick < state.rules.openingTicks
      if (!container.visible) return
      state.players.forEach(({ standard }, lord) => {
        const p = planted.get(lord) ?? plant(lord)
        p.box.visible = standard >= 0
        if (standard < 0) return
        if (p.realm !== standard) {
          const site = siteOf(state, standard)
          const to = { x: site.x + BESIDE.x, y: site.y + BESIDE.y }
          // Planted, it hops where it stands; moved, it hops from where it is to its new village.
          p.from = p.realm < 0 ? to : place(p, now, zoom)
          p.to = to
          p.since = now
          p.realm = standard
        }
        if (p.zoom !== zoom) redraw(p, lord, zoom)
        const at = place(p, now, zoom)
        p.box.position.set(at.x, at.y)
      })
      // The player's standard over the others, the others by their place, the nearer lower down over.
      const order = [...planted].filter(([, p]) => p.box.visible)
      order.sort(
        ([a, p], [b, q]) => +(a === me) - +(b === me) || p.to.y - q.to.y,
      )
      order.forEach(([, p], i) => container.addChildAt(p.box, i))
    },
  }
}
