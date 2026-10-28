import { Container, Graphics } from 'pixi.js'
import { drawRavage, ravage } from '../art/ravage'
import { alongBorder } from '../pen'
import { facing } from '../trace'
import type { Ravage } from '../art/ravage'
import type { GameState, Point } from '../../../engine'

// The borders under attack, in red: wherever a lord's land is being bitten
// into, the border between the tiles just taken and what he still holds is
// inked again in red, on the line of the lands' own border as last traced
// (regions.ts), thick enough to be seen from afar, and ravaged along it
// (art/ravage.ts). It cools in a second and a half once the biting stops.
// It shows at a glance where the wars are, and whom they eat. Traced again
// only with the lands, a few times a second; between, only its strength
// changes, tick by tick.

/** Ticks a tile taken keeps its edge red; the line's width, in map units, never under so many pixels on screen. */
const RED = 15
const WIDE = 1.4
const SEEN = 3

/** A lord's outline as last traced, his land on the right of its course. */
type Outline = (lord: number) => Array<Array<Point>>
/** A stretch of border being bitten: when it was bitten last, and its line ravaged. */
type Front = { at: number; ravage: Ravage }

export function makeRaids(outline: Outline) {
  const container = new Container()
  const g = container.addChild(new Graphics())
  /** Who held each tile at the last tick read, and the tiles taken lately: from whom, and when. */
  let owner: Int32Array | null = null
  const taken = new Map<number, { from: number; at: number }>()
  let fronts: Array<Front> = []
  let tick = -1
  let seen = 0

  /** The tiles that changed hands since the last tick, from a lord. */
  function read(state: GameState) {
    if (owner) {
      for (let t = 0; t < state.owner.length; t++) {
        const was = owner[t]
        if (was >= 0 && state.owner[t] !== was)
          taken.set(t, { from: was, at: state.tick })
      }
    }
    owner = Int32Array.from(state.owner)
    for (const [t, { at }] of taken) if (state.tick - at > RED) taken.delete(t)
  }

  /** Each loser's border where it faces the tiles just taken from him, ravaged. */
  function trace(state: GameState) {
    const losers = new Set([...taken.values()].map((x) => x.from))
    fronts = [...losers].flatMap((from) =>
      outline(from)
        .flatMap((loop) =>
          facing(loop, state.grid, (t) => taken.get(t)?.from === from),
        )
        .map((s) => ({
          at: s.across.reduce((m, t) => Math.max(m, taken.get(t)?.at ?? m), 0),
          ravage: ravage(alongBorder(s.line)),
        })),
    )
  }

  return {
    container,
    /** Read each tick; traced again when the lands were; drawn again each tick, or when the zoom moved. */
    draw(state: GameState, zoom: number, traced: boolean) {
      if (state.tick !== tick) read(state)
      if (traced) trace(state)
      const same = Math.abs(zoom / seen - 1) < 0.1
      if (state.tick === tick && same && !traced) return
      tick = state.tick
      seen = zoom
      g.clear()
      const width = Math.max(WIDE, SEEN / zoom)
      for (const front of fronts) {
        const fresh = 1 - (state.tick - front.at) / RED
        if (fresh > 0) drawRavage(g, front.ravage, fresh, width, state.tick)
      }
    },
  }
}
