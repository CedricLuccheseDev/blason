import { describe, expect, it } from 'vitest'
import { UNIT } from './units'
import { isAllied } from './diplomacy'
import { createGame, holdOf, setOwner } from './land'
import { RULES } from './rules'
import { setupOf } from './testing'
import { step } from './step'
import type { GameState, Grid, Order } from './types'

function field(width: number, height = 1): Grid {
  const land = Array.from({ length: width * height }, () => true)
  return {
    width,
    height,
    size: 4,
    land,
    water: land.map((on) => !on),
    area: land.length,
  }
}

/** A game past its opening, no income, nothing born and no one sick; lord 0 on the left, lord 1 on the right of a row. */
function playing(width = 20): GameState {
  // A row: every piece touches the edge, none is taken for being small.
  const state = createGame(field(width), setupOf(3), {
    ...RULES,
    fillSeconds: Number.MAX_SAFE_INTEGER,
    sickness: 0,
    seaWalled: 0,
  })
  state.tick = state.rules.openingTicks
  for (let t = 0; t < 4; t++) setOwner(state, t, 0)
  state.works.push({ work: 'village', tile: 3, owner: 0 })
  for (let t = width - 4; t < width; t++) setOwner(state, t, 1)
  setOwner(state, 9, 2)
  for (const lord of state.players) {
    lord.peasants = 400 * UNIT
    lord.gold = 1000 * UNIT
  }
  return state
}

const order = (o: Order) => [o]

describe('the alliances', () => {
  it('are offered, then sealed when the other accepts; allies may not strike each other', () => {
    const state = playing()
    step(state, order({ player: 0, type: 'ally', target: 1 }))
    expect(isAllied(state, 0, 1)).toBe(false)
    step(state, order({ player: 1, type: 'ally', target: 0 }))
    expect(isAllied(state, 0, 1)).toBe(true)
    setOwner(state, 4, 1)
    step(state, order({ player: 0, type: 'attack', tile: 4, army: 'host' }))
    expect(state.hosts).toEqual([])
  })

  it('stop the fights between the new allies, their men going home', () => {
    const state = playing()
    for (let t = 4; t < 9; t++) setOwner(state, t, 1)
    state.players[1].peasants = 40 * UNIT
    step(state, order({ player: 0, type: 'attack', tile: 8, army: 'host' }))
    expect(state.hosts).toHaveLength(1)
    step(state, order({ player: 1, type: 'ally', target: 0 }))
    step(state, order({ player: 0, type: 'ally', target: 1 }))
    expect(state.hosts).toEqual([])
  })

  it('broken, mark the breaker a traitor a while, his land holding half as well', () => {
    const state = playing()
    step(state, order({ player: 0, type: 'ally', target: 1 }))
    step(state, order({ player: 1, type: 'ally', target: 0 }))
    const before = holdOf(state, 0)
    step(state, order({ player: 0, type: 'breakAlliance', target: 1 }))
    expect(isAllied(state, 0, 1)).toBe(false)
    expect(holdOf(state, 0)).toBe(before / 2)
    state.tick += state.rules.felonTicks
    expect(holdOf(state, 0)).toBe(before)
  })

  it('run out after their time, making no traitor', () => {
    const state = playing()
    step(state, order({ player: 0, type: 'ally', target: 1 }))
    step(state, order({ player: 1, type: 'ally', target: 0 }))
    state.tick += state.rules.allianceTicks
    step(state)
    expect(isAllied(state, 0, 1)).toBe(false)
    expect(state.players[0].felonUntil).toBe(0)
  })
})
