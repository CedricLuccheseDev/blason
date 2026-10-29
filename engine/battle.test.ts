import { describe, expect, it } from 'vitest'
import { overLand } from './grid'
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

  it('let armies of other wars pass each other by', () => {
    // Lords 0 and 1 side by side, each striking lord 2, their armies near.
    const state = playing(field(30, 3), 3)
    const row = (r: number, from: number, to: number) =>
      Array.from({ length: to - from }, (_, c) => r * 30 + from + c)
    hold(state, 0, row(0, 0, 15))
    hold(state, 1, row(2, 0, 15))
    hold(state, 2, [...row(1, 0, 30), ...row(0, 15, 30), ...row(2, 15, 30)])
    muster(state, 0, 14)
    muster(state, 1, 74)
    endow(state, 0, 800)
    endow(state, 1, 800)
    endow(state, 2, 400)
    run(state, 1, [attack(0, 59, 'host'), attack(1, 59, 'host')])
    run(state, 3)
    expect(state.hosts).toHaveLength(2)
    expect(state.hosts.some((h) => h.fighting)).toBe(false)
  })

  it('never join two armies across the sea', () => {
    // A gulf cuts a 9 by 9 land from its top to its middle: the two shores face each other.
    const grid = field(9, 9)
    for (let y = 0; y < 5; y++) grid.land[y * 9 + 4] = false
    expect(overLand(grid, 2 * 9 + 2, 2 * 9 + 6)).toBe(false)
    expect(overLand(grid, 7 * 9 + 2, 7 * 9 + 6)).toBe(true)
    // Round the gulf's end, the line keeps to the land.
    expect(overLand(grid, 6 * 9 + 1, 5 * 9 + 7)).toBe(true)
  })

  it('nor across the corner of a bay that the line between them cuts', () => {
    // A cove of one tile, on the second column of the top row: the line from the far corner to the first tile cuts through its lower corner.
    const grid = field(5, 3)
    grid.land[1] = false
    expect(overLand(grid, 2 * 5 + 4, 0)).toBe(false)
    expect(overLand(grid, 0, 2 * 5 + 4)).toBe(false)
    grid.land[1] = true
    expect(overLand(grid, 2 * 5 + 4, 0)).toBe(true)
  })
})
