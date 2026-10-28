import { Container, Graphics } from 'pixi.js'
import { TONE } from '../palette'
import type { GameState } from '../../../engine'

// The borders under attack, in red: wherever a lord's land is being bitten
// into, the edge between the tiles just taken and what he still holds burns
// bright red over a red glow, thick enough to be seen from afar, and cools in
// a second and a half once the biting stops. It shows at a
// glance where the wars are, and whom they eat. At the land's scale.

/** Ticks a tile taken keeps its edge red; the line's width, in map units, never under so many pixels on screen, and its glow's. */
const RED = 15
const WIDE = 1.4
const SEEN = 3
const GLOW = 4

export function makeRaids() {
  const container = new Container()
  const g = container.addChild(new Graphics())
  /** Who held each tile at the last tick read, and the tiles taken lately: from whom, and when. */
  let owner: Int32Array | null = null
  const taken = new Map<number, { from: number; at: number }>()
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

  /** A tile's sides facing land its loser still holds. */
  function sides(state: GameState, t: number, from: number) {
    const { width, size } = state.grid
    const x = (t % width) * size
    const y = Math.floor(t / width) * size
    const edges: Array<[number, number, number, number, number]> = [
      [t - width, x, y, x + size, y],
      [t + width, x, y + size, x + size, y + size],
      [t - 1, x, y, x, y + size],
      [t + 1, x + size, y, x + size, y + size],
    ]
    for (const [n, ax, ay, bx, by] of edges)
      if (state.owner[n] === from) g.moveTo(ax, ay).lineTo(bx, by)
  }

  /** Every recent tile's edge, the freshest the reddest, over a red glow: two strokes for each age. */
  function draw(state: GameState, zoom: number) {
    g.clear()
    const width = Math.max(WIDE, SEEN / zoom)
    const ages = new Map<number, Array<[number, number]>>()
    for (const [t, { from, at }] of taken) {
      const age = state.tick - at
      const list = ages.get(age) ?? []
      list.push([t, from])
      ages.set(age, list)
    }
    for (const [age, tiles] of ages) {
      const fresh = 1 - age / RED
      for (const [t, from] of tiles) sides(state, t, from)
      g.stroke({
        width: width * GLOW,
        color: TONE.fight,
        alpha: 0.25 * fresh,
        cap: 'round',
      })
      for (const [t, from] of tiles) sides(state, t, from)
      g.stroke({ width, color: TONE.fight, alpha: fresh, cap: 'round' })
    }
  }

  return {
    container,
    draw(state: GameState, zoom: number) {
      const same = Math.abs(zoom / seen - 1) < 0.1
      if (state.tick === tick && same) return
      if (state.tick !== tick) read(state)
      tick = state.tick
      seen = zoom
      draw(state, zoom)
    },
  }
}
