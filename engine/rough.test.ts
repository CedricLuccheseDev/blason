import { describe, expect, it } from 'vitest'
import { roughAt } from './rough'
import { field, playing } from './testing'

describe('the land’s roughness', () => {
  const state = playing(field(60, 40), 3)
  const tiles = Array.from({ length: 60 * 40 }, (_, t) => t)
  const { roughness } = state.rules

  it('lies between none and the rules’ roughness, the same each time', () => {
    for (const t of tiles) {
      const r = roughAt(state, 0, t)
      expect(r).toBeGreaterThanOrEqual(0)
      expect(r).toBeLessThanOrEqual(roughness)
      expect(roughAt(state, 0, t)).toBe(r)
    }
  })

  it('is smooth: two tiles side by side differ by a share of it, not all of it', () => {
    let most = 0
    for (const t of tiles)
      if (t % 60 < 59)
        most = Math.max(
          most,
          Math.abs(roughAt(state, 0, t) - roughAt(state, 0, t + 1)),
        )
    expect(most).toBeLessThanOrEqual(Math.ceil(roughness / 2))
  })

  it('is read shifted for each lord, that two fronts slowed on one tile do not cancel', () => {
    const differ = tiles.filter(
      (t) => roughAt(state, 0, t) !== roughAt(state, 1, t),
    )
    expect(differ.length).toBeGreaterThan(tiles.length / 2)
  })
})
