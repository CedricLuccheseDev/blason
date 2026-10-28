import { describe, expect, it } from 'vitest'
import { attack, endow, field, hold, muster, playing, run } from './testing'
import type { GameState } from './types'

/** Two lords face to face on a row, each with his barracks at the border and as many men. */
function facing(): GameState {
  const state = playing(field(40))
  hold(
    state,
    0,
    Array.from({ length: 20 }, (_, t) => t),
  )
  hold(
    state,
    1,
    Array.from({ length: 20 }, (_, t) => t + 20),
  )
  muster(state, 0, 19)
  muster(state, 1, 20)
  endow(state, 0, 800)
  endow(state, 1, 800)
  return state
}

describe('the battles', () => {
  it('stop two enemy armies where they meet, each losing one for one', () => {
    const state = facing()
    run(state, 1, [attack(0, 25, 'host'), attack(1, 15, 'host')])
    run(state, 5)
    const [a, b] = state.hosts
    expect(a.fighting && b.fighting).toBe(true)
    expect(a.men).toBe(b.men)
    expect(a.men).toBeLessThan(200 * 1000)
    // Neither took a tile while they fought.
    expect(state.owner[20]).toBe(1)
    expect(state.owner[19]).toBe(0)
  })

  it('cost two for one to whoever assails an army defending under its castle', () => {
    const state = facing()
    state.works.push({ work: 'castle', tile: 22, owner: 1 })
    run(state, 1, [attack(0, 25, 'host'), attack(1, 15, 'host')])
    run(state, 5)
    const [mine, his] = state.hosts
    expect(200 * 1000 - mine.men).toBe(2 * (200 * 1000 - his.men))
  })
})
