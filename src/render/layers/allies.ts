import { Container, Graphics } from 'pixi.js'
import { flatten } from '../geometry'
import { alongBorder } from '../pen'
import { TONE } from '../palette'
import { facing } from '../trace'
import type { GameState, Point } from '../../../engine'

// The borders between allies, in green, the peaceful counterpart of the red
// of a war: where the player's land meets an ally's, their shared border is
// inked again in a calm green over the pen line, on the line of the lands'
// own border as last traced (regions.ts); between two other lords allied
// together, a thinner and fainter one, so that the player's own read first.
// Traced again only with the lands, or when an alliance is made or ends;
// each comes and goes in a fade.

/** Seconds for an alliance's border to fade in or out. */
const FADE = 0.8
/** The player's own and the others': the line's width in map units, never under so many pixels on screen, and its strength. */
const MINE = { wide: 2, seen: 2, alpha: 0.85 }
const THEIRS = { wide: 1.1, seen: 1, alpha: 0.45 }

/** A lord's outline as last traced, his land on the right of its course. */
type Outline = (lord: number) => Array<Array<Point>>
/** Two allies' shared border: its lines, and whether the alliance still holds. */
type Pact = {
  a: number
  b: number
  g: Graphics
  lines: Array<Array<number>>
  on: boolean
}

export function makeAllies(me: number, outline: Outline) {
  const container = new Container()
  const pacts = new Map<string, Pact>()
  let made = ''
  let seen = 0
  let last = -Infinity

  /** The border of two allies, read along the player's outline when he is one of them. */
  function shared(state: GameState, a: number, b: number) {
    const [from, to] = b === me ? [b, a] : [a, b]
    return outline(from)
      .flatMap((loop) => facing(loop, state.grid, (t) => state.owner[t] === to))
      .map((s) => flatten(alongBorder(s.line)))
  }

  function ink(pact: Pact, zoom: number) {
    seen = zoom
    const style = pact.a === me || pact.b === me ? MINE : THEIRS
    pact.g.clear()
    if (pact.lines.length === 0) return
    for (const line of pact.lines) pact.g.poly(line, false)
    pact.g.stroke({
      width: Math.max(style.wide, style.seen / zoom),
      color: TONE.pact,
      alpha: style.alpha,
      join: 'round',
      cap: 'round',
    })
  }

  /** Every alliance's border read again; those of alliances ended keep theirs as they fade. */
  function trace(state: GameState, zoom: number) {
    const holding = new Set<string>()
    for (const { a, b } of state.alliances) {
      const key = [Math.min(a, b), Math.max(a, b)].join(':')
      holding.add(key)
      let pact = pacts.get(key)
      if (!pact) {
        pact = {
          a,
          b,
          g: container.addChild(new Graphics()),
          lines: [],
          on: true,
        }
        pact.g.alpha = 0
        pacts.set(key, pact)
      }
      pact.on = true
      pact.lines = shared(state, a, b)
      ink(pact, zoom)
    }
    for (const [key, pact] of pacts) if (!holding.has(key)) pact.on = false
  }

  /** Each border on its way in or out; one faded out is forgotten. */
  function fade(dt: number) {
    for (const [key, pact] of pacts) {
      const alpha = pact.g.alpha + (pact.on ? dt : -dt) / FADE
      pact.g.alpha = Math.max(0, Math.min(1, alpha))
      if (pact.on || pact.g.alpha > 0) continue
      pact.g.destroy()
      pacts.delete(key)
    }
  }

  return {
    container,
    /** Read again when the lands were traced or an alliance was made or ended; inked again when the zoom moved; faded each frame. */
    draw(state: GameState, zoom: number, traced: boolean, now: number) {
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000))
      last = now
      const allied = state.alliances.map((x) => [x.a, x.b].join(':')).join()
      if (traced || allied !== made) trace(state, zoom)
      else if (Math.abs(zoom / seen - 1) >= 0.1)
        for (const pact of pacts.values()) ink(pact, zoom)
      made = allied
      fade(dt)
    },
  }
}
