import { describe, expect, it } from 'vitest'
import { UNIT } from './units'
import { attack, endow, field, hold, muster, playing, run } from './testing'
import type { GameState } from './types'

/** Lord 0 on the left of a row, a village and a market of his; lord 1 beside him; lord 2 far right, so that taking lord 1 wins nothing. */
function hiring(): GameState {
  const state = playing(field(30), 3)
  // A village feeds 100 and the land none: a full company is 25 men.
  state.rules = {
    ...state.rules,
    peasants: { land: 0, tiles: 600, village: 100 },
  }
  hold(
    state,
    0,
    Array.from({ length: 10 }, (_, i) => i),
  )
  hold(
    state,
    1,
    Array.from({ length: 10 }, (_, i) => 10 + i),
  )
  hold(state, 2, [25, 26, 27, 28, 29])
  muster(state, 0, 0)
  state.works.push({ work: 'market', tile: 4, owner: 0 })
  endow(state, 0, 80, 1000)
  endow(state, 1, 10, 0)
  return state
}

describe('the mercenaries', () => {
  it('are hired at a market, a quarter of the cap for 2 gold a man, the peasants left at home', () => {
    const state = hiring()
    run(state, 1, [attack(0, 12, 'mercenaries')])
    const company = state.hosts.find((h) => h.owner === 0)
    expect(company).toMatchObject({ army: 'mercenaries', from: 4 })
    expect(company?.men).toBe(25 * UNIT)
    expect(state.players[0].peasants).toBe(80 * UNIT)
    expect(state.players[0].gold).toBe(950 * UNIT)
  })

  it('go their way when done, none of them home to the peasants', () => {
    const state = hiring()
    run(state, 60 * 10, [attack(0, 12, 'mercenaries')])
    expect(state.hosts.filter((h) => h.owner === 0)).toEqual([])
    expect(state.players[0].peasants).toBe(80 * UNIT)
  })

  it('come one company a market at a time, and none without a market', () => {
    const state = hiring()
    run(state, 1, [attack(0, 12, 'mercenaries'), attack(0, 15, 'mercenaries')])
    expect(state.hosts.filter((h) => h.owner === 0)).toHaveLength(1)
    const bare = hiring()
    bare.works = bare.works.filter((w) => w.work !== 'market')
    run(bare, 1, [attack(0, 12, 'mercenaries')])
    expect(bare.hosts).toEqual([])
    expect(bare.players[0].gold).toBe(1000 * UNIT)
  })

  it('are as many as the gold pays, short of it', () => {
    const state = hiring()
    endow(state, 0, 80, 20)
    run(state, 1, [attack(0, 12, 'mercenaries')])
    expect(state.hosts.find((h) => h.owner === 0)?.men).toBe(10 * UNIT)
    expect(state.players[0].gold).toBe(0)
  })
})
