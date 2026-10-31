import { TICKS_PER_SECOND, menFor, reachOf, wideOf } from '../../engine'
import { courseNow } from './course'
import type { Army, GameState, Host, Plan } from '../../engine'

// Where an army's men will be spent (engine/reach.ts), as the screen asks
// it: under the pointer for the army in hand, the ghost of its standard
// (layers/aim.ts); for each of the player's armies on its way, its standard
// (layers/goals.ts). Worked out again once a second at most, or when the
// pointer moves to another tile: the land moves, slowly.

/** A reach, and whether it falls short of the tile aimed at. */
export type Reach = { tile: number; short: boolean }

/** How far along the line from `entry` to `aim` a tile lies. */
function along(state: GameState, entry: number, aim: number, tile: number) {
  const w = state.grid.width
  const [ex, ey] = [entry % w, Math.floor(entry / w)]
  const [ax, ay] = [(aim % w) - ex, Math.floor(aim / w) - ey]
  return ((tile % w) - ex) * ax + (Math.floor(tile / w) - ey) * ay
}

function reachFor(state: GameState, plan: Plan): Reach {
  const tile = reachOf(state, plan)
  const short =
    along(state, plan.entry, plan.aim, tile) <
    along(state, plan.entry, plan.aim, plan.aim)
  return { tile, short }
}

const second = (state: GameState) => Math.floor(state.tick / TICKS_PER_SECOND)

let aimed = { key: '', reach: null as Reach | null }

/** Where the army in hand, sent at the tile, would be spent; none if it cannot be sent there. */
export function reachNow(
  state: GameState,
  player: number,
  tile: number,
  army: Army,
): Reach | null {
  const key = `${second(state)}:${player}:${tile}:${army}`
  if (key === aimed.key) return aimed.reach
  const course = courseNow(state, player, tile, army)
  const men = menFor(state, player, army)
  const reach =
    course && course.entry >= 0 && men > 0
      ? reachFor(state, {
          owner: player,
          target: state.owner[tile],
          ...(course.through ? { through: true } : {}),
          entry: course.entry,
          aim: tile,
          wide: wideOf(state, men),
          men,
          ashore: state.grid.water[course.road.at(-1) ?? -1] === true,
        })
      : null
  aimed = { key, reach }
  return reach
}

const kept = new WeakMap<Host, { at: number; reach: Reach }>()

/** Where an army on its way will be spent, as the land stands this second. */
export function hostReach(state: GameState, host: Host): Reach {
  const now = second(state)
  const known = kept.get(host)
  if (known?.at === now) return known.reach
  const reach = reachFor(state, {
    ...host,
    ashore: state.grid.water[host.road.at(-1) ?? -1] === true,
  })
  kept.set(host, { at: now, reach })
  return reach
}
