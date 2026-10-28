import { describe, expect, it } from 'vitest'
import { isAllied } from './diplomacy'
import { step } from './step'
import { field, hold, playing } from './testing'
import type { Order } from './types'

describe('the orders', () => {
  it('a word that is no order does nothing, whatever it carries', () => {
    const state = playing(field(10))
    hold(state, 0, [0, 1])
    hold(state, 1, [8, 9])
    state.alliances.push({
      a: 0,
      b: 1,
      expires: 1e9,
      renewA: false,
      renewB: false,
    })
    const word = {
      player: 0,
      type: 'zzz',
      tile: 0,
      target: 1,
    } as unknown as Order
    step(state, [word])
    expect(isAllied(state, 0, 1)).toBe(true)
    expect(state.players[0].felonUntil).toBe(0)
  })
})
