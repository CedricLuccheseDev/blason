import { describe, expect, it } from 'vitest'
import { UNIT } from './units'
import { entryFor } from './course'
import {
  attack,
  endow,
  field,
  hold,
  muster,
  owned,
  playing,
  run,
} from './testing'
import type { GameState } from './types'

/** A row: lord 0 on the left, his village at its end; lord 1 in the middle; lord 2 on the right, touching lord 1 only. */
function row(): GameState {
  const state = playing(field(30), 3)
  hold(state, 0, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  hold(state, 1, [10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
  hold(state, 2, [20, 21, 22, 23, 24, 25, 26, 27, 28, 29])
  muster(state, 0, 0)
  endow(state, 0, 400)
  endow(state, 1, 400)
  endow(state, 2, 10)
  return state
}

const ally = (state: GameState, a: number, b: number) =>
  state.alliances.push({ a, b, expires: 1e9, renewA: false, renewB: false })

describe('an army passing through an ally', () => {
  it('cannot strike a lord beyond a land that is not an ally’s', () => {
    const state = row()
    expect(entryFor(state, 0, 25)).toBe(-1)
    run(state, 1, [attack(0, 25, 'host')])
    expect(state.hosts).toEqual([])
  })

  it('marches over its ally’s land and strikes the lord beyond it', () => {
    const state = row()
    ally(state, 0, 1)
    expect(entryFor(state, 0, 25)).toBe(20)
    run(state, 1, [attack(0, 25, 'host')])
    const host = state.hosts[0]
    expect(host.road.some((t) => state.owner[t] === 1)).toBe(true)
    run(state, 10 * 30)
    expect(owned(state, 0)).toContain(20)
  })

  it('goes home when the alliance is broken on the road', () => {
    const state = row()
    ally(state, 0, 1)
    run(state, 1, [attack(0, 25, 'host')])
    const men = state.hosts[0].men
    expect(men).toBe(100 * UNIT)
    state.alliances = []
    run(state, 10 * 5)
    expect(state.hosts).toEqual([])
    expect(state.players[0].peasants).toBe(400 * UNIT)
  })
})
