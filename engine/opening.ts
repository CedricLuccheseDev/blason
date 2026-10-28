import { drawInt } from './numbers'
import { apart, around } from './grid'
import { capOf, setOwner } from './land'
import { NEUTRAL } from './types'
import type { GameState } from './types'

// The opening. For its first seconds no land is anyone's: each lord plants
// his standard on a free domain and may move it as often as he likes. When
// the count ends each receives his standard's domain whole, its village with
// it, and who planted none is given one. The first to plant holds a domain:
// no other standard may stand on it, nor on a domain touching it.

/** The domains bordering each domain, read once from the land shared out. */
const borders = new WeakMap<Array<number>, Map<number, Set<number>>>()

function bordersOf(state: GameState): Map<number, Set<number>> {
  const known = borders.get(state.realm)
  if (known) return known
  const found = new Map<number, Set<number>>()
  state.realm.forEach((realm, tile) => {
    if (realm < 0) return
    for (const n of around(state.grid, tile)) {
      const other = state.realm[n]
      if (other < 0 || other === realm) continue
      const set = found.get(realm) ?? new Set<number>()
      set.add(other)
      found.set(realm, set)
    }
  })
  borders.set(state.realm, found)
  return found
}

/** Whether a lord has planted his standard. */
export function hasPicked(state: GameState, player: number): boolean {
  return state.players[player].standard >= 0
}

/** The domains the standards stand on, of all lords or all but one. */
export function standards(state: GameState, but = -1): Array<number> {
  return state.players.flatMap((p, id) =>
    id !== but && p.standard >= 0 ? [p.standard] : [],
  )
}

/** Whether a lord may plant his standard on the free domain of this tile: no other lord's standard on it, nor on a domain touching it. */
export function canStart(
  state: GameState,
  player: number,
  tile: number,
): boolean {
  const realm = state.realm[tile]
  if (realm < 0 || !state.villages.includes(realm)) return false
  const near = bordersOf(state).get(realm)
  return standards(state, player).every((s) => s !== realm && !near?.has(s))
}

/** During the opening a lord plants his standard, or moves it, on a free domain. */
export function pickStart(state: GameState, player: number, tile: number) {
  if (canStart(state, player, tile))
    state.players[player].standard = state.realm[tile]
}

/** The free domain farthest from the standards planted, for a lord who planted none. */
function farthest(state: GameState, player: number): number {
  const planted = standards(state)
  let best = -1
  let score = -1
  for (const v of state.villages) {
    if (!canStart(state, player, v)) continue
    const near = planted.reduce(
      (m, o) => Math.min(m, apart(state.grid, o, v)),
      1e12,
    )
    const s = near * 16 + drawInt(state.seed, 16, 'start', player, v)
    if (s > score) {
      score = s
      best = v
    }
  }
  return best
}

/** A lord settles on his standard's domain, all of it, its village his, his peasants at the full. */
function settle(state: GameState, player: number, realm: number): void {
  state.realm.forEach((r, t) => {
    if (r === realm && state.owner[t] === NEUTRAL) setOwner(state, t, player)
  })
  state.works.push({ work: 'village', tile: realm, owner: player })
  state.players[player].peasants = capOf(state, player)
}

/** At the end of the opening: who planted nothing is given the free domain farthest from all; then each lord receives his standard's domain, and the free villages are gone. */
export function grantStarts(state: GameState): void {
  state.players.forEach((lord, id) => {
    if (lord.standard < 0) lord.standard = farthest(state, id)
  })
  state.players.forEach((lord, id) => {
    if (lord.standard >= 0) settle(state, id, lord.standard)
  })
  // What no lord holds is now one free land, held by its villagers.
  state.villages = []
}
