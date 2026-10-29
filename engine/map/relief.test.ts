import { describe, expect, it } from 'vitest'
import { makeGrid } from '../grid'
import { createGame } from '../land'
import { RULES } from '../rules'
import { setupOf } from '../testing'
import { SEA } from '../types'
import { generateWorld } from './generate'
import { pickShape } from './shapes'
import type { ShapeKind } from './shapes'
import type { World } from './generate'

// The second generator, the relief's: the same land from the same seed, one
// land whatever the family, its high mountains closed to the armies as the
// sea, and the land between them one through their passes, tile by tile.

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
  it('draws the same land from the same seed, another from another, and is the default', () => {
    const w = families[0].world
    expect(relief(w.seed)).toEqual(w)
    expect(relief('montfroid').map).not.toEqual(w.map)
    expect(w.generator).toBe('relief')
    expect(generateWorld(w.seed)).toEqual(w)
    const classic = generateWorld(w.seed, { generator: 'classic' })
    expect(classic.map.peaks).toEqual([])
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

  it('makes the highest ground high mountains, drawn but neither land nor sea', () => {
    for (const { world } of families) {
      const share = world.map.peaks.length / world.map.land.length
      expect(share).toBeGreaterThan(0.06)
      expect(share).toBeLessThan(0.12)
      expect(world.peaks).toHaveLength(world.map.peaks.length)
      // The land below them has hills and woods, no mountains of its own.
      expect(world.land.some((c) => c.biome === 'mountains')).toBe(false)
    }
  })

  it('closes the mountains to the game, as the sea: no tile of them is land, no one holds one', () => {
    for (const { world } of families) {
      const grid = gridOf(world)
      const game = createGame(grid, setupOf(20, { seed: world.seed }))
      for (const p of world.map.peaks) {
        const tile =
          Math.floor(p.y / grid.size) * grid.width + Math.floor(p.x / grid.size)
        expect(grid.land[tile]).toBe(false)
        expect(game.owner[tile]).toBe(SEA)
      }
    }
  })

  it('keeps the land one through the passes, tile by tile, the ranges cut by some', () => {
    for (const { world } of families) {
      const grid = gridOf(world)
      const game = createGame(grid, setupOf(20, { seed: world.seed }))
      // The game plays the largest piece of the tiles: it is nearly all of them.
      expect(game.grid.area / grid.area).toBeGreaterThan(0.995)
    }
    const passes = families.map((f) => f.world.passes.length)
    expect(passes.reduce((a, b) => a + b, 0)).toBeGreaterThan(6)
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
