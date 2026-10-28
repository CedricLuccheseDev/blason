import { TICKS_PER_SECOND, UNIT } from './units'
import { drawInt } from './numbers'
import { apart, around } from './grid'
import { RULES } from './rules'
import { isFelon } from './diplomacy'
import { rebelled } from './scars'
import { NEUTRAL, NO_ONE, SEA } from './types'
import type { Rules } from './rules'
import type { GameState, Grid } from './types'

// The land, its peasants and its gold. At the start the whole land is
// shared out into free domains, each round its village, with its border:
// there is no empty land and no hole, every tile is taken by a fight, a
// domain at a time. Each lord starts on one of them. A lord's peasants live
// on his land and hold it; his gold pays the men he raises from them.

/** Free villages, one for so many tiles, none too near another: drawn from the seed. */
function scatterVillages(grid: Grid, seed: string, rules: Rules) {
  const count = Math.max(1, Math.floor(grid.area / rules.villageEvery))
  // Two villages stand at least about the side of a village's share apart.
  const spread = Math.floor((rules.villageEvery * 6) / 10)
  const order = grid.land
    .flatMap((land, tile) => (land ? [tile] : []))
    .map((tile) => ({ tile, key: drawInt(seed, 1_000_000, 'village', tile) }))
    .sort((a, b) => a.key - b.key || a.tile - b.tile)
  const chosen: Array<number> = []
  for (const { tile } of order) {
    if (chosen.length >= count) break
    if (chosen.every((c) => apart(grid, c, tile) >= spread)) chosen.push(tile)
  }
  return chosen
}

/** The land shared out between the villages: each tile to the village whose land reaches it first, walking from all at once. */
function domains(grid: Grid, villages: Array<number>): Array<number> {
  const realm = grid.land.map(() => -1)
  const queue = [...villages]
  for (const v of villages) realm[v] = v
  for (const t of queue)
    for (const n of around(grid, t)) {
      if (!grid.land[n] || realm[n] >= 0) continue
      realm[n] = realm[t]
      queue.push(n)
    }
  return realm
}

/** A new game: the land shared out into free domains, held by their militia round their villages; each lord a little gold. */
export function createGame(
  grid: Grid,
  players: number,
  seed: string,
  rules: Rules = RULES,
): GameState {
  const villages = scatterVillages(grid, seed, rules)
  const realm = domains(grid, villages)
  // Land no village reaches, an islet cut off by the sea, is no part of the
  // game: no army could ever take it, so it does not count in the share
  // that wins either.
  const land = grid.land.map((on, tile) => on && realm[tile] >= 0)
  const reached = { ...grid, land, area: land.filter(Boolean).length }
  return {
    seed,
    rules,
    grid: reached,
    tick: 0,
    owner: land.map((on) => (on ? NEUTRAL : SEA)),
    realm,
    villages,
    works: [],
    players: Array.from({ length: players }, () => ({
      peasants: 0,
      gold: rules.startGold * UNIT,
      alive: true,
      felonUntil: 0,
      tiles: 0,
      coups: {},
    })),
    hosts: [],
    alliances: [],
    requests: [],
    caravans: [],
    strikes: [],
    scars: [],
    winner: NO_ONE,
  }
}

/** The works of a kind a lord holds. */
export function worksOf(state: GameState, lord: number, work: string) {
  return state.works.filter((w) => w.owner === lord && w.work === work).length
}

/** Whether a work stands done and serves: one being built does nothing yet. */
export const standing = (state: GameState, work: GameState['works'][number]) =>
  (work.ready ?? 0) <= state.tick

/** The peasants a lord's villages feed, those built: so many each; the land alone feeds none. */
export function capOf(state: GameState, lord: number): number {
  const villages = state.works.filter(
    (w) => w.owner === lord && w.work === 'village' && standing(state, w),
  ).length
  return state.rules.peasants.village * villages * UNIT
}

/** The men holding each of a lord's tiles: his peasants spread over his land. */
export function density(state: GameState, lord: number): number {
  const { peasants, tiles } = state.players[lord]
  return Math.floor(peasants / Math.max(1, tiles))
}

/** The peasants a lord loses a tick to sickness: so much of those over what his villages feed, one at least while any are. */
export function sicknessOf(state: GameState, lord: number): number {
  const over = state.players[lord].peasants - capOf(state, lord)
  if (over <= 0 || state.rules.sickness === 0) return 0
  const lost = (over * state.rules.sickness) / 100 / TICKS_PER_SECOND
  return Math.min(over, Math.max(UNIT, Math.floor(lost)))
}

