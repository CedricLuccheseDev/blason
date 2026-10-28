import { describe, expect, it } from 'vitest'
import { generateWorld } from './map/generate'
import { createBot } from './bots/bot'
import { apart, around, makeGrid } from './grid'
import { createGame } from './land'
import { step } from './step'
import type { GameState, Order } from './types'

/** A game on a drawn land, at its first tick. */
function opening(players = 2): GameState {
  const world = generateWorld('domains')
  const grid = makeGrid(world.map, world.width, world.height, 4)
  return createGame(grid, players, 'domains')
}

const plant = (player: number, tile: number): Order => ({
  player,
  type: 'pickStart',
  tile,
})

/** The opening played to its end, with these orders at its first tick. */
function toTheEnd(state: GameState, orders: Array<Order> = []) {
  step(state, orders)
  while (state.tick < state.rules.openingTicks) step(state)
}

/** A domain bordering this one. */
function neighbour(state: GameState, realm: number): number {
  const other = (n: number) => state.realm[n] >= 0 && state.realm[n] !== realm
  for (let t = 0; t < state.realm.length; t++) {
    if (state.realm[t] !== realm) continue
    const n = around(state.grid, t).find(other)
    if (n !== undefined) return state.realm[n]
  }
  return -1
}

const domainOf = (state: GameState, realm: number) =>
  state.realm.filter((r) => r === realm).length

describe('the opening', () => {
  it('has no empty land: every tile in a free domain', () => {
    const state = opening()
    const { land } = state.grid
    expect(state.realm.every((r, t) => (land[t] ? r >= 0 : r < 0))).toBe(true)
  })

  it('plants a standard and gives no land while the count runs', () => {
    const state = opening()
    const home = state.villages[0]
    step(state, [plant(0, home)])
    expect(state.players[0].standard).toBe(home)
    expect(state.players.every((p) => p.tiles === 0)).toBe(true)
    expect(state.owner.every((o) => o < 0)).toBe(true)
    expect(state.works).toEqual([])
  })

  it('moves the standard as often as the lord likes', () => {
    const state = opening()
    const [a, b] = state.villages
    step(state, [plant(0, a)])
    step(state, [plant(0, b)])
    expect(state.players[0].standard).toBe(b)
    // A tile anywhere in a domain plants on its village.
    const inside = state.realm.findIndex((r, t) => r === a && t !== a)
    step(state, [plant(0, inside)])
    expect(state.players[0].standard).toBe(a)
  })

  it('never lets two standards share a domain, nor two touching ones: the first to plant holds it', () => {
    const state = opening()
    const home = state.villages[0]
    const next = neighbour(state, home)
    step(state, [plant(0, home), plant(1, home)])
    expect(state.players[1].standard).toBe(-1)
    step(state, [plant(1, next)])
    expect(state.players[1].standard).toBe(-1)
    // Moved away, the first frees the domain for the other.
    const far = state.villages.reduce(
      (f, v) =>
        apart(state.grid, home, v) > apart(state.grid, home, f) ? v : f,
      home,
    )
    step(state, [plant(0, far), plant(1, home)])
    expect(state.players[1].standard).toBe(home)
  })

  it('grants each lord his standard’s domain whole when the count ends; who planted none is given one', () => {
    const state = opening()
    const home = state.villages[0]
    toTheEnd(state, [plant(0, home)])
    expect(state.players[0].tiles).toBe(domainOf(state, home))
    expect(state.owner[home]).toBe(0)
    const given = state.players[1].standard
    expect(given).toBeGreaterThanOrEqual(0)
    expect(given).not.toBe(home)
    expect(state.players[1].tiles).toBe(domainOf(state, given))
    // Each domain's village is its lord's, to feed his peasants and levy his armies.
    expect(state.works).toEqual([
      { work: 'village', tile: home, owner: 0 },
      { work: 'village', tile: given, owner: 1 },
    ])
    expect(state.players[0].peasants).toBeGreaterThan(0)
    // The free land is one: no free village is left.
    expect(state.villages).toEqual([])
  })

  it('gives twenty lords, bots, twenty domains of their own', () => {
    const state = opening(20)
    const bots = state.players.map((_, id) => createBot(id, 'domains'))
    while (state.tick < state.rules.openingTicks)
      step(
        state,
        state.players.flatMap((_, id) => bots[id](state, id)),
      )
    const homes = state.players.map((p) => p.standard)
    expect(new Set(homes).size).toBe(20)
    expect(homes.every((h, id) => state.owner[h] === id)).toBe(true)
    expect(state.players.every((p) => p.tiles > 0)).toBe(true)
  })
})
