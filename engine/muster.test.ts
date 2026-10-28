import { describe, expect, it } from 'vitest'
import { attack, endow, field, hold, muster, playing, run } from './testing'

describe('the armies raised at the barracks', () => {
  it('march from the free barracks nearest the front, one army a barracks', () => {
    // Lord 0 holds most of a row, a barracks at each end of it; lord 1 the end.
    const state = playing(field(20))
    hold(
      state,
      0,
      Array.from({ length: 15 }, (_, t) => t),
    )
    muster(state, 0, 0)
    muster(state, 0, 10)
    hold(state, 1, [15, 16, 17, 18, 19])
    endow(state, 0, 1000)
    endow(state, 1, 50)
    run(state, 1, [attack(0, 17, 'raid')])
    expect(state.hosts.map((h) => h.from)).toEqual([10])
    expect(state.hosts[0].road).toEqual([10, 11, 12, 13, 14])
    run(state, 1, [attack(0, 18, 'raid')])
    expect(state.hosts.map((h) => h.from)).toEqual([10, 0])
    // Every barracks has its army out: a third click raises none.
    run(state, 1, [attack(0, 19, 'raid')])
    expect(state.hosts).toHaveLength(2)
  })

  it('take nothing until they reach the front, a few tiles a second', () => {
    const state = playing(field(20))
    hold(
      state,
      0,
      Array.from({ length: 15 }, (_, t) => t),
    )
    muster(state, 0, 0)
    hold(state, 1, [15, 16, 17, 18, 19])
    endow(state, 0, 1000)
    endow(state, 1, 50)
    run(state, 10, [attack(0, 17, 'host')])
    expect(state.owner[15]).toBe(1)
    run(state, 20)
    expect(state.owner[15]).toBe(0)
  })
})
