import { describe, expect, it } from 'vitest'
import { RULES, generateWorld, makeGrid, stateHash } from '../../engine'
import { startRemoteSession } from './remote'
import type { FromRelay } from '../../net/protocol'
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

describe('a game online', () => {
  it('is the same game on two browsers given the same turns, bots and all', () => {
    const seed = 'online-test'
    const world = generateWorld(seed)
    const grid = () =>
      makeGrid(world.map, world.width, world.height, RULES.tileSize)
    const a = fakeLink()
    const b = fakeLink()
    const one = startRemoteSession(grid(), seed, 0, 'normal', 2, a.link)
    const two = startRemoteSession(grid(), seed, 1, 'normal', 2, b.link)
    for (let n = 0; n < 400; n++) {
      const turn: FromRelay = {
        t: 'turn',
        n,
        orders: [],
        left: n === 250 ? [1] : [],
      }
      a.hand(turn)
      b.hand(turn)
      one.advance(100)
      two.advance(100)
    }
    expect(one.state.tick).toBe(400)
    expect(stateHash(one.state)).toBe(stateHash(two.state))
    const hashes = a.sent.filter((m) => (m as { t: string }).t === 'hash')
    expect(hashes).toHaveLength(8)
  })
})
