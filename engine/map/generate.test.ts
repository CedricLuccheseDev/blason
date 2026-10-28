import { describe, expect, it } from 'vitest'
import { generateWorld } from './generate'

const world = generateWorld('valbrune')
const { land, sea } = world.map
const many = 'abcdef'.split('').map((seed) => generateWorld(seed))

function isOnePiece(map: (typeof world)['map']): boolean {
  const reached = new Set([0])
  for (const at of reached)
    map.land[at].neighbors.forEach((n) => reached.add(n))
  return reached.size === map.land.length
}

describe('the map generator', () => {
  it('draws the same land from the same seed, another from another', () => {
    expect(generateWorld('valbrune')).toEqual(world)
    expect(generateWorld('montfroid').map).not.toEqual(world.map)
  })

  it('cuts some two thousand cells of land of the same size, whatever the sea', () => {
    for (const w of many) {
      expect(w.map.land.length).toBeGreaterThan(1750)
      expect(w.map.land.length).toBeLessThan(2150)
      expect(w.map.sea.length).toBeGreaterThan(200)
      const cells = w.map.land.length + w.map.sea.length
      const area = (w.width * w.height) / cells
      expect(area).toBeGreaterThan(380)
      expect(area).toBeLessThan(490)
    }
  })

  it('draws lands of many shapes, the sea on any side', () => {
    expect(new Set(many.map((w) => w.shape)).size).toBeGreaterThanOrEqual(3)
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

  it('makes one single land, every cell within reach on foot', () => {
    expect(isOnePiece(world.map)).toBe(true)
    for (const w of many) expect(isOnePiece(w.map)).toBe(true)
  })

  it('draws an outline for each cell, a coast and a few rivers', () => {
    expect(world.land).toHaveLength(land.length)
    expect(world.land.every((c) => c.outline.length >= 3)).toBe(true)
    expect(world.coast.length).toBeGreaterThan(10)
    expect(world.rivers.length).toBeLessThanOrEqual(3)
  })
})
