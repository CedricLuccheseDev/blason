import { describe, expect, it } from 'vitest'
import { ARMIES, UNIT, createGame } from '../../engine'
import { summarize } from './summary'

describe('the summary', () => {
  it('says the gold an offering would give: a quarter of mine, whole', () => {
    const land = Array.from({ length: 10 }, () => true)
    const grid = { width: 10, height: 1, size: 4, land, area: land.length }
    const state = createGame(grid, 2, 'test')
    const hand = { army: ARMIES[0], work: null, coup: null }
    state.players[0].gold = 86 * UNIT + 900
    expect(summarize(state, 0, hand).offering).toBe(21)
    state.players[0].gold = 3 * UNIT
    expect(summarize(state, 0, hand).offering).toBe(0)
    expect(summarize(state, -1, hand).offering).toBe(0)
  })
})
