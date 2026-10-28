import { describe, expect, it } from 'vitest'
import { TICKS_PER_SECOND, UNIT } from './units'
import { generateWorld } from './map/generate'
import { createBot } from './bots/bot'
import { makeGrid } from './grid'
import { createGame } from './land'
import { stateHash, step } from './step'
import { holdOf } from './war'
import { attack, endow, field, hold, owned, playing, run } from './testing'

const SECOND = TICKS_PER_SECOND

describe('an army, tile by tile', () => {
  it('enters by the border nearest the click and spreads from there as a bulge towards it, three tiles a tick at most', () => {
    // A 9 by 9 land; lord 0 holds its middle, lord 1 a corner far away.
    const state = playing(field(9, 9))
    hold(state, 0, [40])
    hold(state, 1, [80])
    endow(state, 0, 400)
    run(state, 1, [attack(0, 44, 'host')])
    // In by the tile towards the click, then on and to the sides of it.
    expect(owned(state, 0)).toEqual([33, 40, 41, 42])
    run(state, 4)
    expect(state.owner[44]).toBe(0)
  })

  it('raises a share of the peasants for free, the gold left for the works', () => {
    const state = playing(field(6))
    hold(state, 0, [0])
    hold(state, 1, [5])
    endow(state, 0, 100, 10)
    run(state, 1, [attack(0, 2, 'host')])
    expect(state.players[0].peasants).toBe(75 * UNIT)
    expect(state.players[0].gold).toBe(10 * UNIT)
  })

  it('raises no more men than the gold pays, when men are given a price', () => {
    const state = playing(field(6))
    state.rules = { ...state.rules, menPrice: UNIT }
    hold(state, 0, [0])
    hold(state, 1, [5])
    endow(state, 0, 100, 10)
    run(state, 1, [attack(0, 2, 'host')])
    expect(state.players[0].peasants).toBe(90 * UNIT)
    expect(state.players[0].gold).toBe(0)
  })

  it('pays each tile with the men holding it: militia on free land, a lord’s peasants spread over his land, three times as many under his castle', () => {
    const state = playing(field(30))
    hold(state, 1, [10, 11, 12, 13])
    endow(state, 1, 40)
    expect(holdOf(state, 0)).toBe(state.rules.militia)
    expect(holdOf(state, 11)).toBe(10 * UNIT)
    state.works.push({ work: 'castle', tile: 12, owner: 1 })
    expect(holdOf(state, 11)).toBe(30 * UNIT)
  })

  it('stops where it cannot pay for the next tile, its last men fallen there with as many of its holders', () => {
    const state = playing(field(8))
    hold(state, 0, [0])
    hold(state, 1, [1, 2, 3, 4, 5, 6, 7])
    endow(state, 0, 40)
    endow(state, 1, 70)
    // Ten men raised against tiles held by ten each: the first falls, then the army is spent.
    run(state, 1, [attack(0, 7, 'host')])
    expect(owned(state, 0)).toEqual([0, 1])
    expect(state.hosts).toEqual([])
  })

  it('meets the army of the lord it strikes, man for man', () => {
    const state = playing(field(40))
    hold(
      state,
      0,
      Array.from({ length: 20 }, (_, i) => i),
    )
    hold(
      state,
      1,
      Array.from({ length: 20 }, (_, i) => i + 20),
    )
    endow(state, 0, 400)
    endow(state, 1, 800)
    run(state, 1, [attack(1, 0, 'host')])
    const left = state.hosts[0].men
    run(state, 1, [attack(0, 30, 'raid')])
    // My raid takes 10 % of what my peasants are now, and meets his host first.
    expect(state.hosts.map((h) => h.owner)).toEqual([1])
    expect(state.hosts[0].men).toBeLessThan(left - 30 * UNIT)
  })

  it('goes home with its survivors when there is nothing left to take', () => {
    const state = playing(field(4))
    hold(state, 0, [0])
    hold(state, 1, [3])
    endow(state, 0, 400)
    run(state, 2, [attack(0, 1, 'host')])
    expect(owned(state, 0)).toEqual([0, 1, 2])
    expect(state.hosts).toEqual([])
    expect(state.players[0].peasants).toBe(400 * UNIT - 2 * state.rules.militia)
  })
})

describe('the game is deterministic', () => {
  it('the same seed, played by the same bots, gives the same game', () => {
    const play = () => {
      const world = generateWorld('same')
      const grid = makeGrid(world.map, world.width, world.height, 4)
      const state = createGame(grid, 8, 'same')
      const bots = state.players.map((_, id) => createBot(id, 'same'))
      for (let t = 0; t < 25 * SECOND; t++)
        step(
          state,
          state.players.flatMap((p, id) =>
            p.alive ? bots[id](state, id) : [],
          ),
        )
      return stateHash(state)
    }
    expect(play()).toBe(play())
  }, 30_000)
})

describe('the land shared out', () => {
  it('has no empty land: every tile in a free domain, each lord starting on a whole one with its village and a barracks, never two on the same', () => {
    const world = generateWorld('domains')
    const grid = makeGrid(world.map, world.width, world.height, 4)
    const state = createGame(grid, 2, 'domains')
    expect(state.realm.every((r, t) => (grid.land[t] ? r >= 0 : r < 0))).toBe(
      true,
    )
    const home = state.villages[0]
    step(state, [
      { player: 0, type: 'pickStart', tile: home },
      { player: 1, type: 'pickStart', tile: home },
    ])
    const domain = state.realm.filter((r) => r === home).length
    expect(state.players[0].tiles).toBe(domain)
    expect(state.players[1].tiles).toBe(0)
    // The domain's village becomes his, and a barracks stands beside it.
    expect(state.works.map((w) => w.work)).toEqual(['village', 'barracks'])
    expect(state.works[0]).toEqual({ work: 'village', tile: home, owner: 0 })
    expect(state.works[1].owner).toBe(0)
  })
})
