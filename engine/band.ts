import { isqrt } from './numbers'
import { roughAt } from './rough'
import { NEUTRAL } from './types'
import type { GameState, Host } from './types'

// The band an army takes (war.ts): the tiles it strikes, the strip along its
// line from where it entered towards the click, as wide as its men, and the
// order it takes them in, the way ahead first; read by the war, and by the
// reach, which plays its push over in thought (reach.ts).

/**
 * The order an army takes tiles in: from where it entered, twice as fast
 * towards the click as to the sides, within its band (inBand), so its front
 * is a wall moving on, not a thread; the land's roughness bends it
 * (rough.ts). Distances in tenths of a tile.
 */
export function priority(
  state: GameState,
  host: Pick<Host, 'entry' | 'aim' | 'owner'>,
  tile: number,
) {
  const w = state.grid.width
  const dx = (tile % w) - (host.entry % w)
  const dy = Math.floor(tile / w) - Math.floor(host.entry / w)
  const ax = (host.aim % w) - (host.entry % w)
  const ay = Math.floor(host.aim / w) - Math.floor(host.entry / w)
  const reach = isqrt(100 * (dx * dx + dy * dy))
  const length = isqrt(ax * ax + ay * ay)
  const ahead =
    length === 0 ? 0 : Math.floor((10 * (dx * ax + dy * ay)) / length)
  return 2 * reach - ahead + roughAt(state, host.owner, tile)
}

/**
 * Whether a tile lies in the army's band: near enough the line from where it
 * entered towards the click, as wide as its men. An army pushes on along its
 * line, past the click while it has men, and never swells into a ball.
 */
export function inBand(
  state: GameState,
  host: Pick<Host, 'entry' | 'aim' | 'owner' | 'wide'>,
  tile: number,
): boolean {
  const w = state.grid.width
  const dx = (tile % w) - (host.entry % w)
  const dy = Math.floor(tile / w) - Math.floor(host.entry / w)
  const ax = (host.aim % w) - (host.entry % w)
  const ay = Math.floor(host.aim / w) - Math.floor(host.entry / w)
  const length = ax * ax + ay * ay
  // The band's edge bends with the land's roughness, some tiles in or out,
  // so that it is no straight wall (rough.ts).
  const { roughness } = state.rules
  const bend = Math.floor(
    (2 * roughAt(state, host.owner, tile) - roughness) / 10,
  )
  const wide = Math.max(1, host.wide + bend)
  if (length === 0) return dx * dx + dy * dy <= wide * wide
  const across = dx * ay - dy * ax
  return across * across <= wide * wide * length
}

/** Whether a tile is the army's to strike: its target's; or free, on its way to a lord its land does not touch (course.ts, `through`). */
export const struck = (
  state: GameState,
  host: Pick<Host, 'target' | 'through'>,
  tile: number,
) =>
  state.owner[tile] === host.target ||
  (host.through === true && state.owner[tile] === NEUTRAL)
