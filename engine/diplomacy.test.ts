import { describe, expect, it } from 'vitest'
import { UNIT } from './units'
import { moveCaravans, sendCaravans } from './caravans'
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

  it('go by lot to any market a road reaches, the far ones more often', () => {
    // Lord 0's market at the left, lord 2's in the middle, lord 1's at the right.
    const state = trade()
    state.works.push({ work: 'market', tile: 9, owner: 2 })
    const ends = { 9: 0, 19: 0 }
    for (let tick = 0; tick < 200 * state.rules.caravanTicks; tick++) {
      state.tick = tick
      state.caravans = []
      sendCaravans(state)
      for (const c of state.caravans)
        if (c.road[0] === 0) ends[c.road.at(-1) as 9 | 19]++
    }
    expect(ends[9]).toBeGreaterThan(20)
    expect(ends[19]).toBeGreaterThan(ends[9])
  })

  it('trade only within range, from market to market along the network', () => {
    // Lord 0's market at the left, lord 1's 50 tiles away: out of range.
    const state = playing(60)
    setOwner(state, 9, -1)
    state.works.push({ work: 'market', tile: 0, owner: 0 })
    state.works.push({ work: 'market', tile: 50, owner: 1 })
    state.tick = 0
    sendCaravans(state)
    expect(state.caravans).toEqual([])
    // A market of his own halfway joins them: the caravan goes through it.
    state.works.push({ work: 'market', tile: 25, owner: 0 })
    sendCaravans(state)
    expect(state.caravans).toHaveLength(1)
    expect(state.caravans[0].road).toContain(25)
    expect(state.caravans[0].road.at(-1)).toBe(50)
  })

  it('are taken by the enemy who takes a tile of the road ahead, and pay his nearest market alone', () => {
    const state = trade()
    // The market a tile in, so that a tile and its place on the road differ.
    state.works[1].tile = 1
    // Its own moment to send: each market sends at its own.
    state.tick = state.rules.caravanTicks - 7
    sendCaravans(state)
    expect(state.caravans).toHaveLength(1)
    // Lord 2 takes a tile of the road ahead, his market beside it.
    for (const t of [12, 13]) setOwner(state, t, 2)
    state.works.push({ work: 'market', tile: 13, owner: 2 })
    for (let t = 0; t < 200 && state.caravans.length; t++) moveCaravans(state)
    expect(state.players[2].gold).toBe(19 * state.rules.caravanGold)
    expect(state.players[0].gold).toBe(0)
    expect(state.players[1].gold).toBe(0)
  })

  it('are pillaged when an enemy with no market takes a tile of the road ahead', () => {
    const state = trade()
    state.tick = 0
    sendCaravans(state)
    expect(state.caravans).toHaveLength(1)
    setOwner(state, 12, 2)
    moveCaravans(state)
    expect(state.caravans).toEqual([])
    expect(state.players[0].gold).toBe(0)
  })

  it('go between a lord’s own markets too, paying him once, half as much', () => {
    // Lord 0 holds the row's left half, a market at each end of it.
    const state = trade()
    state.works[2] = { work: 'market', tile: 8, owner: 0 }
    travel(state)
    // Each of the two sends one to the other.
    expect(state.players[0].gold).toBe(
      (2 * 9 * state.rules.caravanGold * state.rules.homeTrade) / 100,
    )
  })

  it('never go to the market of a lord at war with theirs', () => {
    // Lord 0's land reaching lord 1's, an army of his sent at him.
    const state = trade()
    for (let t = 4; t < 16; t++) setOwner(state, t, 0)
    step(state, order({ player: 0, type: 'attack', tile: 17, army: 'host' }))
    expect(state.hosts.length).toBeGreaterThan(0)
    state.tick = 0
    sendCaravans(state)
    expect(state.caravans).toEqual([])
  })
})
