import { describe, expect, it } from 'vitest'
import { makeGrid } from '../grid'
import { createGame } from '../land'
import { RULES } from '../rules'
import { generateWorld } from './generate'
import { pickShape } from './shapes'
import type { ShapeKind } from './shapes'
import type { World } from './generate'

// The second generator, the relief's: the same land from the same seed, and
// one land whatever the family, tile by tile.

const relief = (seed: string, size: World['size'] = 'standard') =>
  generateWorld(seed, { size, generator: 'relief' })

/** The first seed that draws each family of shapes. */
function seedsByFamily(): Map<ShapeKind, string> {
  const found = new Map<ShapeKind, string>()
  for (let i = 0; found.size < 6 && i < 200; i++) {
    const seed = `family-${i}`
    const kind = pickShape(seed).kind
    if (!found.has(kind)) found.set(kind, seed)
  }
  return found
}
const families = [...seedsByFamily()].map(([kind, seed]) => ({
  kind,
  world: relief(seed),
}))

/** Pieces of a graph, the cells of each walked by their neighbours. */
function pieces(cells: Array<{ neighbors: Array<number> }>): number {
  const seen = new Set<number>()
  let count = 0
  cells.forEach((_, start) => {
    if (seen.has(start)) return
    count++
    seen.add(start)
    const queue = [start]
    for (const at of queue)
      for (const n of cells[at].neighbors)
        if (!seen.has(n)) {
          seen.add(n)
          queue.push(n)
        }
  })
  return count
}

const gridOf = (w: World) => makeGrid(w.map, w.width, w.height, RULES.tileSize)

describe('the relief generator', () => {
  it('draws the same land from the same seed, another from another, and leaves the first generator the default', () => {
    const w = families[0].world
    expect(relief(w.seed)).toEqual(w)
    expect(relief('montfroid').map).not.toEqual(w.map)
    expect(w.generator).toBe('relief')
    expect(generateWorld(w.seed).generator).toBe('classic')
  })

  it('raises each of the six families as one land of some two thousand cells', () => {
    expect(new Set(families.map((f) => f.world.shape))).toEqual(
      new Set(['coast', 'continent', 'fjords', 'inland', 'isthmus', 'strip']),
    )
    for (const { world } of families) {
      expect(pieces(world.map.land)).toBe(1)
      expect(world.map.land.length).toBeGreaterThan(1600)
      expect(world.map.land.length).toBeLessThan(2100)
      expect(world.rivers.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('keeps the land one, tile by tile', () => {
    for (const { world } of families) {
      const grid = gridOf(world)
      const game = createGame(grid, 20, world.seed)
      // The game plays the largest piece of the tiles: it is nearly all of them.
      expect(game.grid.area / grid.area).toBeGreaterThan(0.995)
    }
  })

  it('draws larger lands at larger sizes, as one, the same from the same seed', () => {
    const seed = families[0].world.seed
    const standard = gridOf(families[0].world).area
    const large = relief(seed, 'large')
    expect(gridOf(large).area / standard).toBeGreaterThan(1.7)
    expect(gridOf(large).area / standard).toBeLessThan(2.3)
    expect(pieces(large.map.land)).toBe(1)
    expect(relief(seed, 'large')).toEqual(large)
  })
})
