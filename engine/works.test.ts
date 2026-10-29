import { describe, expect, it } from 'vitest'
import { UNIT } from './units'
import { capOf } from './land'
import { endow, field, hold, playing, run } from './testing'
import { build, priceOf } from './works'

describe('the works', () => {
  it('stand a few tiles apart on one’s own land, castles further; the first village free, then each double', () => {
    const state = playing(field(40))
    hold(
      state,
      0,
      Array.from({ length: 40 }, (_, i) => i),
    )
    endow(state, 0, 0, 10_000)
    const village = state.rules.workPrice.village
    // Four tiles from one another at least: the one at 6 is too near.
    build(state, 0, 0, 'village')
    build(state, 0, 4, 'village')
    build(state, 0, 6, 'village')
    build(state, 0, 8, 'village')
    expect(state.works.map((w) => w.tile)).toEqual([0, 4, 8])
    expect(state.players[0].gold).toBe((10_000 - 3 * village) * UNIT)
    expect(priceOf(state, 0, 'village')).toBe(4 * village)
    build(state, 0, 9, 'market')
    expect(state.works).toHaveLength(3)
    build(state, 0, 14, 'castle')
    build(state, 0, 20, 'castle')
    build(state, 0, 30, 'castle')
    const castles = state.works.filter((w) => w.work === 'castle')
    expect(castles.map((w) => w.tile)).toEqual([14, 30])
  })

  it('take their time to build, and serve only once done', () => {
    // Lord 0 holds half the row, short of winning, so that time runs.
    const state = playing(field(20))
    hold(
      state,
      0,
      Array.from({ length: 10 }, (_, i) => i),
    )
    hold(state, 1, [15])
    endow(state, 0, 0, 1000)
    const fed = capOf(state, 0)
    build(state, 0, 0, 'village')
    expect(capOf(state, 0)).toBe(fed)
    run(state, state.rules.buildTicks.village)
    expect(capOf(state, 0)).toBe(fed + state.rules.peasants.village * UNIT)
  })
})
