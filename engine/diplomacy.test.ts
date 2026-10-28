import { describe, expect, it } from 'vitest'
import { UNIT } from './units'
import { moveCaravans, sendCaravans } from './caravans'
import { isAllied } from './diplomacy'
import { createGame, setOwner } from './land'
import { RULES } from './rules'
import { step } from './step'
import { holdOf } from './war'
import type { GameState, Grid, Order } from './types'

function field(width: number, height = 1): Grid {
  const land = Array.from({ length: width * height }, () => true)
  return { width, height, size: 4, land, area: land.length }
}

/** A game past its opening, no income, nothing born; lord 0 on the left, lord 1 on the right of a row. */
function playing(width = 20): GameState {
  const state = createGame(field(width), 3, 'test', {
    ...RULES,
    marketGold: 0,
    fillSeconds: Number.MAX_SAFE_INTEGER,
  })
  state.tick = state.rules.openingTicks
  state.villages = []
  for (let t = 0; t < 4; t++) setOwner(state, t, 0)
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

describe('the merchants', () => {
  /** A market at each end of the row, the free land between. */
  function trade() {
    const state = playing()
    setOwner(state, 9, -1)
    state.works.push({ work: 'market', tile: 0, owner: 0 })
    state.works.push({ work: 'market', tile: 19, owner: 1 })
    for (const lord of state.players) lord.gold = 0
    return state
  }

  function travel(state: GameState) {
    state.tick = 0
    sendCaravans(state)
    for (let t = 0; t < 200 && state.caravans.length; t++) moveCaravans(state)
  }

  it('go to another lord’s market through the free land and pay both markets by the length of their road', () => {
    const state = trade()
    travel(state)
    const paid = 20 * state.rules.caravanGold
    expect(state.players[0].gold).toBe(paid)
    expect(state.players[1].gold).toBe(paid)
  })

  it('bring twice as much between allies', () => {
    const state = trade()
    state.alliances.push({
      a: 0,
      b: 1,
      expires: 1e9,
      renewA: false,
      renewB: false,
    })
    travel(state)
    expect(state.players[0].gold).toBe(40 * state.rules.caravanGold)
  })

  it('never take a road across a third lord’s land to a market beyond it', () => {
    const state = playing(12)
    for (let t = 6; t < 11; t++) setOwner(state, t, 2)
    state.works.push({ work: 'market', tile: 0, owner: 0 })
    state.works.push({ work: 'market', tile: 11, owner: 1 })
    state.tick = 0
    sendCaravans(state)
    expect(state.caravans).toEqual([])
  })

  it('are pillaged when an enemy takes a tile of the road ahead', () => {
    const state = trade()
    state.tick = 0
    sendCaravans(state)
    expect(state.caravans).toHaveLength(1)
    setOwner(state, 12, 2)
    moveCaravans(state)
    expect(state.caravans).toEqual([])
    expect(state.players[0].gold).toBe(0)
  })
})
