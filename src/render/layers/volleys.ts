import { Container, Graphics } from 'pixi.js'
import { TICKS_PER_SECOND, shootsAt, underFire } from '../../../engine'
import { drawArrow } from '../art/coups'
import { CASTLE } from '../art/plans'
import { workScale } from '../art/works'
import { along } from '../flight'
import { siteOf } from '../marks'
import { hash } from '../pen'
import type { At } from '../flight'
import type { Box } from '../camera'
import type { GameState, Host } from '../../../engine'

// The castles' arrows (engine/volleys.ts), seen by all. A castle's volleys
// come on a rhythm, so the archers on its towers loose a moment before each,
// and the arrows, the archers coup's (art/coups.ts) on the same arc
// (flight.ts), come down on the men of each enemy army fighting in its zone
// as the volley takes them, so that they fall under it (armies.ts); then
// they stay planted round them a moment, and are gone. A volley the screen
// was too late to see coming, ticks played at once, falls where it struck.

/** Ticks the arrows fly: they are loosed so long before the volley takes its men. */
const FLIGHT = 5
/** Arrows a volley looses at an army, and the seconds between the first and the last. */
const ARROWS = 7
const STAGGER = 0.12
/** How far round the army's men they fall, in map units; how long they stay planted, the last of it fading, in seconds. */
const SPREAD = 7
const PLANTED = 1.4
const FADE = 0.6

/** Where the archers stand, in the castle's drawing (art/plans.ts): the top of its keep and of its four towers. */
const { keep, corners, backTower, frontTower } = CASTLE
const TOWERS: ReadonlyArray<At> = [
  { x: keep.x, y: keep.y - keep.h },
  { x: corners.BL[0], y: corners.BL[1] - backTower[1] },
  { x: corners.BR[0], y: corners.BR[1] - backTower[1] },
  { x: corners.FL[0], y: corners.FL[1] - frontTower[1] },
  { x: corners.FR[0], y: corners.FR[1] - frontTower[1] },
]

/** A volley at an army: the castle's tile, when it is loosed and when it falls, in seconds, and where, as last seen. */
type Volley = {
  castle: number
  host: Host
  loosed: number
  lands: number
  at: At
  seed: number
}

/** Whether a volley's way, from its castle's towers, drawn `k` times their size, to its army and the arc over it, crosses the map on screen. */
function seen(view: Box, a: At, b: At, k: number) {
  const room = Math.hypot(b.x - a.x, b.y - a.y) + SPREAD + 10 * k
  return (
    Math.max(a.x, b.x) + room > view.left &&
    Math.min(a.x, b.x) - room < view.right &&
    Math.max(a.y, b.y) + room > view.top &&
    Math.min(a.y, b.y) - room < view.bottom
  )
}

/** `menOf`: where an army's men stand this frame, their middle (armies.ts). */
export function makeVolleys(menOf: (host: Host) => At | null) {
  const container = new Container()
  const g = container.addChild(new Graphics())
  const volleys: Array<Volley> = []
  let tick = -1
  /** The first tick not yet looked at for a volley. */
  let ahead = -1
  let seeds = 0

  /** Where the arrows aimed at an army fall: on its men, or its front while none are drawn. */
  const aim = (state: GameState, host: Host) =>
    menOf(host) ?? siteOf(state, host.edge.at(0) ?? host.entry)

  /**
   * The volleys coming within the arrows' flight, read from the castles'
   * rhythm, and those played since the last tick read and not yet seen.
   * Each falls as the game shows its toll, at the tick after its own.
   */
  function read(state: GameState, seconds: number, between: number) {
    const from = Math.max(ahead, state.tick - FLIGHT)
    ahead = state.tick + FLIGHT
    for (const castle of state.works) {
      if (castle.work !== 'castle') continue
      for (let t = from; t < ahead; t++) {
        if (!shootsAt(state, castle, t)) continue
        const wait = Math.max(0, t + 1 - state.tick - between)
        const lands = seconds + wait / TICKS_PER_SECOND
        for (const host of underFire(state, castle))
          volleys.push({
            castle: castle.tile,
            host,
            loosed: seconds,
            lands,
            at: aim(state, host),
            seed: seeds++,
          })
      }
    }
  }

  /** A volley's arrows, each from a tower to a spot round the army: flying, or planted once fallen, half their shafts in the earth. */
  function loose(v: Volley, castle: At, k: number, long: number, now: number) {
    for (let i = 0; i < ARROWS; i++) {
      const tower = TOWERS[(v.seed + i) % TOWERS.length]
      const from = { x: castle.x + tower.x * k, y: castle.y + tower.y * k }
      const r = SPREAD * Math.sqrt(hash(v.seed, i, 1))
      const turn = hash(v.seed, i, 2) * Math.PI * 2
      const to = {
        x: v.at.x + Math.cos(turn) * r,
        y: v.at.y + Math.sin(turn) * r,
      }
      // Loosed one after another, they come down as the men fall, the last with them.
      const late = (i / (ARROWS - 1)) * STAGGER
      const leaves = v.loosed + late
      const falls = Math.max(leaves, v.lands - STAGGER + late)
      if (now < leaves) continue
      if (now < falls) {
        const at = along(from, to, (now - leaves) / (falls - leaves), true)
        drawArrow(g, at.x, at.y, at.angle, long)
        continue
      }
      // Fallen, half its shaft in the earth, fading at the last.
      const fade = Math.min(1, (PLANTED - (now - falls)) / FADE)
      const { angle } = along(from, to, 1, true)
      if (fade > 0) drawArrow(g, to.x, to.y, angle, long * 0.6, fade)
    }
  }

  return {
    container,
    draw(state: GameState, zoom: number, view: Box, between: number) {
      const now = performance.now() / 1000
      if (state.tick !== tick) {
        read(state, now, between)
        tick = state.tick
      }
      g.clear()
      const k = workScale(zoom)
      // The coup's arrows' size, never under so many pixels.
      const long = Math.max(2.5, 14 / zoom)
      for (let i = volleys.length - 1; i >= 0; i--) {
        const v = volleys[i]
        if (now > v.lands + STAGGER + PLANTED) {
          volleys.splice(i, 1)
          continue
        }
        // The arrows follow the army's men until they fall.
        if (now < v.lands) v.at = aim(state, v.host)
        const castle = siteOf(state, v.castle)
        if (seen(view, castle, v.at, k)) loose(v, castle, k, long, now)
      }
    },
  }
}
