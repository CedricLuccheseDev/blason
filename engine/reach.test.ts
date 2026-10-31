import { describe, expect, it } from 'vitest'
import { reachOf } from './reach'
import { endow, field, hold, muster, playing, run } from './testing'
import type { GameState } from './types'

// The standard where the army will be spent (reach.ts): the reach worked out
// as the army is sent falls where its push truly ends, and goes farther with
// more men.

/** A long strip of free land, lord 0 at its left end with a village, so many peasants. */
function strip(peasants: number): GameState {
  const state = playing(field(80, 15))
  // Free land held alike everywhere, half a man a tile, whatever the lords hold.
  state.rules = { ...state.rules, neutralHold: 0, neutralFloor: 500 }
  const left = Array.from({ length: 15 }, (_, y) => [y * 80, y * 80 + 1]).flat()
  hold(state, 0, left)
  muster(state, 0, 7 * 80)
  hold(state, 1, [14 * 80 + 79])
  endow(state, 0, peasants)
  return state
}

/** The column of the farthest tile of lord 0's. */
const reached = (state: GameState) =>
  Math.max(...state.owner.flatMap((o, t) => (o === 0 ? [t % 80] : [])))

/** Lord 0's troop sent along the strip, its reach as worked out then. */
function send(state: GameState) {
  run(state, 1, [
    { player: 0, type: 'attack', tile: 7 * 80 + 40, army: 'host' },
  ])
  const host = state.hosts[0]
  return reachOf(state, host) % 80
}

describe('where an army will be spent', () => {
  it('is where its push ends, past the click or short of it', () => {
    for (const peasants of [200, 500, 800]) {
      const state = strip(peasants)
      const foreseen = send(state)
      run(state, 3000)
      expect(state.hosts).toHaveLength(0)
      expect(Math.abs(reached(state) - foreseen)).toBeLessThanOrEqual(2)
    }
  })

  it('goes farther with more men', () => {
    expect(send(strip(800))).toBeGreaterThan(send(strip(200)))
  })
})
