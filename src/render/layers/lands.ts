import { Container, Graphics } from 'pixi.js'
import { mixColor } from '../ease'
import { chain, flatten } from '../geometry'
import { TONE } from '../palette'
import type { World } from '../../../engine'

// The land as a map drawn on a manuscript: the sea in a pale wash with six
// lines along its shores, close at first and spreading out, fading as they
// go, and the land bare parchment, which the lords' lands are washed over.
// The lines thin as one comes closer, never under a third of a unit.

/** How far from the shore each line runs, and how strong it is against the sea's wash. */
const SHORES = [
  [2.2, 0.95],
  [4.8, 0.85],
  [8, 0.7],
  [12, 0.55],
  [17, 0.4],
  [23, 0.28],
] as const
/** The lines' width from afar, and up close; the zooms between which the one gives way to the other. */
const [WIDE, FINE] = [0.9, 0.4]
const [FROM, TO] = [2.6, 3.8]

/** The sea's wash with its shore lines so wide, in map units. */
function sea(world: World, width: number): Graphics {
  const g = new Graphics()
    .rect(0, 0, world.width, world.height)
    .fill(TONE.seaWash)
  // The coast drawn wide in the line's colour, then a little less wide in
  // the sea's: what is left is a line at that distance from every shore (the
  // land, drawn over it, hides the inner half). The coast alone, not every
  // cell's outline: a land of small cells would be painted over and over.
  const line = { join: 'round', cap: 'round' } as const
  const coast = chain(world.coast)
  for (const [d, strength] of [...SHORES].reverse()) {
    for (const run of coast) g.poly(flatten(run), false)
    g.stroke({
      ...line,
      width: 2 * d + width,
      color: mixColor(TONE.seaWash, TONE.seaLine, strength),
    })
    for (const run of coast) g.poly(flatten(run), false)
    g.stroke({ ...line, width: 2 * d - width, color: TONE.seaWash })
  }
  return g
}

/** The sea, its lines fine from close, wide from afar. */
export function makeSea(world: World) {
  const container = new Container()
  const wide = container.addChild(sea(world, WIDE))
  const fine = container.addChild(sea(world, FINE))
  return {
    container,
    /** At so many pixels per map unit. */
    draw(zoom: number) {
      const t = Math.max(0, Math.min(1, (zoom - FROM) / (TO - FROM)))
      fine.alpha = t
      fine.visible = t > 0
      wide.visible = t < 1
    },
  }
}

/** The land, bare parchment. */
export function drawLand(world: World): Graphics {
  const base = new Graphics()
  for (const cell of world.land) base.poly(flatten(cell.outline))
  return base
    .fill(TONE.page)
    .stroke({ width: 0.6, color: TONE.page, join: 'round' })
}
