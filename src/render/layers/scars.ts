import { Container, Graphics } from 'pixi.js'
import { burnt, rebelled } from '../../../engine'
import { TONE } from '../palette'
import { drawRebels } from '../art/coups'
import { tilesRound } from '../flight'
import type { GameState, Scar } from '../../../engine'

// What the coups leave on the land (engine/scars.ts), seen by all: the
// free land the rebels hold, hatched in ink across its tiles and outlined,
// a few rebels' pitchforks planted on it, each pennon of sanguine, until a
// lord takes the land back tile by tile; the ashes, a dark charred
// cross-hatching where no one may build, paling as the minute passes.
// Drawn again each tick, or when the zoom moved: the marks keep a size on
// screen.

/** Where the pitchforks stand, as shares of the scar's radius round its middle. */
const PLANTED: ReadonlyArray<[number, number]> = [
  [0, 0],
  [0.55, -0.3],
  [-0.5, 0.35],
]

export function makeScars() {
  const container = new Container()
  const g = container.addChild(new Graphics())
  const marks = container.addChild(new Graphics())
  let tick = -1
  let seen = 0

  /** Each tile's left and top, and its column and row. */
  const cornerOf = (state: GameState, t: number) => {
    const { width, size } = state.grid
    const [x, y] = [t % width, Math.floor(t / width)]
    return { x, y, left: x * size, top: y * size }
  }

  /** A held tile's sides where it meets a tile not held. */
  function outline(state: GameState, held: Set<number>, t: number) {
    const { size, width } = state.grid
    const { left, top } = cornerOf(state, t)
    const out = (n: number) => !held.has(n)
    const [right, bottom] = [left + size, top + size]
    if (out(t - width)) g.moveTo(left, top).lineTo(right, top)
    if (out(t + width)) g.moveTo(left, bottom).lineTo(right, bottom)
    if (t % width === 0 || out(t - 1)) g.moveTo(left, top).lineTo(left, bottom)
    if ((t + 1) % width === 0 || out(t + 1))
      g.moveTo(right, top).lineTo(right, bottom)
  }

  function rebels(state: GameState, scar: Scar, zoom: number) {
    const { size, width } = state.grid
    const held = new Set(
      tilesRound(state.grid, scar.tile, scar.radius).filter((t) =>
        rebelled(state, t),
      ),
    )
    if (held.size === 0) return
    for (const t of held) {
      const { x, y, left, top } = cornerOf(state, t)
      // Every other diagonal, so that the hatching runs on across the tiles.
      if ((x + y) % 2 === 0) g.moveTo(left, top + size).lineTo(left + size, top)
    }
    g.stroke({ width: Math.max(0.5, 1.1 / zoom), color: TONE.ink, alpha: 0.4 })
    for (const t of held) outline(state, held, t)
    g.stroke({
      width: Math.max(0.6, 1.6 / zoom),
      color: TONE.fightDark,
      alpha: 0.75,
    })
    const middle = cornerOf(state, scar.tile)
    const reach = scar.radius * size
    for (const [dx, dy] of PLANTED) {
      const x = middle.left + size / 2 + dx * reach
      const y = middle.top + size / 2 + dy * reach
      const t = Math.floor(y / size) * width + Math.floor(x / size)
      if (held.has(t)) drawRebels(marks, x, y, Math.max(5, 22 / zoom))
    }
  }

  function ashes(state: GameState, scar: Scar, zoom: number) {
    const { size } = state.grid
    const left = Math.max(0, scar.until - state.tick) / state.rules.ashTicks
    const tiles = tilesRound(state.grid, scar.tile, scar.radius).filter((t) =>
      burnt(state, t),
    )
    for (const t of tiles) {
      const c = cornerOf(state, t)
      g.rect(c.left, c.top, size, size)
    }
    g.fill({ color: TONE.char, alpha: 0.22 * left })
    for (const t of tiles) {
      const c = cornerOf(state, t)
      // On every other tile, both diagonals: lines that run on across the tiles, crossed.
      if ((c.x + c.y) % 2 !== 0) continue
      g.moveTo(c.left, c.top + size).lineTo(c.left + size, c.top)
      g.moveTo(c.left, c.top).lineTo(c.left + size, c.top + size)
    }
    g.stroke({
      width: Math.max(0.6, 1.5 / zoom),
      color: TONE.char,
      alpha: 0.7 * left,
    })
  }

  return {
    container,
    draw(state: GameState, zoom: number) {
      const same = Math.abs(zoom / seen - 1) < 0.1
      if (state.tick === tick && same) return
      tick = state.tick
      seen = zoom
      g.clear()
      marks.clear()
      for (const scar of state.scars)
        if (scar.kind === 'rebels') rebels(state, scar, zoom)
        else ashes(state, scar, zoom)
    },
  }
}
