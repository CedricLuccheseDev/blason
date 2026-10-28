import { Graphics } from 'pixi.js'
import { flatten } from '../geometry'
import { TONE } from '../palette'
import type { World } from '../../../engine'

// The land as a map drawn on a manuscript: the sea in a pale wash with three
// lines along its shores, and the land bare parchment, which the lords'
// lands are washed over.

/** How far from the shore each line runs, and how thick it is drawn. */
const SHORES = [17, 10, 4.5]
const SHORE_LINE = 0.9

/** The sea in a pale wash, with three lines along its shores. */
export function drawSea(world: World): Graphics {
  const g = new Graphics()
    .rect(0, 0, world.width, world.height)
    .fill(TONE.seaWash)
  // The coast drawn wide in the line's colour, then a little less wide in
  // the sea's: what is left is a line at that distance from every shore (the
  // land, drawn over it, hides the inner half). The coast alone, not every
  // cell's outline: a land of small cells would be painted over and over.
  const line = { join: 'round', cap: 'round' } as const
  for (const d of SHORES) {
    for (const run of world.coast) g.poly(flatten(run), false)
    g.stroke({ ...line, width: 2 * d + SHORE_LINE, color: TONE.seaLine })
    for (const run of world.coast) g.poly(flatten(run), false)
    g.stroke({ ...line, width: 2 * d - SHORE_LINE, color: TONE.seaWash })
  }
  return g
}

/** The land, bare parchment. */
export function drawLand(world: World): Graphics {
  const base = new Graphics()
  for (const cell of world.land) base.poly(flatten(cell.outline))
  return base
    .fill(TONE.page)
    .stroke({ width: 0.6, color: TONE.page, join: 'round' })
}
