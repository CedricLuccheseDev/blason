import { describe, expect, it } from 'vitest'
import { TICKS_PER_SECOND, UNIT } from './units'
import { createGame, setOwner } from './land'
import { offeringOf } from './diplomacy'
import { RULES } from './rules'
import { step } from './step'
import { createBot } from './bots/bot'
import { talk } from './bots/talk'
import { endow, field, hold, playing, run, setupOf } from './testing'
import type { GameState, Order } from './types'

const MINUTE = 60 * TICKS_PER_SECOND
const gift = (player: number, target: number): Order => ({
  player,
  type: 'offering',
  target,
})

describe('the offering', () => {
  it('gives a quarter of the gold, remembered two minutes', () => {
    const state = playing(field(10), 2)
    hold(state, 0, [0, 1, 2])
    hold(state, 1, [7, 8, 9])
    endow(state, 0, 10, 200)
    endow(state, 1, 10, 0)
    expect(offeringOf(state, 0)).toBe(50 * UNIT)
    run(state, 1, [gift(0, 1)])
    expect(state.players[0].gold).toBe(150 * UNIT)
    expect(state.players[1].gold).toBe(50 * UNIT)
    expect(state.offerings).toEqual([
      { from: 0, to: 1, gold: 50 * UNIT, tick: state.tick - 1 },
    ])
    run(state, 2 * MINUTE)
    expect(state.offerings).toEqual([])
  })

  it('gives nothing to oneself, nor to a lord fallen', () => {
    const state = playing(field(10), 3)
    hold(state, 0, [0, 1, 2])
    hold(state, 1, [7, 8, 9])
    endow(state, 0, 10, 200)
    state.players[2].alive = false
    run(state, 1, [gift(0, 0), gift(0, 2)])
    expect(state.players[0].gold).toBe(200 * UNIT)
    expect(state.offerings).toEqual([])
  })
})

describe('the bots and an offering', () => {
  /** Lord 2, a bot, on the left of a row; lord 0 in the middle, held thin; lord 1 on the right. */
  function three(): GameState {
    const state = createGame(field(60), setupOf(3), {
      ...RULES,
      fillSeconds: Number.MAX_SAFE_INTEGER,
    })
    state.tick = state.rules.openingTicks
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

  it('leave in peace a lord who gave them one, while they remember it', () => {
    const state = three()
    state.players[0].gold = 400 * UNIT
    step(state, [gift(0, 2)])
    state.players[2].gold = 0
    const bot = createBot(2, 'test')
    let orders: Array<Order> = []
    for (let t = 0; t < MINUTE && orders.length === 0; t++) {
      orders = bot(state, 2)
      state.tick += 1
    }
    expect(orders).toEqual([])
  })

  it('take the giver for an ally though they hold two already', () => {
    const state = createGame(field(10), setupOf(5))
    state.tick = state.rules.openingTicks
    hold(state, 0, [0, 1])
    for (const [lord, tile] of [
      [1, 4],
      [2, 6],
      [3, 8],
      [4, 9],
    ])
      hold(state, lord, [tile])
    const ally = (a: number, b: number) =>
      state.alliances.push({
        a,
        b,
        expires: 10 * MINUTE,
        renewA: false,
        renewB: false,
      })
    ally(1, 2)
    ally(1, 3)
    state.requests.push({ from: 0, to: 1, expires: state.tick + 100 })
    const accept: Order = { player: 1, type: 'ally', target: 0 }
    expect(talk(state, 1, new Map(), 0)).not.toContainEqual(accept)
    state.offerings.push({ from: 0, to: 1, gold: UNIT, tick: state.tick })
    expect(talk(state, 1, new Map(), 0)).toContainEqual(accept)
  })
})
