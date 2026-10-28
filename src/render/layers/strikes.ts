import { Container, Graphics } from 'pixi.js'
import { strikeAt } from '../../../engine'
import { TONE, playerColor } from '../palette'
import { siteOf } from '../marks'
import { drawArrow, drawPot, drawTroublemaker } from '../art/coups'
import { along, dots, endsOf, progress, wayOf } from '../flight'
import { drawFallen } from './impacts'
import type { Fallen } from './impacts'
import type { GameState, Strike } from '../../../engine'

// The coups on their way, seen by all, at the land's scale: the
// troublemaker walking his straight line from his lord's border, a torch
// held high, his steps dotted behind him; a volley of arrows flying its arc
// from the border; a pot of Greek fire flying higher, trailing smoke. Where
// one comes at the player, the land it will strike ringed in red, beating
// faster as it nears; where it is his, ringed faintly in his colour. What
// each does as it falls, or a troublemaker stopped, is drawn by
// layers/impacts.ts. A figure never shrinks under so many pixels.

/** Arrows in a volley, smoke puffs behind a pot. */
const ARROWS = 9
const PUFFS = 8

export function makeStrikes(me: number) {
  const container = new Container()
  const g = container.addChild(new Graphics())
  const fx = container.addChild(new Graphics())
  /** The strikes on their way at the last tick read; those gone since, as they ended. */
  let flying = new Set<Strike>()
  let tick = -1
  const ended: Array<Fallen> = []

  /** The strikes gone since the last tick: fallen where they were sent, or a troublemaker stopped. */
  function read(state: GameState, seconds: number) {
    const now = new Set(state.strikes)
    for (const s of flying) {
      if (now.has(s) || !state.players[s.owner].alive) continue
      // Where the engine had him when he was met, or where it fell.
      const at = siteOf(state, strikeAt(state, s))
      ended.push({ strike: s, born: seconds, fell: state.tick >= s.lands, at })
    }
    flying = now
    tick = state.tick
  }

  function ring(
    state: GameState,
    s: Strike,
    p: number,
    seconds: number,
    zoom: number,
  ) {
    const { b } = endsOf(state, s)
    const radius = state.rules.coups[s.coup].radius * state.grid.size
    if (s.victim === me) {
      // It beats, faster as it nears.
      const beat = 0.5 + 0.5 * Math.sin(seconds * Math.PI * 2 * (1 + 2 * p))
      g.circle(b.x, b.y, radius)
        .fill({ color: TONE.fight, alpha: 0.05 + 0.08 * beat })
        .stroke({
          width: (2 + 1.5 * beat) / zoom,
          color: TONE.fight,
          alpha: 0.55 + 0.45 * beat,
        })
    } else if (s.owner === me)
      g.circle(b.x, b.y, radius).stroke({
        width: 1.5 / zoom,
        color: playerColor(me),
        alpha: 0.6,
      })
  }

  function walker(
    state: GameState,
    s: Strike,
    p: number,
    seconds: number,
    zoom: number,
  ) {
    const { a, b } = endsOf(state, s)
    const at = along(a, b, p, false)
    const color = playerColor(s.owner)
    dots(g, [a, at], 3 / zoom)
    g.stroke({ width: 1.6 / zoom, color, alpha: 0.7, cap: 'round' })
    dots(g, [at, b], 3 / zoom)
    g.stroke({ width: 1.2 / zoom, color: TONE.ink, alpha: 0.25, cap: 'round' })
    const dir = b.x >= a.x ? 1 : -1
    const h = Math.max(6, 30 / zoom)
    const flicker = 0.5 + 0.5 * Math.sin(seconds * 17 + s.target)
    drawTroublemaker(g, at.x, at.y, h, color, dir, seconds * 9, flicker)
  }

  function volley(state: GameState, s: Strike, p: number, zoom: number) {
    const { a, b } = endsOf(state, s)
    const long = Math.max(2.5, 14 / zoom)
    for (let i = 0; i < ARROWS; i++) {
      const t = p - (i % 3) * 0.035
      if (t <= 0) continue
      const at = along(a, b, t, true)
      // Spread across the line of flight, as a volley flies.
      const spread =
        ((i % 3) - 1) * long * 0.6 + (Math.floor(i / 3) - 1) * long * 0.5
      const [nx, ny] = [-Math.sin(at.angle), Math.cos(at.angle)]
      drawArrow(g, at.x + nx * spread, at.y + ny * spread, at.angle, long)
    }
  }

  function pot(
    state: GameState,
    s: Strike,
    p: number,
    seconds: number,
    zoom: number,
  ) {
    const { a, b } = endsOf(state, s)
    const r = Math.max(1.6, 6 / zoom)
    for (let k = PUFFS; k >= 1; k--) {
      const t = p - k * 0.035
      if (t <= 0) continue
      const at = along(a, b, t, true)
      g.circle(at.x, at.y - k * r * 0.2, r * (0.5 + 0.22 * k)).fill({
        color: TONE.slate,
        alpha: 0.32 * (1 - k / (PUFFS + 1)),
      })
    }
    const at = along(a, b, p, true)
    drawPot(g, at.x, at.y, r, 0.5 + 0.5 * Math.sin(seconds * 19))
  }

  return {
    container,
    draw(state: GameState, zoom: number, between: number) {
      const seconds = performance.now() / 1000
      if (state.tick !== tick) read(state, seconds)
      g.clear()
      for (const s of state.strikes) {
        const p = progress(state, s, between)
        ring(state, s, p, seconds, zoom)
        if (s.coup === 'troublemaker') walker(state, s, p, seconds, zoom)
        else if (s.coup === 'archers') volley(state, s, p, zoom)
        else pot(state, s, p, seconds, zoom)
        // The way a flight still has to go, dotted faintly in ink.
        if (s.coup !== 'troublemaker' && s.owner === me) {
          const { a, b } = endsOf(state, s)
          dots(g, wayOf(a, b, true, p, 1), 3 / zoom)
          g.stroke({ width: 1 / zoom, color: TONE.ink, alpha: 0.3 })
        }
      }
      fx.clear()
      for (let i = ended.length - 1; i >= 0; i--)
        if (!drawFallen(fx, state, ended[i], seconds, zoom)) ended.splice(i, 1)
    },
  }
}
