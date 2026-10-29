import { describe, expect, it } from 'vitest'
import { generateWorld } from './map/generate'
import { createBot } from './bots/bot'
import { apart, around, makeGrid } from './grid'
import { capOf, createGame } from './land'
import { barredBy } from './opening'
import { RULES } from './rules'
import { stateHash, step } from './step'
import { field, owned } from './testing'
import { NEUTRAL, SEA } from './types'
import type { GameState, Order } from './types'

/** A drawn land, the same for every test. */
const world = generateWorld('standards')
const grid = makeGrid(world.map, world.width, world.height, RULES.tileSize)

/** A game on the drawn land, at its first tick. */
const drawn = (players = 2) => createGame(grid, players, 'standards')

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

/** The tiles of the land in the game. */
const landOf = (state: GameState) =>
  state.grid.land.flatMap((on, t) => (on ? [t] : []))

const REACH = RULES.startRadius * RULES.startRadius
const GAP = RULES.standardGap * RULES.standardGap

/** The tiles within a start's reach of a tile, as the crow flies. */
const reached = (state: GameState, heart: number) =>
  landOf(state).filter((t) => apart(state.grid, heart, t) <= REACH)

/** The opening of twenty bots, played to its end. */
function botsOpening(): GameState {
  const state = drawn(20)
  const bots = state.players.map((_, id) => createBot(id, 'standards'))
  while (state.tick < state.rules.openingTicks)
    step(
      state,
      state.players.flatMap((_, id) => bots[id](state, id)),
    )
  return state
}

