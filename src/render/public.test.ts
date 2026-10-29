import { describe, expect, it } from 'vitest'
import { NO_ONE, canStart, publicSetup, stateHash } from '../../engine'
import { browser, turn } from './testing'
import type { GameState, Order } from '../../engine'
import type { Turn } from '../../net/protocol'

// The public game online, as the browsers play it: no bot, the seats no one
// took empty, a leaver's lord idle, and one alone when its doors close
// seeing its opening begin again (server/rooms.ts), the same game as any
// browser that comes in then.

const seed = 'online-public'
const setup = publicSetup(seed)
const { opening } = setup

/** A lord's standard on the first tile he may plant on. */
function plant(state: GameState, player: number): Array<Order> {
  const tile = state.grid.land.findIndex(
    (on, t) => on && canStart(state, player, t),
  )
  return [{ player, type: 'pickStart', tile }]
}

describe('the public game online', () => {
  it('is played by persons alone: the empty seats no lords, a leaver’s lord idle, the same on a browser come in late', () => {
    // No bot: a person at seat 0 from turn 10, another at seat 1 from turn
    // 100, whose browser comes in then; the first leaves past the opening.
    const joins = new Map([
      [10, [0]],
      [100, [1]],
    ])
    const plants = new Map([
      [20, 0],
      [110, 1],
    ])
    const a = browser(seed, 0, opening, setup)
    const played: Array<Turn> = []
    let b: ReturnType<typeof browser> | null = null
    for (let n = 0; n < opening + 100; n++) {
      const planter = plants.get(n)
      const told = turn(n, {
        orders: planter === undefined ? [] : plant(a.session.state, planter),
        joined: joins.get(n) ?? [],
        left: n === opening + 20 ? [0] : [],
      })
      played.push(told)
      a.hand(told)
      a.session.advance(100)
      if (n === 99) {
        b = browser(seed, 1, opening, setup)
        for (const past of played) b.hand(past)
      } else b?.hand(told)
      b?.session.advance(100, undefined, 20)
    }
    if (!b) throw new Error('no newcomer')
    const { state } = b.session
    expect(state.tick).toBe(opening + 100)
    expect(stateHash(state)).toBe(stateHash(a.session.state))
    // Two lords, each on his land; the eighteen seats no one took, none.
    const lords = state.players.flatMap((p, id) => (p.alive ? [id] : []))
    expect(lords).toEqual([0, 1])
    expect(state.players.slice(2).every((p) => p.tiles === 0)).toBe(true)
    expect(state.winner).toBe(NO_ONE)
    // The leaver's lord stays, idle: his land, and no army of his ever out.
    expect(state.players[0].tiles).toBeGreaterThan(0)
    expect(state.hosts.some((h) => h.owner === 0)).toBe(false)
  })

  it('begins again for one alone when its doors close: made anew, his standard where he planted it, the same game as a newcomer’s', () => {
    // Alone from turn 5, his standard planted at turn 10; the relay closes
    // the doors on him at turn 250, says the game begins again, and plays
    // it from its first turn, his seat his and his standard planted again.
    const a = browser(seed, 0, opening, setup)
    let standard: Array<Order> = []
    for (let n = 0; n < 250; n++) {
      if (n === 10) standard = plant(a.session.state, 0)
      a.hand(
        turn(n, {
          orders: n === 10 ? standard : [],
          joined: n === 5 ? [0] : [],
        }),
      )
      a.session.advance(100)
    }
    const planted = a.session.state.players[0].standard
    expect(planted).toBeGreaterThanOrEqual(0)
    a.hand({ t: 'begin', seat: 0, setup })
    const turns = [turn(0, { orders: standard, joined: [0] }), turn(1)]
    for (const told of turns) a.hand(told)
    a.session.advance(200)
    const { state } = a.session
    expect(state.tick).toBe(2)
    expect(state.players[0]).toMatchObject({ alive: true, standard: planted })
    // A browser come in then plays the same turns to the same game.
    const b = browser(seed, 1, opening, setup)
    for (const told of turns) b.hand(told)
    b.session.advance(200)
    expect(stateHash(b.session.state)).toBe(stateHash(state))
  })
})
