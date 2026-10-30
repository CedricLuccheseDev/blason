import {
  Container,
  FillPattern,
  Graphics,
  GraphicsContext,
  Matrix,
  Texture,
} from 'pixi.js'
import { css } from '../art/ink'
import { mixColor } from '../ease'
import { chain, flatten, simplify } from '../geometry'
import { TONE } from '../palette'
import type { Point, World } from '../../../engine'

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
/** How far from the coast's own line a shore line may stray, against its distance from the shore. */
const WITHIN = 0.04

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
    // So far from the shore, the coast's smallest turns do not show: a
    // line a twenty-fifth of its distance from the coast's is enough.
    const plain = coast.map((run) => flatten(simplify(run, d * WITHIN)))
    for (const run of plain) g.poly(run, false)
    g.stroke({
      ...line,
      width: 2 * d + width,
      color: mixColor(TONE.seaWash, TONE.seaLine, strength),
    })
    for (const run of plain) g.poly(run, false)
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

/**
 * Each land cell's outline for a fill: its sides between two land cells
 * straight, the same line seen from both, so that no crack opens between
 * them (only the coast is seen); its coast and the frame as drawn.
 */
export function plainCells(
  land: ReadonlyArray<{ outline: Array<Point> }>,
): Array<Array<Point>> {
  const at = ([x, y]: Point) => `${x},${y}`
  const cells = new Map<string, number>()
  const sides = new Set<string>()
  for (const { outline } of land)
    outline.forEach((p, i) => {
      cells.set(at(p), (cells.get(at(p)) ?? 0) + 1)
      sides.add(`${at(p)}|${at(outline[(i + 1) % outline.length])}`)
    })
  /** Whether a side is shared with another land cell, which traces it the other way. */
  const inland = (a: Point, b: Point) => sides.has(`${at(b)}|${at(a)}`)
  return land.map(({ outline }) => {
    const n = outline.length
    return outline.filter((p, i) => {
      const [a, b] = [outline[(i + n - 1) % n], outline[(i + 1) % n]]
      return cells.get(at(p)) !== 2 || !inland(a, p) || !inland(p, b)
    })
  })
}

/**
 * The land, bare parchment, as one shape the map lays and clips to several
 * times: its cells filled (plainCells), and a fine line along the coast so
 * that what it clips reaches under the coast's ink.
 */
export function landShape(world: World): GraphicsContext {
  const shape = new GraphicsContext()
  for (const cell of plainCells(world.land)) shape.poly(flatten(cell))
  shape.fill(TONE.page)
  for (const run of chain(world.coast)) shape.poly(flatten(run), false)
  return shape.stroke({
    width: 0.6,
    color: TONE.page,
    join: 'round',
    cap: 'round',
  })
}

/** The dead land: dark, brown-black, as a land beyond the game is inked out on an old map (« Il faut instaurer des dead space », « il faut mettre en marron noir les lands dead »), and hatched a shade lighter, lest it read as sea. */
export const DEAD = mixColor(TONE.ink, TONE.page, 0.12)
const HATCH = mixColor(DEAD, TONE.page, 0.14)
/** The hatching's tile, in pixels of its texture, and in map units. */
const [TILE, SPAN] = [16, 7]

/** The hatching: a stroke across each tile, joined from one to the next. */
function hatching(): FillPattern {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = TILE
  const g = canvas.getContext('2d')
  if (g) {
    g.fillStyle = css(DEAD)
    g.fillRect(0, 0, TILE, TILE)
    g.strokeStyle = css(HATCH)
    g.lineWidth = 2
    g.beginPath()
    for (const k of [-TILE, 0, TILE]) {
      g.moveTo(k, TILE)
      g.lineTo(k + TILE, 0)
    }
    g.stroke()
  }
  const pattern = new FillPattern(Texture.from(canvas), 'repeat')
  pattern.setTransform(new Matrix().scale(SPAN / TILE, SPAN / TILE))
  return pattern
}

/** The dead land, others' than the map's own (atlas.ts): drawn, dulled and hatched, bare, no lord's wash ever over it. */
function deadShape(world: World): GraphicsContext {
  const shape = new GraphicsContext()
  if (world.dead.length === 0) return shape
  for (const cell of plainCells(world.dead)) shape.poly(flatten(cell))
  return shape.fill(hatching())
}

/** The land's parchment under the lords' washes, and the dead land beside it. */
export const landLayers = (world: World, shape: GraphicsContext) => [
  new Graphics(shape),
  new Graphics(deadShape(world)),
]
