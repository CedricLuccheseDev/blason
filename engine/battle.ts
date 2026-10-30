import { UNIT } from './units'
import { apart, around } from './grid'
import { isqrt } from './numbers'
import { standing } from './land'
import { isAllied } from './diplomacy'
import { marching, positionOf } from './muster'
import type { GameState, Host } from './types'

// The battles: an army in a lord's land, taking it, and an army of that lord
// that come near each other over land (any other army passes by, so that none is drawn
// into a war it was not sent to) stop,
// walk to meet halfway along the way over the land between them, round a
// mountain or a bay (« ils se rencontrent quand ils se touchent »), which
// takes them as long as half that way, then fight there, and neither moves on until one is gone. An even battle lasts a few
// seconds, so that it is seen; each side loses men as the combat table says,
// one for one in the field, two for one for whoever assails an army defending
// under its own castle.

/** Whether a tile lies under one of the lord's castles. */
export function walled(state: GameState, tile: number, lord: number): boolean {
  const r = state.rules.castleRadius
  return state.works.some(
    (w) =>
      w.owner === lord &&
      w.work === 'castle' &&
      standing(state, w) &&
      apart(state.grid, w.tile, tile) <= r * r,
  )
}

/** What an army loses for each man of the other, in percent: double if the other stands on its own land under its castle. */
function rate(state: GameState, other: Host, at: number): number {
  const { army, castleArmy } = state.rules.combat
  const defends = state.owner[at] === other.owner
  return defends && walled(state, at, other.owner) ? castleArmy : army
}

/** Whether an army is in another lord's land, taking it: it is there, and no longer on its road. */
const intrudes = (a: Host, lord: number) => a.target === lord && !marching(a)

/**
 * The way between two armies over the land, round what stands between them
 * (« si le milieu a vol d'oiseau est obstrué il faut contourné »): the
 * shortest by the land's tiles, the high mountains, the sea and the dead
 * land closed, if it is no more than twice as long as the straight line
 * (« Oui »); none else, the two then pass each other by, as across the sea.
 * From the first army to the second, both ends in.
 */
export function wayBetween(
  state: GameState,
  from: number,
  to: number,
): Array<number> | null {
  const { grid } = state
  const most = 2 * isqrt(apart(grid, from, to))
  if (from === to) return [from]
  const before = new Map<number, number>([[from, -1]])
  /** The land one step further than a ring, each tile seen once. */
  const beyond = (ring: Array<number>) =>
    ring.flatMap((t) =>
      around(grid, t).filter((n) => {
        if (before.has(n) || !grid.land[n]) return false
        before.set(n, t)
        return true
      }),
    )
  let ring = [from]
  for (let step = 1; step <= most && ring.length > 0; step++) {
    ring = beyond(ring)
    if (before.has(to)) return wayBack(before, to)
  }
  return null
}

/** The way walked back from a tile to where the search began, then turned to run from there. */
function wayBack(before: Map<number, number>, to: number): Array<number> {
  const way = [to]
  for (let at = before.get(to) ?? -1; at >= 0; at = before.get(at) ?? -1)
    way.push(at)
  return way.reverse()
}

/** Two armies that fight: near enough, a way over the land between them no more than twice the straight line, and one of them in the land of the other's lord, taking it; any other army passes by, so that none is drawn into a war it was not sent to. */
export function meet(state: GameState, a: Host, b: Host): boolean {
  if (a.owner === b.owner || isAllied(state, a.owner, b.owner)) return false
  if (!intrudes(a, b.owner) && !intrudes(b, a.owner)) return false
  const reach = state.rules.meetTiles
  const [p, q] = [positionOf(a), positionOf(b)]
  return (
    apart(state.grid, p, q) <= reach * reach && wayBetween(state, p, q) !== null
  )
}

/** Ticks two armies take to walk to each other, each going half the way between them. */
function closingOf(state: GameState, a: Host, b: Host): number {
  const way = wayBetween(state, positionOf(a), positionOf(b))
  const tiles = way ? way.length - 1 : 0
  return Math.ceil((tiles * 1000) / 2 / state.rules.marchPace)
}

/** The blows of a tick between two armies come to grips: each loses as the combat table says. */
function blows(state: GameState, a: Host, b: Host) {
  const blow = Math.max(
    UNIT,
    Math.floor(Math.min(a.men, b.men) / state.rules.battleTicks),
  )
  const lossA = Math.floor((blow * rate(state, b, positionOf(b))) / 100)
  const lossB = Math.floor((blow * rate(state, a, positionOf(a))) / 100)
  a.men = Math.max(0, a.men - lossA)
  b.men = Math.max(0, b.men - lossB)
}

/** A tick of every battle: the armies that meet stand and walk to each other, then fight. */
export function clash(state: GameState): void {
  for (const host of state.hosts) host.fighting = false
  const { hosts } = state
  hosts.forEach((a, i) => {
    for (const b of hosts.slice(i + 1)) {
      if (a.men === 0 || b.men === 0 || !meet(state, a, b)) continue
      a.fighting = true
      b.fighting = true
      const close = closingOf(state, a, b)
      if (a.closing < 0) a.closing = close
      if (b.closing < 0) b.closing = close
      if (a.closing === 0 && b.closing === 0) blows(state, a, b)
    }
  })
  // The armies walking to a battle come a tick nearer; those with no enemy upon them have none to meet.
  for (const host of hosts)
    host.closing = host.fighting ? Math.max(0, host.closing - 1) : -1
}
