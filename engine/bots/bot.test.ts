import { describe, expect, it } from 'vitest'
import { TICKS_PER_SECOND, UNIT } from '../units'
import { createGame, setOwner } from '../land'
import { RULES } from '../rules'
import { createBot } from './bot'
import type { GameState, Grid, Order } from '../types'

/** A row of so many tiles, all of it land. */
function field(width: number): Grid {
  const land = Array.from({ length: width }, () => true)
  return { width, height: 1, size: 4, land, area: land.length }
}

/** A game past its opening, no village, nothing born, no gold. */
function playing(grid: Grid): GameState {
  const state = createGame(grid, 2, 'test', {
    ...RULES,
    fillSeconds: Number.MAX_SAFE_INTEGER,
  })
  state.tick = state.rules.openingTicks
  state.villages = []
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
    state.works.push({ work: 'barracks', tile: 0, owner: 1 })
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
