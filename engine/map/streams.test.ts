import { describe, expect, it } from 'vitest'
import { riverTiles } from './streams'

// The rivers made water (streams.ts): a tile wide at the spring, three at
// the mouth, one water all along.

describe('the rivers as water', () => {
  it('is a tile wide at its spring and three at its mouth', () => {
    // Across a 40 by 9 grid of tiles 4 units a side, along its middle row.
    const river = Array.from(
      { length: 11 },
      (_, i) => [i * 16 + 2, 18] as const,
    )
    const wet = riverTiles([river], 40, 9, 4)
    const across = (x: number) =>
      Array.from({ length: 9 }, (_, y) => y).filter((y) => wet.has(y * 40 + x))
    expect(across(1)).toEqual([4])
    expect(across(38)).toEqual([3, 4, 5])
    // No gap along it.
    for (let x = 0; x < 40; x++) expect(across(x)).toContain(4)
  })
})
