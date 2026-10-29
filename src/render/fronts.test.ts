import { describe, expect, it } from 'vitest'
import { RULES, createGame } from '../../engine'
import { makeFronts } from './fronts'
import { tileAt } from './marks'
import type { GameState, Grid, Host } from '../../engine'
import type { Spot } from './fronts'

// Where a battle is drawn: on the ground the game has the two armies fight
// on, never on the water. Cédric, playing: « y'a des batailles dans l'eau ».

const WIDTH = 20
const at = (x: number, y: number) => y * WIDTH + x

/** A land 20 tiles by 16, a bay cut into it from the top, four tiles wide and ten deep; lord 1 holds it all but a strip on the right, lord 0's. */
function bay(): GameState {
  const land = Array.from({ length: WIDTH * 16 }, (_, t) => {
    const [x, y] = [t % WIDTH, Math.floor(t / WIDTH)]
    return !(x >= 8 && x <= 11 && y <= 9)
  })
  const grid: Grid = { width: WIDTH, height: 16, size: 4, land, area: 0 }
  grid.area = land.filter(Boolean).length
  const state = createGame(grid, 2, 'bay', RULES)
  const strip = (t: number) => t % WIDTH >= 13 && Math.floor(t / WIDTH) === 12
  land.forEach((dry, t) => {
    if (dry) state.owner[t] = strip(t) ? 0 : 1
  })
  return state
}

const host = (
  fields: Partial<Host> & Pick<Host, 'owner' | 'target' | 'road' | 'along'>,
): Host => ({
  army: 'host',
  men: 100_000,
  aim: fields.road.at(-1) ?? 0,
  entry: fields.road.at(-1) ?? 0,
  departs: 0,
  queue: [],
  edge: [],
  from: fields.road[0],
  fighting: true,
  closing: 3,
  wide: 4,
  ...fields,
})

describe('a battle', () => {
  it('is drawn on the land where the game has the armies meet, not across the bay', () => {
    const state = bay()
    // Lord 0's army has struck up the far shore of the bay, to its head at its top, and took last a tile on the near shore, below the bay.
    const [head, last] = [at(14, 2), at(6, 13)]
    state.owner[head] = 0
    state.owner[last] = 0
    state.owner[at(12, 12)] = 0
    const striking = host({
      owner: 0,
      target: 1,
      road: [at(16, 12), at(15, 12), at(14, 12), at(13, 12)],
      along: 3000,
      entry: at(12, 12),
      aim: at(15, 0),
      edge: [last, head],
    })
    // Lord 1's army marches on its own land against lord 0, two tiles from that last tile.
    const marching = host({
      owner: 1,
      target: 0,
      road: [at(2, 11), at(3, 11), at(4, 11), at(5, 11), at(6, 11)],
      along: 2000,
    })
    state.hosts = [striking, marching]
    const fronts = makeFronts().read(state, 0)
    const dry = (spot: Spot | null) =>
      spot !== null && tileAt(state.grid, spot.x, spot.y) >= 0
    for (const army of state.hosts) {
      const front = fronts.get(army)
      expect(front?.phase).toBe('battle')
      expect(dry(front?.line ?? null)).toBe(true)
      expect(dry(front?.at ?? null)).toBe(true)
    }
  })
})
