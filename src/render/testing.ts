import { RULES, botsSetup, generateWorld, makeGrid } from '../../engine'
import { startRemoteSession } from './remote'
import type { GameSetup } from '../../engine'
import type { FromRelay, Turn } from '../../net/protocol'
import type { Link } from './link'

// What the tests of a game online share: a line to no relay, the turns
// handed by the test, and a browser playing on it from a seat.

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
export function browser(
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

export const turn = (n: number, more: Partial<Turn> = {}): Turn => ({
  t: 'turn',
  n,
  orders: [],
  joined: [],
  left: [],
  ...more,
})
