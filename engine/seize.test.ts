import { describe, expect, it } from 'vitest'
import { standing } from './land'
import { TICKS_PER_SECOND } from './units'
import { attack, endow, field, hold, muster, playing, run } from './testing'

describe('a work taken', () => {
  it('stands idle a while before it serves its new lord', () => {
    // A third lord apart, so that the game goes on once the second falls.
    const state = playing(field(30), 3)
    hold(state, 0, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    hold(state, 1, [10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
    hold(state, 2, [25, 26, 27, 28, 29])
    endow(state, 2, 400)
    muster(state, 0, 0)
    muster(state, 1, 12)
    endow(state, 0, 400)
    endow(state, 1, 5)
    run(state, 1, [attack(0, 12, 'host')])
    const village = state.works.find((w) => w.tile === 12)
    // Tick by tick until it is taken.
    for (let t = 0; t < 30 * TICKS_PER_SECOND && village?.owner !== 0; t++)
      run(state, 1)
    expect(village?.owner).toBe(0)
    expect(village && standing(state, village)).toBe(false)
    run(state, state.rules.seizedTicks)
    expect(village && standing(state, village)).toBe(true)
  })
})
