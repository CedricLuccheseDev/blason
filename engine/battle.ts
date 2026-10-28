import { UNIT } from './units'
import { isqrt } from './numbers'
import { apart, overLand } from './grid'
import { standing } from './land'
import { isAllied } from './diplomacy'
import { marching, positionOf } from './muster'
import type { GameState, Host } from './types'

// The battles: an army in a lord's land, taking it, and an army of that lord
// that come near each other over land (any other army passes by, so that none is drawn
// into a war it was not sent to) stop,
// walk to meet halfway, which takes them as long as the way, then fight
// there, and neither moves on until one is gone. An even battle lasts a few
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

/** Two armies that fight: near enough, with no sea between them, and one of them in the land of the other's lord, taking it; any other army passes by, so that none is drawn into a war it was not sent to. */
export function meet(state: GameState, a: Host, b: Host): boolean {
  if (a.owner === b.owner || isAllied(state, a.owner, b.owner)) return false
  if (!intrudes(a, b.owner) && !intrudes(b, a.owner)) return false
  const reach = state.rules.meetTiles
  const [p, q] = [positionOf(a), positionOf(b)]
  return apart(state.grid, p, q) <= reach * reach && overLand(state.grid, p, q)
}

/** Ticks two armies so far apart take to walk to each other, each going half the way. */
function closingOf(state: GameState, a: Host, b: Host): number {
  const thousandths = isqrt(
    apart(state.grid, positionOf(a), positionOf(b)) * 1_000_000,
  )
  return Math.ceil(thousandths / 2 / state.rules.marchPace)
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
