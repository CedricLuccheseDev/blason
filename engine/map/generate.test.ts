import { describe, expect, it } from 'vitest'
import { makeGrid } from '../grid'
import { RULES } from '../rules'
import { generateWorld } from './generate'
import { pickShape } from './shapes'
import type { ShapeKind } from './shapes'

/** The first generator's lands, as drawn before the relief became the default. */
const CLASSIC = { generator: 'classic' } as const

const world = generateWorld('valbrune', CLASSIC)
const { land, sea } = world.map
const many = 'abcdef'.split('').map((seed) => generateWorld(seed, CLASSIC))

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
  world: generateWorld(seed, CLASSIC),
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

describe('the map generator', () => {
  it('draws the same land from the same seed, another from another', () => {
    expect(generateWorld('valbrune', CLASSIC)).toEqual(world)
    expect(generateWorld('montfroid', CLASSIC).map).not.toEqual(world.map)
  })

  it('cuts some two thousand cells of land of the same size, whatever the sea', () => {
    for (const w of many) {
      expect(w.map.land.length).toBeGreaterThan(1650)
      expect(w.map.land.length).toBeLessThan(2150)
      expect(w.map.sea.length).toBeGreaterThan(200)
      const cells = w.map.land.length + w.map.sea.length
      const area = (w.width * w.height) / cells
      expect(area).toBeGreaterThan(380)
      expect(area).toBeLessThan(490)
    }
  })

  it('draws each of the six families of shapes for some seed, the sea on any side', () => {
    expect(new Set(families.map((f) => f.kind))).toEqual(
      new Set(['coast', 'continent', 'fjords', 'inland', 'isthmus', 'strip']),
    )
    for (const f of families) expect(f.world.shape).toBe(f.kind)
    const middles = many.map((w) => {
      const x = w.map.sea.reduce((sum, cell) => sum + cell.x, 0)
      return x / w.map.sea.length / w.width
    })
    expect(Math.max(...middles) - Math.min(...middles)).toBeGreaterThan(0.2)
  })

  it('gives whole positions inside the frame', () => {
    for (const cell of land) {
      expect(Number.isInteger(cell.x) && Number.isInteger(cell.y)).toBe(true)
      expect(cell.x).toBeGreaterThanOrEqual(0)
      expect(cell.x).toBeLessThanOrEqual(world.width)
      expect(cell.y).toBeGreaterThanOrEqual(0)
      expect(cell.y).toBeLessThanOrEqual(world.height)
    }
  })

  it('makes borders that work both ways, and coasts the sea agrees with', () => {
    land.forEach((cell, id) => {
      expect(cell.neighbors).not.toContain(id)
      for (const n of cell.neighbors) expect(land[n].neighbors).toContain(id)
      for (const s of cell.shore) expect(sea[s].coast).toContain(id)
    })
  })

  it('makes one single land, every cell within reach on foot, whatever the family', () => {
    expect(pieces(land)).toBe(1)
    for (const w of [...many, ...families.map((f) => f.world)])
      expect(pieces(w.map.land)).toBe(1)
  })

  it('digs lakes inland, apart from the sea', () => {
    const lakes = [world, ...many].map((w) => pieces(w.map.sea) - 1)
    expect(lakes.filter((n) => n > 0).length).toBeGreaterThanOrEqual(4)
  })

  it('places the four grounds in broad regions, the mountains the fewest', () => {
    const count = (b: string) => world.land.filter((c) => c.biome === b).length
    const n = world.land.length
    expect(count('mountains')).toBeGreaterThan(0)
    expect(count('mountains')).toBeLessThan(count('hills'))
    expect(count('hills')).toBeLessThan(count('forest'))
    expect(count('forest')).toBeLessThan(count('plain'))
    // No salt and pepper: nearly every cell has a neighbour of its ground.
    const alone = land.filter(
      (cell, id) =>
        !cell.neighbors.some(
          (m) => world.land[m].biome === world.land[id].biome,
        ),
    ).length
    expect(alone / n).toBeLessThan(0.02)
  })

  it('draws an outline for each cell, a coast and rivers from the high ground', () => {
    expect(world.land).toHaveLength(land.length)
    expect(world.land.every((c) => c.outline.length >= 3)).toBe(true)
    expect(world.coast.length).toBeGreaterThan(10)
    for (const w of [world, ...many]) {
      expect(w.rivers.length).toBeGreaterThanOrEqual(3)
      expect(w.rivers.length).toBeLessThanOrEqual(6)
    }
  })

  it('draws larger lands at larger sizes, their tiles and cells the same, the same from the same seed', () => {
    const tiles = (w: typeof world) =>
      makeGrid(w.map, w.width, w.height, RULES.tileSize).area
    const standard = tiles(world)
    const large = generateWorld('valbrune', { ...CLASSIC, size: 'large' })
    const huge = generateWorld('valbrune', { ...CLASSIC, size: 'huge' })
    expect(world.size).toBe('standard')
    expect(large.size).toBe('large')
    expect(tiles(large) / standard).toBeGreaterThan(1.8)
    expect(tiles(large) / standard).toBeLessThan(2.2)
    expect(tiles(huge) / standard).toBeGreaterThan(3.6)
    expect(tiles(huge) / standard).toBeLessThan(4.4)
    for (const w of [large, huge]) {
      const area = (w.width * w.height) / (w.map.land.length + w.map.sea.length)
      expect(area).toBeGreaterThan(380)
      expect(area).toBeLessThan(490)
      expect(pieces(w.map.land)).toBe(1)
    }
    // More rivers and lakes on a larger land, not longer ones only.
    expect(huge.rivers.length).toBeGreaterThan(world.rivers.length * 2)
    expect(pieces(huge.map.sea)).toBeGreaterThan(pieces(world.map.sea))
    expect(generateWorld('valbrune', { ...CLASSIC, size: 'huge' })).toEqual(
      huge,
    )
  })
})
