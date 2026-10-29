import { describe, expect, it } from 'vitest'
import { ARMIES, RULES, UNIT, botsSetup, createGame, step } from '../../engine'
import { summarize } from './summary'
import type { GameState, Grid } from '../../engine'

// What the bar reads of the armies: the four in their order, the three levied
// from the peasants at a village, the mercenaries hired for gold at a market.

const hand = { army: 'host', work: null, coup: null } as const

/** Lord 0 on the left of a row, a village on his first tile and a market on his fifth; lord 1 beside him. A village feeds 100 and the land none: a full company is 25 men. */
function realm(gold: number): GameState {
  const land = Array.from({ length: 20 }, () => true)
  const grid: Grid = { width: 20, height: 1, size: 4, land, area: 20 }
  const state = createGame(grid, botsSetup({ seed: 'summary', lords: 2 }), {
    ...RULES,
    fillSeconds: Number.MAX_SAFE_INTEGER,
    sickness: 0,
    seaWalled: 0,
    peasants: { land: 0, tiles: 600, village: 100 },
  })
  state.tick = state.rules.openingTicks
  state.owner = state.owner.map((_, t) => (t < 10 ? 0 : 1))
  state.players[0].tiles = 10
  state.players[1].tiles = 10
  state.works.push({ work: 'village', tile: 0, owner: 0 })
  state.works.push({ work: 'market', tile: 4, owner: 0 })
  state.players[0].peasants = 80 * UNIT
  state.players[0].gold = gold * UNIT
  return state
}

describe('the armies the bar shows', () => {
  it('are the four, the levies a share of the peasants, the mercenaries as many as the gold pays', () => {
    const { armies } = summarize(realm(30), 0, hand)
    expect(armies.map((a) => a.army)).toEqual(ARMIES)
    expect(armies).toEqual([
      { army: 'raid', at: 'village', share: 10, men: 8, gold: null, free: 1 },
      { army: 'host', at: 'village', share: 25, men: 20, gold: null, free: 1 },
      { army: 'ban', at: 'village', share: 50, men: 40, gold: null, free: 1 },
      // 30 gold pays 15 of the 25 men of a full company, 2 gold a man.
      {
        army: 'mercenaries',
        at: 'market',
        share: null,
        men: 15,
        gold: 30,
        free: 1,
      },
    ])
  })

  it('count a market busy once its company is out, the villages still free', () => {
    const state = realm(1000)
    step(state, [{ player: 0, type: 'attack', tile: 12, army: 'mercenaries' }])
    const free = summarize(state, 0, hand).armies.map((a) => a.free)
    expect(free).toEqual([1, 1, 1, 0])
  })
})

describe('the summary', () => {
  it('says the gold an offering would give: a quarter of mine, whole', () => {
    const land = Array.from({ length: 10 }, () => true)
    const grid = { width: 10, height: 1, size: 4, land, area: land.length }
    const state = createGame(grid, botsSetup({ seed: 'test', lords: 2 }))
    state.players[0].gold = 86 * UNIT + 900
    expect(summarize(state, 0, hand).offering).toBe(21)
    state.players[0].gold = 3 * UNIT
    expect(summarize(state, 0, hand).offering).toBe(0)
    expect(summarize(state, -1, hand).offering).toBe(0)
  })
})
