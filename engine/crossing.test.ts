import { describe, expect, it } from 'vitest'
import { courseFor } from './course'
import { createGame } from './land'
import { RULES } from './rules'
import { attack, endow, hold, muster, owned, run, setupOf } from './testing'
import type { Grid } from './types'

/** Two lands across a strait: four columns of land, four of water, eight of land, three rows down. */
function strait(): Grid {
  const land = Array.from({ length: 48 }, (_, t) => t % 16 < 4 || t % 16 >= 8)
  return {
    width: 16,
    height: 3,
    size: 4,
    land,
    water: land.map((on) => !on),
    area: land.filter(Boolean).length,
  }
}

function game() {
  const state = createGame(strait(), setupOf(3), {
    ...RULES,
    fillSeconds: Number.MAX_SAFE_INTEGER,
    sickness: 0,
    seaWalled: 0,
  })
  state.tick = state.rules.openingTicks
  // Lord 0 holds the west's middle row, his village on it; lord 1 the east's
  // by the strait, lord 2 its far end: no land ringed by one alone, short of
  // a victory.
  hold(state, 0, [16, 17, 18, 19])
  hold(state, 1, [24, 25, 26, 27])
  hold(state, 2, [14, 15, 30, 31, 46, 47])
  muster(state, 0, 17)
  endow(state, 0, 400)
  return state
}

describe('the crossing', () => {
  it('sails from the coast to the shore nearest the click', () => {
    const course = courseFor(game(), 0, 26, 'host')
    // Landed by the click's row, its road over the water to beside it.
    expect(course?.entry).toBe(24)
    expect(course?.road).toEqual([17, 18, 19, 20, 21, 22, 23])
    expect(course?.through).toBe(false)
  })

  it('takes nothing at sea, then strikes from where it landed', () => {
    const state = game()
    run(state, 1, [attack(0, 26, 'host')])
    expect(state.hosts).toHaveLength(1)
    run(state, 60)
    expect(owned(state, 0)).toContain(24)
    // The water stays no one's.
    expect(owned(state, 0).some((t) => t % 16 >= 4 && t % 16 < 8)).toBe(false)
  })

  it('finds no way where no water joins the lands', () => {
    const state = game()
    // A wall of mountains for the strait: no land, and no water either.
    state.grid = { ...state.grid, water: state.grid.water.map(() => false) }
    expect(courseFor(state, 0, 26, 'host')).toBeNull()
  })
})
