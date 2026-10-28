import { UNIT } from './units'
import { apart } from './grid'
import { isAllied } from './diplomacy'
import { positionOf } from './muster'
import type { GameState, Host } from './types'

// The battles: two enemy armies that come near each other fight where they
// meet, and neither moves on until one is gone. An even battle lasts a few
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
      apart(state.grid, w.tile, tile) <= r * r,
  )
}

/** What an army loses for each man of the other, in percent: double if the other stands on its own land under its castle. */
function rate(state: GameState, other: Host, at: number): number {
  const { army, castleArmy } = state.rules.combat
  const defends = state.owner[at] === other.owner
  return defends && walled(state, at, other.owner) ? castleArmy : army
}

/** Two enemy armies near enough to fight. */
function meet(state: GameState, a: Host, b: Host): boolean {
  if (a.owner === b.owner || isAllied(state, a.owner, b.owner)) return false
  const reach = state.rules.meetTiles
  return apart(state.grid, positionOf(a), positionOf(b)) <= reach * reach
}

/** A tick of every battle: the armies that meet fight and stand still. */
export function clash(state: GameState): void {
  for (const host of state.hosts) host.fighting = false
  const { hosts } = state
  for (let i = 0; i < hosts.length; i++)
    for (let j = i + 1; j < hosts.length; j++) {
      const [a, b] = [hosts[i], hosts[j]]
      if (a.men === 0 || b.men === 0 || !meet(state, a, b)) continue
      a.fighting = true
      b.fighting = true
      const blow = Math.max(
        UNIT,
        Math.floor(Math.min(a.men, b.men) / state.rules.battleTicks),
      )
      const lossA = Math.floor((blow * rate(state, b, positionOf(b))) / 100)
      const lossB = Math.floor((blow * rate(state, a, positionOf(a))) / 100)
      a.men = Math.max(0, a.men - lossA)
      b.men = Math.max(0, b.men - lossB)
    }
}
