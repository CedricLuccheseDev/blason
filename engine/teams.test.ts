import { describe, expect, it } from 'vitest'
import { createGame, setOwner } from './land'
import { RULES } from './rules'
import { step } from './step'
import { entryFor } from './war'
import { isAllied } from './diplomacy'
import { field } from './testing'
import { NO_ONE } from './types'
import type { GameState } from './types'

/** Four lords on a row of 40, ten tiles each: 0 and 1 a team, 2 and 3 another. */
function teamed(): GameState {
  const state = createGame(field(40), 4, 'test', RULES, [0, 0, 1, 1])
  state.tick = state.rules.openingTicks
  for (let t = 0; t < 40; t++) setOwner(state, t, Math.floor(t / 10))
  return state
}

describe('the teams', () => {
  it('make teammates allies for good, whom no order binds nor breaks', () => {
    const state = teamed()
    expect(isAllied(state, 0, 1)).toBe(true)
    expect(isAllied(state, 1, 2)).toBe(false)
    expect(entryFor(state, 0, 15)).toBe(-1)
    step(state, [
      { player: 0, type: 'ally', target: 1 },
      { player: 1, type: 'breakAlliance', target: 0 },
    ])
    expect(state.requests).toEqual([])
    expect(state.players[1].felonUntil).toBe(0)
    expect(isAllied(state, 0, 1)).toBe(true)
  })

  it('win together, their lands summed', () => {
    const state = teamed()
    // Team 0 holds 34 tiles of 40 between its two lords, over the 80 % that
    // wins at the start, neither of them alone near it.
    for (let t = 20; t < 34; t++) setOwner(state, t, 1)
    step(state)
    expect(state.winner).not.toBe(NO_ONE)
    expect([0, 1]).toContain(state.winner)
  })

  it('leave a lord without a team to play for himself', () => {
    const state = createGame(field(40), 4, 'test')
    expect(state.teams).toEqual([-1, -1, -1, -1])
    expect(isAllied(state, 0, 1)).toBe(false)
  })
})
