import { describe, expect, it } from 'vitest'
import { createGame } from './land'
import { landOf, publicSetup } from './setup'
import { canStart, takeSeat } from './opening'
import { stateHash, step } from './step'
import { NO_ONE } from './types'
import type { GameState, Order } from './types'

// The seats of a game no bot plays (the public game's, publicSetup): empty,
// no lord there, until a person takes one in the opening; one never taken is
// given no standard, no land, and counts for nothing in the race.

const setup = publicSetup('empty-seats')
const { grid } = landOf(setup)

/** The first tile of the land a lord may plant on. */
const spot = (state: GameState, lord: number) =>
  state.grid.land.findIndex((on, t) => on && canStart(state, lord, t))

/** The opening played to its end, these orders at its first tick. */
function toTheEnd(state: GameState, orders: Array<Order> = []) {
  step(state, orders)
  while (state.tick < state.rules.openingTicks) step(state)
}

describe('an empty seat', () => {
  it('is no lord: no standard, no land, and its orders do nothing', () => {
    const state = createGame(grid, setup)
    expect(state.players.every((p) => !p.alive)).toBe(true)
    toTheEnd(state, [{ player: 3, type: 'pickStart', tile: spot(state, 3) }])
    expect(state.players.every((p) => p.standard < 0 && p.tiles === 0)).toBe(
      true,
    )
    expect(state.works).toEqual([])
    step(state)
    expect(state.winner).toBe(NO_ONE)
  })

  it('taken in the opening, is its person’s lord: he plants, or is given a spot, and receives his land', () => {
    const state = createGame(grid, setup)
    takeSeat(state, 0)
    takeSeat(state, 5)
    const planted = spot(state, 0)
    toTheEnd(state, [{ player: 0, type: 'pickStart', tile: planted }])
    expect(state.players[0]).toMatchObject({ alive: true, standard: planted })
    expect(state.owner[planted]).toBe(0)
    // Who took a seat and planted nothing is given a start, as anyone.
    expect(state.players[5].standard).toBeGreaterThanOrEqual(0)
    expect(state.players[5].tiles).toBeGreaterThan(0)
    // The seats no one took stay empty, and the two lords race on.
    const lords = state.players.flatMap((p, id) => (p.alive ? [id] : []))
    expect(lords).toEqual([0, 5])
    step(state)
    expect(state.winner).toBe(NO_ONE)
    // Once the opening is over, no seat is taken any more.
    takeSeat(state, 7)
    expect(state.players[7].alive).toBe(false)
  })

  it('is the same on every machine: the same seats taken at the same ticks, the same game', () => {
    const play = () => {
      const state = createGame(grid, setup)
      takeSeat(state, 2)
      step(state, [{ player: 2, type: 'pickStart', tile: spot(state, 2) }])
      takeSeat(state, 9)
      toTheEnd(state)
      return stateHash(state)
    }
    expect(play()).toBe(play())
  })
})
