import { describe, expect, it } from 'vitest'
import { TICKS_PER_SECOND, UNIT } from './units'
import { generateWorld } from './map/generate'
import { createBot } from './bots/bot'
import { makeGrid } from './grid'
import { capOf, createGame, holdOf } from './land'
import { RULES } from './rules'
import { stateHash, step } from './step'
import {
  attack,
  endow,
  field,
  hold,
  muster,
  owned,
  playing,
  run,
} from './testing'

const SECOND = TICKS_PER_SECOND

describe('an army, tile by tile', () => {
  it('enters by the border nearest the click and spreads from there towards it, a few tiles a tick', () => {
    // A 9 by 9 land; lord 0 holds its middle and his barracks there, lord 1 a corner far away.
    const state = playing(field(9, 9))
    // Free land that costs nothing, to watch the army's course alone.
    state.rules = {
      ...state.rules,
      paceTiles: 1,
      neutralHold: 0,
      neutralFloor: 0,
    }
    hold(state, 0, [40])
    muster(state, 0, 40)
    hold(state, 1, [80])
    endow(state, 0, 400)
    run(state, 1, [attack(0, 44, 'host')])
    // In by the tile towards the click.
    expect(owned(state, 0)).toEqual([40, 41])
    run(state, 20)
    expect(state.owner[44]).toBe(0)
  })

  it('raises a share of the peasants for free, the gold left for the works', () => {
    const state = playing(field(6))
    // Free land that brings no gold, to count the army's alone.
    state.rules = { ...state.rules, neutralGold: 0 }
    hold(state, 0, [0])
    muster(state, 0, 0)
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
    muster(state, 0, 0)
    hold(state, 1, [5])
    endow(state, 0, 100, 10)
    run(state, 1, [attack(0, 2, 'host')])
    expect(state.players[0].peasants).toBe(90 * UNIT)
    expect(state.players[0].gold).toBe(0)
  })

  it('finds each tile held by its lord’s peasants spread over his land, a free one by half what holds the mean lord’s', () => {
    const state = playing(field(30))
    hold(state, 1, [10, 11, 12, 13])
    endow(state, 1, 40)
    expect(holdOf(state, 11)).toBe(10 * UNIT)
    expect(holdOf(state, 0)).toBe(5 * UNIT)
  })

  it('pays a soldier for two peasants, one for one under their lord’s castle', () => {
    const state = playing(field(30))
    state.rules = { ...state.rules, paceTiles: 1 }
    hold(state, 0, [0])
    muster(state, 0, 0)
    hold(state, 1, [1, 2, 3, 4])
    endow(state, 0, 400)
    endow(state, 1, 40)
    run(state, 1, [attack(0, 4, 'host')])
    // Ten peasants held the tile: five soldiers fell.
    expect(state.hosts[0].men).toBe(95 * UNIT)
    expect(state.players[1].peasants).toBe(30 * UNIT)
    state.works.push({ work: 'castle', tile: 4, owner: 1 })
    run(state, 1)
    expect(state.hosts[0].men).toBe(85 * UNIT)
  })

  it('pushes on in a band as wide as its men, and swells into no ball', () => {
    // Lord 0 holds the left column of a wide land, lord 1 all the rest.
    const [w, h] = [40, 31]
    const state = playing(field(w, h))
    // Lord 1 holding nearly all the land would win at once: no one wins here.
    state.rules = { ...state.rules, victoryShare: 1001, victoryFloor: 1001 }
    const column = Array.from({ length: h }, (_, r) => r * w)
    hold(
      state,
      1,
      Array.from({ length: w * h }, (_, t) => t),
    )
    hold(state, 0, column)
    muster(state, 0, 15 * w)
    endow(state, 0, 400)
    endow(state, 1, 50)
    run(state, 40, [attack(0, 15 * w + 39, 'host')])
    const taken = owned(state, 0).filter((t) => t % w > 0)
    const wide = state.rules.bandTiles + 10
    expect(taken.length).toBeGreaterThan(50)
    expect(taken.every((t) => Math.abs(Math.floor(t / w) - 15) <= wide)).toBe(
      true,
    )
  })

  it('stops where it cannot pay for the next tile, its last men fallen there with their worth of its holders', () => {
    const state = playing(field(8))
    hold(state, 0, [0])
    muster(state, 0, 0)
    hold(state, 1, [1, 2, 3, 4, 5, 6, 7])
    endow(state, 0, 40)
    endow(state, 1, 70)
    // Ten men against tiles held by ten each, at five soldiers a tile: two fall, then the army is spent.
    run(state, 3, [attack(0, 7, 'host')])
    expect(owned(state, 0)).toEqual([0, 1, 2])
    expect(state.hosts).toEqual([])
  })

  it('goes home with its survivors when there is nothing left to take', () => {
    const state = playing(field(4))
    state.rules = { ...state.rules, neutralHold: 0, neutralFloor: 0 }
    hold(state, 0, [0])
    muster(state, 0, 0)
    hold(state, 1, [3])
    endow(state, 0, 400)
    run(state, 3, [attack(0, 1, 'host')])
    expect(owned(state, 0)).toEqual([0, 1, 2])
    expect(state.hosts).toEqual([])
    expect(state.players[0].peasants).toBe(400 * UNIT)
  })
})

describe('the sickness', () => {
  it('takes a tenth a second of the peasants over what the land and villages feed, and none under it', () => {
    const state = playing(field(6))
    state.rules = { ...state.rules, sickness: RULES.sickness }
    hold(state, 0, [0, 1])
    muster(state, 0, 0)
    hold(state, 1, [5])
    const cap = capOf(state, 0)
    state.players[0].peasants = cap + 100 * UNIT
    run(state, SECOND)
    const left = state.players[0].peasants - cap
    expect(left).toBeGreaterThan(89 * UNIT)
    expect(left).toBeLessThan(92 * UNIT)
    run(state, 120 * SECOND)
    expect(state.players[0].peasants).toBe(cap)
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
