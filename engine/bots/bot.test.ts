import { describe, expect, it } from 'vitest'
import { TICKS_PER_SECOND, UNIT } from '../units'
import { createGame, setOwner } from '../land'
import { RULES } from '../rules'
import { setupOf } from '../testing'
import { step } from '../step'
import { createBot } from './bot'
import type { GameState, Grid, Order } from '../types'

/** A row of so many tiles, all of it land. */
function field(width: number): Grid {
  const land = Array.from({ length: width }, () => true)
  return { width, height: 1, size: 4, land, area: land.length }
}

/** A game past its opening, no village, nothing born, no gold. */
function playing(grid: Grid): GameState {
  const state = createGame(grid, setupOf(2), {
    ...RULES,
    fillSeconds: Number.MAX_SAFE_INTEGER,
  })
  state.tick = state.rules.openingTicks
  return state
}

describe('the bots at war', () => {
  it('finish off a lord reduced to a corner, however thick he holds it', () => {
    // Lord 1, a bot, holds most of a row; lord 0 is left with three tiles.
    const state = playing(field(30))
    for (let t = 0; t < 27; t++) setOwner(state, t, 1)
    for (const t of [27, 28, 29]) setOwner(state, t, 0)
    state.players[1].peasants = 2000 * UNIT
    state.players[0].peasants = 50 * UNIT
    for (const lord of state.players) lord.gold = 0
    state.works.push({ work: 'village', tile: 0, owner: 1 })
    const bot = createBot(1, 'test')
    let orders: Array<Order> = []
    for (let t = 0; t < 60 * TICKS_PER_SECOND && orders.length === 0; t++) {
      orders = bot(state, 1)
      state.tick += 1
    }
    expect(orders).toEqual([
      { player: 1, type: 'attack', tile: 27, army: 'host' },
    ])
  })
})

describe('the bots on a lord already struck', () => {
  /** Lord 2, a bot, on the left of a row; lord 0 in the middle, held thin; lord 1 on the right. */
  function three(): GameState {
    const state = createGame(field(60), setupOf(3), {
      ...RULES,
      fillSeconds: Number.MAX_SAFE_INTEGER,
    })
    state.tick = state.rules.openingTicks
    // A third of the row each: 2, then 0, then 1.
    const lords = [2, 0, 1]
    for (let t = 0; t < 60; t++) setOwner(state, t, lords[Math.floor(t / 20)])
    for (const [lord, tile] of [
      [2, 0],
      [0, 30],
      [1, 59],
    ])
      state.works.push({ work: 'village', tile, owner: lord })
    state.players[2].peasants = 100 * UNIT
    state.players[1].peasants = 100 * UNIT
    state.players[0].peasants = 30 * UNIT
    for (const lord of state.players) lord.gold = 0
    return state
  }

  /** The bot's first orders within a minute, the state left as it is. */
  function firstOrders(state: GameState): Array<Order> {
    const bot = createBot(2, 'test')
    let orders: Array<Order> = []
    for (let t = 0; t < 60 * TICKS_PER_SECOND && orders.length === 0; t++) {
      orders = bot(state, 2)
      state.tick += 1
    }
    return orders
  }

  it('strike the thin lord beside them', () => {
    const orders = firstOrders(three())
    expect(orders).toHaveLength(1)
    expect(orders[0]).toMatchObject({ player: 2, type: 'attack' })
  })

  it('leave him alone while another lord already strikes him', () => {
    const state = three()
    step(state, [{ player: 1, type: 'attack', tile: 39, army: 'host' }])
    expect(state.hosts.some((h) => h.owner === 1 && h.target === 0)).toBe(true)
    expect(firstOrders(state)).toEqual([])
  })
})
