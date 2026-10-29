import { describe, expect, it } from 'vitest'
import { generateWorld } from './map/generate'
import { makeGrid } from './grid'
import { createGame } from './land'
import { fingerprint } from './numbers'
import { RULES } from './rules'
import { step } from './step'
import { createBot } from './bots/bot'
import { NO_ONE } from './types'
import type { Level } from './bots/levels'
import type { GameState } from './types'

// The golden games: three games of bots on one land, and at fixed ticks a
// fingerprint of what moves in them, recorded once and written here. A
// change meant to keep the game keeps them; one that changes the game, on
// purpose or not, breaks them, and the commit that records them again says
// why. The fingerprint is the test's own, over the moving parts alone, so
// that what a game is made of may move elsewhere without changing it.

const SEED = 'golden'
const world = generateWorld(SEED)
const grid = makeGrid(world.map, world.width, world.height, RULES.tileSize)

/** What moves in a game: never its land's tiles, its rules or how it was set up. */
const MOVING = [
  'tick',
  'owner',
  'works',
  'players',
  'hosts',
  'alliances',
  'requests',
  'offerings',
  'caravans',
  'strikes',
  'scars',
  'winner',
] as const

const print = (state: GameState) =>
  fingerprint(JSON.stringify(MOVING.map((key) => state[key])))

/** A game played by bots of the level, its fingerprint at each tick asked. */
function prints(state: GameState, level: Level, ticks: Array<number>) {
  const bots = state.players.map((_, id) => createBot(id, SEED, level))
  const found: Record<number, string> = {}
  for (const tick of ticks) {
    while (state.tick < tick && state.winner === NO_ONE)
      step(
        state,
        state.players.flatMap((p, id) => (p.alive ? bots[id](state, id) : [])),
      )
    found[tick] = print(state)
  }
  return found
}

describe('the golden games', () => {
  it('twenty normal bots on a standard land', () => {
    const state = createGame(grid, 20, SEED)
    expect(prints(state, 'normal', [100, 600, 1500])).toEqual({
      100: '1d818442da542a',
      600: 'b63882124225c',
      1500: '12eeda675ec9c6',
    })
  }, 60_000)

  it('eight hard bots in two teams of four', () => {
    const state = createGame(grid, 8, SEED, RULES, [0, 0, 0, 0, 1, 1, 1, 1])
    expect(prints(state, 'hard', [600, 1500])).toEqual({
      600: '1df66b3adeab42',
      1500: '10b71e5492eb0f',
    })
  }, 60_000)

  it('twenty normal bots and an opening of 30 seconds', () => {
    const state = createGame(grid, 20, SEED, { ...RULES, openingTicks: 300 })
    expect(prints(state, 'normal', [300, 900])).toEqual({
      300: '1cf0ced08756f',
      900: '1323ae49c00231',
    })
  }, 60_000)
})
