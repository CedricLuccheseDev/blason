import { describe, expect, it } from 'vitest'
import {
  NO_ONE,
  RULES,
  SETUP_LIMITS,
  botsSetup,
  canStart,
  generateWorld,
  makeGrid,
  publicSetup,
  stateHash,
} from '../../engine'
import { startRemoteSession } from './remote'
import type { GameSetup, Order } from '../../engine'
import type { FromRelay, Turn } from '../../net/protocol'
import type { Link } from './link'

/** A line to no relay: the turns are handed by the test, the words sent are kept. */
function fakeLink() {
  const listeners = new Set<(message: FromRelay) => void>()
  const sent: Array<unknown> = []
  const link: Link = {
    send: (message) => sent.push(message),
    listen: (hear) => {
      listeners.add(hear)
      return () => listeners.delete(hear)
    },
    close: () => undefined,
  }
  const hand = (message: FromRelay) => {
    for (const hear of listeners) hear(message)
  }
  return { link, hand, sent }
}

const worlds = new Map<string, ReturnType<typeof generateWorld>>()

/** A browser playing the game online from a seat, on a line of its own; the land made once for every browser; a bot in every seat unless the setup says otherwise. */
function browser(
  seed: string,
  seat: number,
  opening: number,
  setup: GameSetup = botsSetup({ seed, opening }),
) {
  const world = worlds.get(seed) ?? generateWorld(seed)
  worlds.set(seed, world)
  const grid = makeGrid(world.map, world.width, world.height, RULES.tileSize)
  const line = fakeLink()
  const session = startRemoteSession(grid, { link: line.link, seat, setup })
  return { ...line, session }
}

const turn = (n: number, more: Partial<Turn> = {}): Turn => ({
  t: 'turn',
  n,
  orders: [],
  joined: [],
  left: [],
  ...more,
})

describe('a game online', () => {
  it('is the same game on two browsers given the same turns, bots and all', () => {
    const seed = 'online-test'
    const a = browser(seed, 0, RULES.openingTicks)
    const b = browser(seed, 1, RULES.openingTicks)
    for (let n = 0; n < 400; n++) {
      const told = turn(n, {
        joined: n === 0 ? [0, 1] : [],
        left: n === 250 ? [1] : [],
      })
      a.hand(told)
      b.hand(told)
      a.session.advance(100)
      b.session.advance(100)
    }
    expect(a.session.state.tick).toBe(400)
    expect(stateHash(a.session.state)).toBe(stateHash(b.session.state))
    const hashes = a.sent.filter((m) => (m as { t: string }).t === 'hash')
    expect(hashes).toHaveLength(8)
  })

  it('opens as long as the relay says, the same on every browser', () => {
    const { session } = browser(
      'online-opening',
      0,
      SETUP_LIMITS.opening.public,
    )
    expect(session.state.rules.openingTicks).toBe(SETUP_LIMITS.opening.public)
    expect(SETUP_LIMITS.opening.public).toBe(30 * 10)
  })

  it('is the same game for one who came in during the opening, the turns so far played again', () => {
    // The public game: a player at seat 0 from turn 30, another who comes
    // in at turn 120 at seat 1, given every turn played until then.
    const seed = 'online-joined'
    const opening = SETUP_LIMITS.opening.public
    const joins = new Map([
      [30, [0]],
      [120, [1]],
    ])
    const a = browser(seed, 0, opening)
    const played: Array<Turn> = []
    let b: ReturnType<typeof browser> | null = null
    let planted = -1
    /** The newcomer moves his standard, the bot's, where he likes. */
    const replant = (): Array<Order> => {
      const { state } = a.session
      planted = state.grid.land.findIndex(
        (on, t) =>
          on && t !== state.players[1].standard && canStart(state, 1, t),
      )
      return [{ player: 1, type: 'pickStart', tile: planted }]
    }
    for (let n = 0; n < opening + 40; n++) {
      const told = turn(n, {
        orders: n === 130 ? replant() : [],
        joined: joins.get(n) ?? [],
      })
      played.push(told)
      a.hand(told)
      a.session.advance(100)
      if (n === 119) {
        b = browser(seed, 1, opening)
        for (const past of played) b.hand(past)
      } else b?.hand(told)
      // A frame plays twenty turns at most (client.ts): the newcomer
      // catches up over a few frames.
      b?.session.advance(100, undefined, 20)
      if (b && b.session.state.tick === a.session.state.tick)
        expect(stateHash(b.session.state)).toBe(stateHash(a.session.state))
    }
    if (!b) throw new Error('no newcomer')
    expect(b.session.state.tick).toBe(opening + 40)
    expect(stateHash(b.session.state)).toBe(stateHash(a.session.state))
    // His order moved the standard his bot had planted; his land is round it.
    expect(planted).toBeGreaterThanOrEqual(0)
    expect(b.session.state.owner[planted]).toBe(1)
    // From his turn on, his bot sends nothing: no army of his is out, while
    // every bot's is.
    const out = new Set(b.session.state.hosts.map((h) => h.owner))
    expect(out.has(0)).toBe(false)
    expect(out.has(1)).toBe(false)
    expect(out.size).toBeGreaterThan(10)
  })

  it('plays the public game with persons alone: the empty seats no lords, a leaver’s lord idle, the same on a browser come in late', () => {
    // No bot: a person at seat 0 from turn 10, another at seat 1 from turn
    // 100, whose browser comes in then; the first leaves past the opening.
    const seed = 'online-public'
    const setup = publicSetup(seed)
    const { opening } = setup
    const joins = new Map([
      [10, [0]],
      [100, [1]],
    ])
    const plants = new Map([
      [20, 0],
      [110, 1],
    ])
    /** A person plants his standard on the first tile he may. */
    const plant = (player: number): Array<Order> => {
      const { state } = a.session
      const tile = state.grid.land.findIndex(
        (on, t) => on && canStart(state, player, t),
      )
      return [{ player, type: 'pickStart', tile }]
    }
    const a = browser(seed, 0, opening, setup)
    const played: Array<Turn> = []
    let b: ReturnType<typeof browser> | null = null
    for (let n = 0; n < opening + 100; n++) {
      const planter = plants.get(n)
      const told = turn(n, {
        orders: planter === undefined ? [] : plant(planter),
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

  it('catches up on turns piled up a few at a time, never all in one frame', () => {
    const { hand, session } = browser('online-catch-up', 0, RULES.openingTicks)
    for (let n = 0; n < 50; n++) hand(turn(n, { joined: n === 0 ? [0] : [] }))
    session.advance(16, undefined, 20)
    expect(session.state.tick).toBe(20)
    session.advance(16, undefined, 20)
    session.advance(16, undefined, 20)
    expect(session.state.tick).toBe(50)
  })
})
