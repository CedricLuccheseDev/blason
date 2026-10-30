import { describe, expect, it } from 'vitest'
import { createGame } from './land'
import { fingerprint } from './numbers'
import { landOf } from './setup'
import { step } from './step'
import { createBot } from './bots/bot'
import { setupOf } from './testing'
import { NO_ONE } from './types'
import type { GameState } from './types'

// The golden games: three games of bots on one land, and at fixed ticks a
// fingerprint of what moves in them, recorded once and written here. A
// change meant to keep the game keeps them; one that changes the game, on
// purpose or not, breaks them, and the commit that records them again says
// why. The fingerprint is the test's own, over the moving parts alone, so
// that what a game is made of may move elsewhere without changing it.

const SEED = 'golden'
const { grid } = landOf(setupOf(20, { seed: SEED }))

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

/** A game played by the bots its setup seats, its fingerprint at each tick asked. */
function prints(state: GameState, ticks: Array<number>) {
  const bots = state.setup.seats.map(
    (seat, id) => seat.bot && createBot(id, SEED, seat.bot),
  )
  const found: Record<number, string> = {}
  for (const tick of ticks) {
    while (state.tick < tick && state.winner === NO_ONE)
      step(
        state,
        state.players.flatMap((p, id) =>
          p.alive ? (bots[id]?.(state, id) ?? []) : [],
        ),
      )
    found[tick] = print(state)
  }
  return found
}

describe('the golden games', () => {
  it('twenty normal bots on a standard land', () => {
    const state = createGame(grid, setupOf(20, { seed: SEED }))
    expect(prints(state, [100, 600, 1500])).toEqual({
      100: 'da08c324242d0',
      600: 'a55eab8b696d',
      1500: '7d92f7bc110e',
    })
  }, 60_000)

  it('eight hard bots in two teams of four', () => {
    const teams = [0, 0, 0, 0, 1, 1, 1, 1]
    const setup = setupOf(8, { seed: SEED, level: 'hard', teams })
    const state = createGame(grid, setup)
    expect(prints(state, [600, 1500])).toEqual({
      600: '2be743c868863',
      1500: '629ec97fdf3d9',
    })
  }, 60_000)

  it('twenty normal bots and an opening of 30 seconds', () => {
    const state = createGame(grid, setupOf(20, { seed: SEED, opening: 300 }))
    expect(prints(state, [300, 900])).toEqual({
      300: '1270314ed578da',
      900: '8c879f554afa7',
    })
  }, 60_000)
})
