import { Graphics } from 'pixi.js'
import { flatten } from '../geometry'
import { TONE } from '../palette'
import { corners, smooth } from '../trace'
import { FOREST, HILLS, MOUNTAINS } from './terrain'
import type { Terrain } from './terrain'
import type { Grid, Point } from '../../../engine'

// The ground's broad tones, at every distance: the woods, the hills and the
// mountains a shade darker than the land around them, multiplied into the wash, so that
// a lord's forest stays his colour, never another hue. Traced once round
// the tiles of each biome, their steps rounded off as the lands' are.

const DARKER = [
  [FOREST, 0.06],
  [HILLS, 0.035],
  [MOUNTAINS, 0.07],
] as const

/** Twice the area a loop encloses, signed by the way it turns. */
function area(loop: Array<Point>): number {
  let sum = 0
  loop.forEach(([x, y], i) => {
    const [nx, ny] = loop[(i + 1) % loop.length]
    sum += x * ny - nx * y
  })
  return sum
}

/** Whether a point lies inside a loop. */
function within([x, y]: Point, loop: Array<Point>): boolean {
  let inside = false
  for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
    const [xi, yi] = loop[i]
    const [xj, yj] = loop[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

/** Loops filled, those turning the other way cut out of the one round them, as a pen's fill leaves a clearing. */
function fillWithHoles(
  g: Graphics,
  loops: Array<Array<Point>>,
  style: { color: number; alpha: number },
) {
  const outer = loops.filter((l) => area(l) > 0)
  const holes = loops.filter((l) => area(l) <= 0)
  for (const loop of outer) {
    g.poly(flatten(loop)).fill(style)
    for (const hole of holes)
      if (within(hole[0], loop)) g.poly(flatten(hole)).cut()
  }
}

export function makeTones(grid: Grid, terrain: Terrain): Graphics {
  const g = new Graphics()
  for (const [biome, alpha] of DARKER) {
    const tiles: Array<number> = []
    terrain.biome.forEach((b, t) => {
      if (b === biome) tiles.push(t)
    })
    const loops = corners(
      grid.width,
      grid.height,
      (t) => terrain.biome[t] === biome,
      tiles,
    )
    fillWithHoles(
      g,
      loops.map((l) => smooth(l, grid.size)),
      { color: TONE.ink, alpha },
    )
  }
  g.blendMode = 'multiply'
  g.eventMode = 'none'
  return g
}
