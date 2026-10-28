import { describe, expect, it } from 'vitest'
import { UNIT } from './units'
import { attack, endow, field, hold, muster, playing, run } from './testing'
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

  it('pass to whoever takes their tile; a free village taken brings its gold and becomes the taker’s village', () => {
    const state = playing(field(6))
    hold(state, 0, [0])
    muster(state, 0, 0)
    hold(state, 1, [5])
    state.villages = [2]
    endow(state, 0, 400, 50)
    run(state, 3, [attack(0, 2, 'host')])
    expect(state.owner[2]).toBe(0)
    expect(state.villages).toEqual([])
    expect(state.works.at(-1)).toEqual({ work: 'village', tile: 2, owner: 0 })
    // Its fifty gold untouched, the men being free, and the village's.
    expect(state.players[0].gold).toBe((50 + state.rules.villageGold) * UNIT)
  })
})
