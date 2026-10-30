import { describe, expect, it } from 'vitest'
import { ATLAS_MAPS } from './atlas'
import { generateWorld } from './generate'

/** The pieces of land, by their cells' neighbours. */
function pieces(world: ReturnType<typeof generateWorld>): Array<number> {
  const { land } = world.map
  const seen = new Uint8Array(land.length)
  const sizes: Array<number> = []
  land.forEach((_, start) => {
    if (seen[start]) return
    seen[start] = 1
    const queue = [start]
    for (const at of queue)
      for (const n of land[at].neighbors)
        if (!seen[n]) {
          seen[n] = 1
          queue.push(n)
        }
    sizes.push(queue.length)
  })
  return sizes.sort((a, b) => b - a)
}

describe('a map of the Earth', () => {
  it('is the same from a seed, at its own size', () => {
    const a = generateWorld('atlas', { atlas: 'europe' })
    expect(a.size).toBe('large')
    expect(a.atlas).toBe('europe')
    expect(generateWorld('atlas', { atlas: 'europe' }).land.length).toBe(
      a.land.length,
    )
  })

  it('keeps its islands apart, its straits open, its rivers the real ones', () => {
    const world = generateWorld('atlas', { atlas: 'europe' })
    const sizes = pieces(world)
    // The continent, then Great Britain, Ireland, Sicily, Sardinia and more.
    expect(sizes.length).toBeGreaterThanOrEqual(6)
    expect(sizes[1]).toBeGreaterThan(80)
    expect(world.rivers.length).toBeGreaterThan(100)
  })

  it('lists its maps, the smallest first', () => {
    expect(ATLAS_MAPS).toContain('europe')
  })
})
