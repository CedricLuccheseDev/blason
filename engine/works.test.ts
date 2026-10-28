import { describe, expect, it } from 'vitest'
import { UNIT } from './units'
import { attack, endow, field, hold, playing, run } from './testing'
import { build, priceOf } from './works'

describe('the works', () => {
  it('stand side by side on one’s own land, one a tile, castles alone kept apart; the first village free, then each double', () => {
    const state = playing(field(40))
    hold(
      state,
      0,
      Array.from({ length: 40 }, (_, i) => i),
    )
    endow(state, 0, 0, 10_000)
    const village = state.rules.workPrice.village
    build(state, 0, 0, 'village')
    build(state, 0, 1, 'village')
    build(state, 0, 2, 'village')
    expect(state.works).toHaveLength(3)
    expect(state.players[0].gold).toBe((10_000 - 3 * village) * UNIT)
    expect(priceOf(state, 0, 'village')).toBe(4 * village)
    build(state, 0, 2, 'market')
    expect(state.works).toHaveLength(3)
    build(state, 0, 10, 'castle')
    build(state, 0, 13, 'castle')
    build(state, 0, 30, 'castle')
    const castles = state.works.filter((w) => w.work === 'castle')
    expect(castles.map((w) => w.tile)).toEqual([10, 30])
  })

  it('pass to whoever takes their tile; a free village taken brings its gold and becomes the taker’s village', () => {
    const state = playing(field(6))
    hold(state, 0, [0])
    hold(state, 1, [5])
    state.villages = [2]
    endow(state, 0, 400, 50)
    run(state, 1, [attack(0, 2, 'host')])
    expect(state.owner[2]).toBe(0)
    expect(state.villages).toEqual([])
    expect(state.works).toEqual([{ work: 'village', tile: 2, owner: 0 }])
    // Its fifty gold untouched, the men being free, and the village's.
    expect(state.players[0].gold).toBe((50 + state.rules.villageGold) * UNIT)
  })
})
