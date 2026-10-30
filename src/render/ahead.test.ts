import { describe, expect, it } from 'vitest'
import { STANDARD, landAhead, takeLand } from './ahead'

describe('the land of a game to come', () => {
  it('is made once for its card, and taken as it is by its game', () => {
    const shown = landAhead('online-ahead', STANDARD)
    expect(landAhead('online-ahead', STANDARD)).toBe(shown)
    const { land, grid } = takeLand('online-ahead', STANDARD)
    expect(land).toBe(shown)
    expect(grid.width).toBeGreaterThan(0)
    // Another seed's game is made apart, the land kept left as it was.
    expect(takeLand('solo-ahead', STANDARD).land).not.toBe(shown)
    expect(landAhead('online-ahead', STANDARD)).toBe(shown)
  })
})
