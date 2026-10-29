import { describe, expect, it } from 'vitest'
import { generateWorld } from '../../../engine'
import { plainCells } from './lands'
import type { Point } from '../../../engine'

describe('the land as one shape', () => {
  const world = generateWorld('lands-test')
  const plain = plainCells(world.land)
  const at = ([x, y]: Point) => `${x},${y}`
  const sidesOf = (cells: Array<Array<Point>>) => {
    const sides = new Set<string>()
    for (const cell of cells)
      cell.forEach((p, i) =>
        sides.add(`${at(p)}|${at(cell[(i + 1) % cell.length])}`),
      )
    return sides
  }

  it('fills the land with far fewer points', () => {
    const before = world.land.reduce((n, c) => n + c.outline.length, 0)
    const after = plain.reduce((n, c) => n + c.length, 0)
    expect(after).toBeLessThan(before * 0.7)
  })

  it('keeps every point of the coast', () => {
    const kept = new Set(plain.flatMap((c) => c.map(at)))
    for (const run of world.coast)
      for (const p of run) expect(kept.has(at(p))).toBe(true)
  })

  it('draws each side between two cells the same from both, so that no crack opens', () => {
    const sides = sidesOf(plain)
    const original = sidesOf(world.land.map((c) => c.outline))
    for (const side of sides) {
      const [a, b] = side.split('|')
      // The coast or the frame as it was, or shared with the cell across.
      expect(original.has(side) || sides.has(`${b}|${a}`)).toBe(true)
    }
  })
})
