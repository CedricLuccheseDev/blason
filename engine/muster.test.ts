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

  it('strike from where they stand when the lord they march on cuts their road', () => {
    // Lord 1 marches from the far end of his row on lord 0, who takes the middle of it.
    const state = playing(field(30))
    hold(
      state,
      0,
      Array.from({ length: 10 }, (_, t) => t),
    )
    hold(
      state,
      1,
      Array.from({ length: 20 }, (_, t) => t + 10),
    )
    muster(state, 1, 29)
    endow(state, 0, 40)
    endow(state, 1, 800)
    run(state, 1, [attack(1, 5, 'host')])
    hold(state, 0, [18, 19, 20, 21])
    // At a walk it reaches the cut and takes back the land there, instead of going home.
    run(state, 20)
    expect([18, 19, 20, 21].map((t) => state.owner[t])).toEqual([1, 1, 1, 1])
  })
})
