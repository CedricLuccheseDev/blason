import { Container, Graphics } from 'pixi.js'
import { chain, flatten } from '../geometry'
import { alongBorder } from '../pen'
import { TONE, playerColor } from '../palette'
import { makeRibbon } from '../ribbon'
import { inside } from '../trace'
import type { Ribbon } from '../ribbon'
import type { Point, World } from '../../../engine'

// The borders over the ground and its decoration: just inside a lord's
// border a watercolour edge of his colour, strongest at the contact and
// fading inwards; on every border a ribbon of ink that swells and thins as a
// quill's, the darkest line of the map, a pixel and a half wide from afar
// and never over three up close; the free land's lighter. The coast in the
// same ink. Drawn again with the lands; widened, not traced, with the zoom.

/** The watercolour edge: how far inside each of its strokes runs, in map units, how wide, how strong. */
const RIM = [
  { by: 0.8, width: 1.6, alpha: 0.34 },
  { by: 2, width: 2.4, alpha: 0.22 },
  { by: 3.4, width: 2.8, alpha: 0.12 },
]

/** The ink's width in map units at so many pixels per unit: on screen 1.1 units, kept within 1.5 and 3 pixels. */
const inkWidth = (zoom: number) => Math.min(3, Math.max(1.5, 1.1 * zoom)) / zoom
const coastWidth = (zoom: number) =>
  Math.min(2.6, Math.max(1.3, 1.5 * zoom)) / zoom

type Drawn = { rim: Graphics | null; ink: Ribbon; free: boolean }

export function makeBorders(
  world: World,
  outline: (key: number) => Array<Array<Point>>,
) {
  const container = new Container()
  const rims = container.addChild(new Container())
  const inks = container.addChild(new Container())
  /** The coast, outside the land's clip, which the scene lays over it. */
  const coast = makeRibbon(
    chain(world.coast).map((run) => alongBorder(run)),
    TONE.ink,
    0.85,
  )
  const drawn = new Map<number, Drawn>()
  let width = 0
  let zoomed = 1

  function draw(key: number) {
    const old = drawn.get(key)
    if (old) {
      old.rim?.destroy()
      old.ink.mesh.destroy()
      drawn.delete(key)
    }
    const loops = outline(key)
    if (loops.length === 0) return
    const free = key < 0
    const ink = makeRibbon(
      loops.map((l) => alongBorder([...l, l[0]])),
      TONE.ink,
      free ? 0.45 : 0.85,
    )
    ink.widen(width * (free ? 0.7 : 1))
    inks.addChild(ink.mesh)
    let rim: Graphics | null = null
    if (!free) {
      rim = rims.addChild(new Graphics())
      for (const { by, width: w, alpha } of RIM) {
        for (const loop of loops) rim.poly(flatten(inside(loop, by)))
        rim.stroke({ width: w, color: playerColor(key), alpha, join: 'round' })
      }
    }
    drawn.set(key, { rim, ink, free })
  }

  return {
    container,
    coast: coast.mesh,
    /** The regions traced again drawn anew; every ribbon widened when the zoom moved enough. */
    update(traced: Set<number> | null, zoom: number) {
      const next = inkWidth(zoom)
      const widened = Math.abs(next / width - 1) > 0.03
      if (widened) width = next
      for (const key of traced ?? []) draw(key)
      if (!widened && Math.abs(zoom / zoomed - 1) < 0.03) return
      zoomed = zoom
      for (const d of drawn.values()) d.ink.widen(width * (d.free ? 0.7 : 1))
      coast.widen(coastWidth(zoom))
    },
  }
}
