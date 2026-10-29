import { describe, expect, it } from 'vitest'
import { courseFor } from './course'
import { attack, endow, field, hold, muster, playing, run } from './testing'
import type { GameState } from './types'

// The entry that brings an army soonest to the click (Concept, 29/10): its
// march round its lord's land against its way across the enemy's.

/** A land so many tiles across and down, its tiles given by the lord whose they are at each place, lord 0 holding the rest. */
function drawn(w: number, h: number, whose: (x: number, y: number) => number) {
  const state = playing(field(w, h), 3)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) hold(state, whose(x, y), [y * w + x])
  return state
}

/** Lord 0's land wrapped round lord 1's, deep: his village by the near side of it, its way round long. */
function wrapped(): GameState {
  const state = drawn(32, 45, (x, y) => (x >= 10 && x <= 21 && y < 40 ? 1 : 0))
  muster(state, 0, 5 * 32 + 5)
  endow(state, 0, 400)
  endow(state, 1, 400)
  return state
}

describe('the entry that brings it soonest', () => {
  it('enters by the near side and goes straight across, rather than all round the land to the side nearest the click', () => {
    const state = wrapped()
    // The click a tile from the far side of lord 1's land, ten from the near one.
    const click = 5 * 32 + 20
    run(state, 1, [attack(0, click, 'host')])
    const [host] = state.hosts
    expect(host.entry).toBe(5 * 32 + 10)
    expect(host.road).toEqual([165, 166, 167, 168, 169])
  })

  it('goes round to the far side when that is truly sooner: a short way round, a long way across', () => {
    // Lord 1's land wide and shallow, lord 2's strip keeping lord 0's from its bottom.
    const state = drawn(50, 11, (x, y) => {
      if (x < 10 || x >= 40 || y > 6) return 0
      return y === 6 ? 2 : 1
    })
    muster(state, 0, 3 * 50 + 5)
    endow(state, 0, 400)
    endow(state, 1, 400)
    run(state, 1, [attack(0, 3 * 50 + 38, 'host')])
    const [host] = state.hosts
    // In by the far side, at its corner nearest the way round.
    expect(host.entry).toBe(5 * 50 + 39)
    expect(host.road.at(-1)).toBe(5 * 50 + 40)
    expect(host.road).toHaveLength(42)
  })

  it('is shown before the click as the army takes it: the same entry, village or market, and road', () => {
    for (const army of ['raid', 'host', 'ban', 'mercenaries'] as const) {
      const state = wrapped()
      state.works.push({ work: 'market', tile: 20 * 32 + 27, owner: 0 })
      const click = 5 * 32 + 20
      const shown = courseFor(state, 0, click, army)
      run(state, 1, [attack(0, click, army)])
      const [host] = state.hosts
      expect(shown).toEqual({
        entry: host.entry,
        from: host.from,
        road: host.road,
      })
      expect(host.from).toBe(army === 'mercenaries' ? 20 * 32 + 27 : 165)
    }
  })

  it('shows where it would enter with every village’s army out, but sends none', () => {
    const state = wrapped()
    const click = 5 * 32 + 20
    run(state, 1, [attack(0, 30 * 32 + 15, 'raid')])
    expect(state.hosts).toHaveLength(1)
    // No village free: the border tile nearest the click, and no road.
    expect(courseFor(state, 0, click, 'host')).toEqual({
      entry: 5 * 32 + 21,
      from: -1,
      road: [],
    })
    run(state, 1, [attack(0, click, 'host')])
    expect(state.hosts).toHaveLength(1)
  })
})