describe('the opening', () => {
  it('plays on one land: an islet the sea cuts off is no part of the game', () => {
    // A strait cuts the last three columns of a field off.
    const islet = field(12, 3)
    for (let y = 0; y < 3; y++) islet.land[y * 12 + 8] = false
    const state = createGame(islet, 1, 'islet')
    expect(state.grid.area).toBe(24)
    expect(state.owner[10]).toBe(SEA)
    step(state, [plant(0, 10)])
    expect(state.players[0].standard).toBe(-1)
  })

  it('plants a standard on any tile of the land, and gives no land while the count runs', () => {
    const state = drawn()
    // A tile of the coast, as good as any other.
    const coast = landOf(state).find((t) =>
      around(state.grid, t).some((n) => !state.grid.land[n]),
    )
    expect(coast).toBeDefined()
    step(state, [plant(0, coast ?? -1)])
    expect(state.players[0].standard).toBe(coast)
    expect(state.players.every((p) => p.tiles === 0)).toBe(true)
    expect(state.owner.every((o) => o < 0)).toBe(true)
    expect(state.works).toEqual([])
  })

  it('moves the standard as often as the lord likes, never onto the sea', () => {
    const state = drawn()
    const land = landOf(state)
    const [a, b] = [land[0], land[land.length - 1]]
    step(state, [plant(0, a)])
    step(state, [plant(0, b)])
    expect(state.players[0].standard).toBe(b)
    step(state, [plant(0, state.grid.land.indexOf(false))])
    expect(state.players[0].standard).toBe(b)
  })

  it('keeps each standard twenty tiles from the others: the first to plant holds the ground round his', () => {
    const state = createGame(field(80, 40), 2, 'gap')
    const at = (x: number, y: number) => y * 80 + x
    step(state, [plant(0, at(20, 20)), plant(1, at(20, 20))])
    expect(state.players[1].standard).toBe(-1)
    step(state, [plant(1, at(39, 20))])
    expect(state.players[1].standard).toBe(-1)
    // What bars him, for the screen to show.
    expect(barredBy(state, 1, at(39, 20))).toEqual([0])
    expect(barredBy(state, 1, at(40, 20))).toEqual([])
    step(state, [plant(1, at(40, 20))])
    expect(state.players[1].standard).toBe(at(40, 20))
    // His own standard bars him nothing: moved a step.
    step(state, [plant(1, at(41, 20))])
    expect(state.players[1].standard).toBe(at(41, 20))
    // Moved away, the first frees the ground for the other.
    step(state, [plant(0, at(70, 20)), plant(1, at(25, 20))])
    expect(state.players[1].standard).toBe(at(25, 20))
  })

  it('grants a lord the land within fourteen tiles of his standard when the count ends, his first village on it, his peasants full', () => {
    const state = createGame(field(60, 60), 1, 'reach')
    const heart = 30 * 60 + 30
    toTheEnd(state, [plant(0, heart)])
    expect(owned(state, 0)).toEqual(reached(state, heart))
    expect(state.players[0].tiles).toBeGreaterThan(600)
    expect(state.works).toEqual([{ work: 'village', tile: heart, owner: 0 }])
    expect(state.players[0].peasants).toBe(capOf(state, 0))
    expect(state.players[0].peasants).toBeGreaterThan(0)
  })

  it('walks over the land alone: what lies across a bay is not his, what lies behind a pond is', () => {
    const bay = field(60, 60)
    // A bay comes down from the top, five tiles east of the standard, and
    // ends past his reach; a pond lies six tiles west of it.
    for (let y = 0; y < 50; y++) bay.land[y * 60 + 35] = false
    for (let y = 29; y <= 31; y++)
      for (let x = 23; x <= 25; x++) bay.land[y * 60 + x] = false
    const state = createGame(bay, 1, 'bay')
    toTheEnd(state, [plant(0, 30 * 60 + 30)])
    expect(owned(state, 0).every((t) => t % 60 < 35)).toBe(true)
    expect(state.owner[30 * 60 + 40]).toBe(NEUTRAL)
    expect(state.owner[30 * 60 + 21]).toBe(0)
  })

  it('shares out two starts that meet: each tile to the nearer standard, a tie to the lower seat', () => {
    const state = createGame(field(80, 40), 2, 'meet')
    const at = (x: number, y: number) => y * 80 + x
    // Twenty tiles apart, as near as the gap allows: their starts overlap.
    const [west, east] = [at(25, 20), at(45, 20)]
    toTheEnd(state, [plant(1, west), plant(0, east)])
    const nearer = (t: number) => {
      const [w, e] = [apart(state.grid, west, t), apart(state.grid, east, t)]
      if (Math.min(w, e) > REACH) return NEUTRAL
      return e <= w ? 0 : 1
    }
    const wrong = landOf(state).filter((t) => state.owner[t] !== nearer(t))
    expect(wrong).toEqual([])
    // The middle, as near to both, is the lower seat's: the east's lord.
    expect(state.owner[at(35, 20)]).toBe(0)
  })

  it('gives who planted none the spot with the most room, far from the standards: a whole start', () => {
    const state = drawn()
    const land = landOf(state)
    const mine = land[Math.floor(land.length / 2)]
    toTheEnd(state, [plant(0, mine)])
    const given = state.players[1].standard
    expect(given).toBeGreaterThanOrEqual(0)
    expect(apart(state.grid, given, mine)).toBeGreaterThanOrEqual(GAP)
    expect(state.players[1].tiles).toBe(reached(state, given).length)
    expect(state.players[1].tiles).toBeGreaterThan(600)
    expect(state.works).toContainEqual({
      work: 'village',
      tile: given,
      owner: 1,
    })
  })

  it('gives twenty lords, bots, twenty starts of their own, never within twenty tiles of another', () => {
    const state = botsOpening()
    const homes = state.players.map((p) => p.standard)
    expect(new Set(homes).size).toBe(20)
    expect(homes.every((h, id) => state.owner[h] === id)).toBe(true)
    for (const a of homes)
      for (const b of homes)
        if (a !== b) expect(apart(state.grid, a, b)).toBeGreaterThanOrEqual(GAP)
    // The bots look for room: each start some six hundred tiles or so.
    expect(state.players.every((p) => p.tiles > 400)).toBe(true)
  })

  it('is the same on every machine: the same seed and orders, the same starts', () => {
    expect(stateHash(botsOpening())).toBe(stateHash(botsOpening()))
  })
})
