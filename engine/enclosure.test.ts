import { describe, expect, it } from 'vitest'
import { field, hold, playing, run } from './testing'

describe('the encircled land', () => {
  it('passes whole to the one lord all round it, works and all', () => {
    // A row of three: lord 1 holds one tile, ringed by lord 0; lord 2 holds the rest.
    const state = playing(field(10, 3), 3)
    hold(
      state,
      2,
      Array.from({ length: 30 }, (_, t) => t),
    )
    hold(state, 0, [5, 14, 16, 25])
    hold(state, 1, [15])
    state.works.push({ work: 'market', tile: 15, owner: 1 })
    run(state, 10)
    expect(state.owner[15]).toBe(0)
    expect(state.works[0].owner).toBe(0)
    expect(state.players[1].alive).toBe(false)
  })

  it('is not taken while it touches the sea, the edge, or two lords', () => {
    const state = playing(field(10, 3), 3)
    hold(
      state,
      2,
      Array.from({ length: 30 }, (_, t) => t),
    )
    // Lord 1 on the edge, ringed by lord 0 otherwise.
    hold(state, 0, [1, 11, 21, 22, 23, 13, 3])
    hold(state, 1, [2, 12])
    run(state, 10)
    expect(state.owner[2]).toBe(1)
  })

  it('takes free land walled by one lord and the sea, never by two', () => {
    // A row of ten: free land at the edge (0 to 2), lord 0 beside it; the
    // free tiles 6 and 7 between lords 0 and 1 stay free.
    const state = playing(field(10, 1), 2)
    hold(state, 0, [3, 4, 5])
    hold(state, 1, [8, 9])
    run(state, 10)
    expect([0, 1, 2].map((t) => state.owner[t])).toEqual([0, 0, 0])
    expect([6, 7].map((t) => state.owner[t])).toEqual([-1, -1])
  })
})
