import { describe, expect, it } from 'vitest'
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

/** A row: lord 0 on the left, his village at its end; free land in the middle; lord 1 on the right. */
function row(): GameState {
  const state = playing(field(30), 2)
  hold(state, 0, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  hold(state, 1, [20, 21, 22, 23, 24, 25, 26, 27, 28, 29])
  muster(state, 0, 0)
  endow(state, 0, 400)
  endow(state, 1, 10)
  return state
}

describe('an army sent at a lord its land does not touch', () => {
  it('enters by the free land between', () => {
    expect(entryFor(row(), 0, 25)).toBe(10)
  })

  it('takes the free land on its way, then strikes the lord', () => {
    const state = row()
    run(state, 1, [attack(0, 25, 'host')])
    expect(state.hosts[0]?.through).toBe(true)
    run(state, 10 * 40)
    expect(owned(state, 0)).toContain(15)
    expect(owned(state, 0)).toContain(20)
  })
})
