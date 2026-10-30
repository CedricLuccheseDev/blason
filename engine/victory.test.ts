import { describe, expect, it } from 'vitest'
import { TICKS_PER_SECOND, UNIT } from './units'
import { createGame, setOwner } from './land'
import { nextDrop, step, victoryShare } from './step'
import { RULES } from './rules'
import { field, hold, playing, setupOf } from './testing'
import { NEUTRAL, NO_ONE } from './types'
import type { GameState, Host } from './types'

// How a game is won (docs/RULES.md): a lord with his share of the land, a
// share that falls with time from the tenth minute down to its floor, or
// the last one standing; a lord with no land left is out, and nothing moves
// once the game is won.

const MINUTE = 60 * TICKS_PER_SECOND

/** Two lords on a land of a thousand tiles: the first holds so many of them, the second one. */
function holding(tiles: number): GameState {
  const state = playing(field(1000), 2)
  hold(
    state,
    0,
    Array.from({ length: tiles }, (_, t) => t),
  )
  hold(state, 1, [999])
  return state
}

/** The share that wins at a tick, in thousandths, and the ticks until it drops again. */
function at(tick: number) {
  const state = playing(field(10))
  state.tick = tick
  return { share: victoryShare(state), drop: nextDrop(state) }
}

/** An army of the lord's on its way, still on its road. */
const marching = (owner: number): Host => ({
  owner,
  army: 'host',
  target: NEUTRAL,
  men: 100 * UNIT,
  aim: 30,
  entry: 30,
  departs: 0,
  queue: [],
  edge: [],
  from: 0,
  road: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  along: 0,
  fighting: false,
  closing: -1,
  wide: 1,
})

describe('the victory', () => {
  it('goes to a lord holding 80 % of the land, not 79.9 %', () => {
    const short = holding(799)
    step(short)
    expect(short.winner).toBe(NO_ONE)
    const held = holding(800)
    step(held)
    expect(held.winner).toBe(0)
  })

  it('asks for a share that falls by 5 % a minute from the tenth, down to 50 % at the fifteenth', () => {
    expect(at(0).share).toBe(800)
    expect(at(10 * MINUTE - 1).share).toBe(800)
    expect(at(10 * MINUTE).share).toBe(750)
    expect(at(11 * MINUTE).share).toBe(700)
    expect(at(15 * MINUTE - 1).share).toBe(550)
    expect(at(15 * MINUTE).share).toBe(500)
    expect(at(40 * MINUTE).share).toBe(500)
  })

  it('tells when the share drops next, and nothing once it rests on its floor', () => {
    expect(at(0).drop).toBe(10 * MINUTE)
    expect(at(10 * MINUTE - 1).drop).toBe(1)
    expect(at(10 * MINUTE).drop).toBe(MINUTE)
    expect(at(10 * MINUTE + 1).drop).toBe(MINUTE - 1)
    expect(at(15 * MINUTE - 10).drop).toBe(10)
    expect(at(15 * MINUTE).drop).toBeNull()
  })

  it('comes with the falling share: 76 % wins at the tenth minute, not before', () => {
    const early = holding(760)
    early.tick = 10 * MINUTE - 1
    step(early)
    expect(early.winner).toBe(NO_ONE)
    const late = holding(760)
    late.tick = 10 * MINUTE
    step(late)
    expect(late.winner).toBe(0)
  })

  it('goes to the last lord standing, whatever his share', () => {
    const state = holding(10)
    // Two sides at the start, each its standard planted.
    state.players[0].standard = 0
    state.players[1].standard = 999
    setOwner(state, 999, NEUTRAL)
    step(state)
    expect(state.players[1].alive).toBe(false)
    expect(state.winner).toBe(0)
  })

  it('waits for the share in a game begun with every lord in one team, not its first tick', () => {
    const state = createGame(field(1000), setupOf(2, { teams: [0, 0] }), {
      ...RULES,
      fillSeconds: Number.MAX_SAFE_INTEGER,
      sickness: 0,
      seaWalled: 0,
    })
    state.players[0].standard = 0
    state.players[1].standard = 999
    state.tick = state.rules.openingTicks + 1
    hold(state, 0, [0, 1, 2])
    hold(state, 1, [997, 998, 999])
    step(state)
    expect(state.winner).toBe(NO_ONE)
  })

  it('takes from a lord with no land left his armies, his caravans and his alliances', () => {
    const state = playing(field(40), 3)
    hold(state, 0, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    hold(state, 1, [10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
    state.hosts.push(marching(2), marching(0))
    state.caravans.push({
      owner: 2,
      to: 0,
      via: [0],
      road: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      along: 0,
      gold: 10 * UNIT,
    })
    const pact = { expires: MINUTE, renewA: false, renewB: false }
    state.alliances.push({ a: 2, b: 0, ...pact }, { a: 0, b: 1, ...pact })
    step(state)
    expect(state.players[2].alive).toBe(false)
    expect(state.hosts.map((h) => h.owner)).toEqual([0])
    expect(state.caravans).toEqual([])
    expect(state.alliances.map((x) => [x.a, x.b])).toEqual([[0, 1]])
    expect(state.winner).toBe(NO_ONE)
  })

  it('stops the game once won: no order, no tick', () => {
    const state = holding(800)
    step(state)
    expect(state.winner).toBe(0)
    const won = JSON.stringify(state)
    step(state, [{ player: 1, type: 'attack', tile: 500, army: 'host' }])
    step(state)
    expect(JSON.stringify(state)).toBe(won)
  })
})
