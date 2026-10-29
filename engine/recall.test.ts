import { describe, expect, it } from 'vitest'
import { UNIT } from './units'
import { attack, endow, field, hold, muster, playing, run } from './testing'

// An army called home (« mes armées en cours, avec une croix pour les
// rappeler »): its survivors back to the peasants, the village free again.

describe('an army recalled', () => {
  it('goes home, its men back to its lord’s peasants, its village free', () => {
    const state = playing(field(30))
    // No one wins on so small a land: the game goes on.
    state.rules = { ...state.rules, victoryShare: 1001, victoryFloor: 1001 }
    hold(state, 0, [0, 1, 2])
    muster(state, 0, 0)
    hold(state, 1, [3, 4, 5, 6, 7, 8])
    endow(state, 0, 400)
    endow(state, 1, 40)
    run(state, 1, [attack(0, 8, 'host')])
    expect(state.hosts).toHaveLength(1)
    const before = state.players[0].peasants + state.hosts[0].men
    run(state, 1, [{ player: 0, type: 'recall', tile: 0 }])
    expect(state.hosts).toEqual([])
    expect(state.players[0].peasants).toBe(before)
    expect(state.players[0].peasants).toBeGreaterThan(300 * UNIT)
  })

  it('calls home only the lord’s own army', () => {
    const state = playing(field(30))
    // No one wins on so small a land: the game goes on.
    state.rules = { ...state.rules, victoryShare: 1001, victoryFloor: 1001 }
    hold(state, 0, [0, 1, 2])
    muster(state, 0, 0)
    hold(state, 1, [3, 4, 5, 6, 7, 8])
    endow(state, 0, 400)
    run(state, 1, [attack(0, 8, 'host')])
    run(state, 1, [{ player: 1, type: 'recall', tile: 0 }])
    expect(state.hosts).toHaveLength(1)
  })
})