/**
 * Each tick, peasants born up to what a lord's villages feed; those over it,
 * a village lost or an army come home, fall sick and die away. Gold comes
 * only by the merchants (caravans.ts).
 */
export function grow(state: GameState): void {
  state.players.forEach((lord, id) => {
    if (!lord.alive) return
    const cap = capOf(state, id)
    lord.peasants -= sicknessOf(state, id)
    if (lord.peasants >= cap) return
    const born = Math.floor(cap / (state.rules.fillSeconds * TICKS_PER_SECOND))
    lord.peasants = Math.min(cap, lord.peasants + born)
  })
}

/** A tile changes hands, its lords' counts with it. */
export function setOwner(state: GameState, tile: number, owner: number) {
  const was = state.owner[tile]
  if (was >= 0) state.players[was].tiles--
  if (owner >= 0) state.players[owner].tiles++
  state.owner[tile] = owner
}

/** Whether a lord holds land yet. */
export function hasPicked(state: GameState, player: number): boolean {
  return state.players[player].tiles > 0
}

/** The domains no lord may start on any more, read once a tick: any of whose land is taken or borders a lord. */
const closed = new WeakMap<GameState, { tick: number; realms: Set<number> }>()

function closedRealms(state: GameState): Set<number> {
  const known = closed.get(state)
  if (known && known.tick === state.tick) return known.realms
  const realms = new Set<number>()
  state.owner.forEach((o, t) => {
    if (o < 0) return
    realms.add(state.realm[t])
    for (const n of around(state.grid, t)) realms.add(state.realm[n])
  })
  closed.set(state, { tick: state.tick, realms })
  return realms
}

/** Whether a lord may start on the free domain of this tile: none of it taken, none of it bordering a lord. */
export function canStart(state: GameState, tile: number): boolean {
  const realm = state.realm[tile]
  if (state.owner[tile] !== NEUTRAL || realm < 0) return false
  return !closedRealms(state).has(realm)
}

/** A lord settles on a free domain, all of it, its village his, his peasants at the full. */
function settle(state: GameState, player: number, tile: number): void {
  const realm = state.realm[tile]
  state.realm.forEach((r, t) => {
    if (r === realm && state.owner[t] === NEUTRAL) setOwner(state, t, player)
  })
  state.villages = state.villages.filter((v) => v !== realm)
  state.works.push({ work: 'village', tile: realm, owner: player })
  state.players[player].peasants = capOf(state, player)
  closed.delete(state)
}

/** During the opening, first come, first served. */
export function pickStart(state: GameState, player: number, tile: number) {
  if (hasPicked(state, player) || !canStart(state, tile)) return
  settle(state, player, tile)
}

/** At the end of the opening, who picked nothing gets the free domain farthest from all; then the free villages are gone. */
export function assignMissingStarts(state: GameState): void {
  state.players.forEach((_, id) => {
    if (hasPicked(state, id)) return
    const taken = state.owner.flatMap((o, t) => (o >= 0 ? [t] : []))
    let best = -1
    let score = -1
    for (const v of state.villages) {
      if (!canStart(state, v)) continue
      const near = taken.reduce(
        (m, o) => Math.min(m, apart(state.grid, o, v)),
        1e12,
      )
      const s = near * 16 + drawInt(state.seed, 16, 'start', id, v)
      if (s > score) {
        score = s
        best = v
      }
    }
    if (best >= 0) settle(state, id, best)
  })
  // The opening over, the free domains and their villages are gone: what
  // no lord holds is one free land, held by its villagers.
  state.villages = []
}

/** The men holding a free tile: so many in a hundred of what holds the mean lord's tile, never under the floor. */
function neutralHold(state: GameState): number {
  const lords = state.players.filter((p) => p.alive && p.tiles > 0)
  if (lords.length === 0) return 0
  const peasants = lords.reduce((sum, p) => sum + p.peasants, 0)
  const tiles = lords.reduce((sum, p) => sum + p.tiles, 0)
  const half = Math.floor((peasants * state.rules.neutralHold) / 100 / tiles)
  return Math.max(state.rules.neutralFloor, half)
}

/** The men holding a tile: its lord's share of his peasants, half as many while he is a traitor; on free land, half what holds a lord's, more where rebels hold it. */
export function holdOf(state: GameState, tile: number): number {
  const owner = state.owner[tile]
  const { rules } = state
  if (owner === NEUTRAL)
    return rebelled(state, tile)
      ? Math.floor((neutralHold(state) * rules.rebelHold) / 100)
      : neutralHold(state)
  const mark = isFelon(state, owner) ? rules.felonHold : 100
  return Math.floor((density(state, owner) * mark) / 100)
}
