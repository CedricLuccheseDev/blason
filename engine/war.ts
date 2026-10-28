import { UNIT } from './units'
import { isqrt } from './numbers'
import { apart, around } from './grid'
import { isAllied, isFelon } from './diplomacy'
import { density, setOwner } from './land'
import { NEUTRAL } from './types'
import { pop, push } from './heap'
import { walled } from './battle'
import { freeVillages, marching, roadTo } from './muster'
import type { Army } from './rules'
import type { GameState, Host } from './types'

// The war. A click raises an army out of the lord's peasants at his free
// village nearest the front (muster.ts); it marches there over his land,
// seen by all, then enters by the border tile nearest the click and spreads
// from there as a bulge moving towards it, a tile a tick whatever its size:
// more men take it further, never faster. Each tile is held by its share of
// its lord's peasants, or its militia when free, and costs the attacker as
// the combat table says: a soldier is worth two peasants, one under a castle.
// An army fights until it cannot pay for the next tile; with nothing left to
// take, its survivors go home to the peasants. Two enemy armies that meet
// fight a battle first (battle.ts).

/**
 * The order an army takes tiles in: it spreads as an egg from where it
 * entered, twice as fast towards the click as to the sides, so its front is
 * a bulge moving on, not a thread. Distances in tenths of a tile.
 */
function priority(
  state: GameState,
  host: Pick<Host, 'entry' | 'aim'>,
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
  return 2 * reach - ahead
}

/** Whether a tile borders the lord's land. */
function touches(state: GameState, player: number, tile: number) {
  return around(state.grid, tile).some((t) => state.owner[t] === player)
}

/** Whether a tile is the army's to strike: its target's, or free. */
const struck = (state: GameState, target: number, tile: number) =>
  state.owner[tile] === target

/** Where an army against the tile's lord, or the free land, enters: its tile bordering mine nearest the tile, or -1. */
export function entryFor(state: GameState, player: number, tile: number) {
  const target = state.owner[tile]
  if (target === player || target < NEUTRAL) return -1
  if (target >= 0 && isAllied(state, player, target)) return -1
  let best = -1
  let gap = Infinity
  state.owner.forEach((_, t) => {
    if (!struck(state, target, t) || !touches(state, player, t)) return
    const d = apart(state.grid, t, tile)
    if (d < gap) {
      gap = d
      best = t
    }
  })
  return best
}

/** The men an army would take now: its share of the peasants, as many as the gold pays. */
export function menFor(state: GameState, player: number, army: Army): number {
  const lord = state.players[player]
  const share = Math.floor((lord.peasants * state.rules.armies[army]) / 100)
  const { menPrice } = state.rules
  if (menPrice === 0) return share
  return Math.min(share, Math.floor((lord.gold * UNIT) / menPrice))
}

/** What so many men cost, in thousandths of gold. */
export function costOf(state: GameState, men: number): number {
  return Math.floor((men * state.rules.menPrice) / UNIT)
}

/** A click: an army raised at the lord's free village nearest the front, marching there to strike the clicked tile's lord or free domain. */
export function attack(
  state: GameState,
  player: number,
  tile: number,
  army: Army,
): void {
  if (!state.players[player].alive) return
  const entry = entryFor(state, player, tile)
  if (entry < 0) return
  const men = menFor(state, player, army)
  if (men < UNIT) return
  let from = -1
  let road: Array<number> | null = null
  for (const village of freeVillages(state, player, entry)) {
    road = roadTo(state, player, village, entry)
    if (road) {
      from = village
      break
    }
  }
  if (!road) return
  const lord = state.players[player]
  lord.peasants -= men
  lord.gold -= costOf(state, men)
  const target = state.owner[tile]
  state.hosts.push({
    owner: player,
    target,
    men,
    aim: tile,
    entry,
    departs: state.tick,
    queue: [[0, entry]],
    edge: [],
    from,
    road,
    along: 0,
    fighting: false,
    closing: -1,
  })
}

/** The men holding a free tile: so many in a hundred of what holds the mean lord's tile. */
function neutralHold(state: GameState): number {
  const standing = state.players.filter((p) => p.alive && p.tiles > 0)
  if (standing.length === 0) return 0
  const peasants = standing.reduce((sum, p) => sum + p.peasants, 0)
  const tiles = standing.reduce((sum, p) => sum + p.tiles, 0)
  return Math.floor((peasants * state.rules.neutralHold) / 100 / tiles)
}

/** The men holding a tile: its lord's share of his peasants, half as many while he is a traitor; on free land, half what holds a lord's. */
export function holdOf(state: GameState, tile: number): number {
  const owner = state.owner[tile]
  const { rules } = state
  if (owner === NEUTRAL) return neutralHold(state)
  const mark = isFelon(state, owner) ? rules.felonHold : 100
  return Math.floor((density(state, owner) * mark) / 100)
}

/** A tile taken: its new lord, and its work; a free one, a little gold. */
function take(state: GameState, host: Host, tile: number) {
  if (state.owner[tile] === NEUTRAL)
    state.players[host.owner].gold += state.rules.neutralGold
  for (const work of state.works)
    if (work.tile === tile) work.owner = host.owner
  setOwner(state, tile, host.owner)
  for (const t of around(state.grid, tile))
    if (struck(state, host.target, t))
      push(host.queue, [priority(state, host, t), t])
}

/** One tick of an army: it takes the next tiles it can pay for, a few at most. */
/**
 * The army fights for a tile: a soldier is worth two peasants, one under the
 * castle of the tile's lord. Whether it took it; if not, its last men fell
 * there, and their worth of its holders.
 */
function fight(state: GameState, host: Host, tile: number): boolean {
  const held = holdOf(state, tile)
  const { castle, peasants } = state.rules.combat
  const rate = walled(state, tile, host.target) ? castle : peasants
  const cost = Math.floor((held * rate) / 100)
  const paid = Math.min(cost, host.men)
  const killed = rate === 0 ? held : Math.floor((paid * 100) / rate)
  if (host.target !== NEUTRAL) {
    const lord = state.players[host.target]
    lord.peasants = Math.max(0, lord.peasants - killed)
  }
  host.men -= paid
  return paid === cost
}

function march(state: GameState, host: Host) {
  const taken: Array<number> = []
  while (taken.length < state.rules.paceTiles && host.men > 0) {
    const next = pop(host.queue)
    if (!next) break
    const tile = next[1]
    const ours = struck(state, host.target, tile)
    if (!ours || !touches(state, host.owner, tile)) continue
    if (!fight(state, host, tile)) break
    take(state, host, tile)
    taken.push(tile)
  }
  if (taken.length) host.edge = [...taken, ...host.edge].slice(0, 9)
}

/**
 * An army on its road a tick further. Its road cut by the lord it marches
 * on, it strikes him from where it stands; cut by anyone else, it goes home.
 */
function walk(state: GameState, host: Host) {
  const next = Math.min(
    host.road.length - 1,
    Math.floor((host.along + state.rules.marchPace) / 1000),
  )
  for (let i = Math.floor(host.along / 1000) + 1; i <= next; i++) {
    const tile = host.road[i]
    const owner = state.owner[tile]
    if (owner === host.owner) continue
    if (owner === host.target) {
      host.road = host.road.slice(0, i)
      host.along = (host.road.length - 1) * 1000
      host.entry = tile
      host.queue = [[0, tile]]
      return
    }
    state.players[host.owner].peasants += host.men
    host.men = 0
    return
  }
  host.along = Math.min(
    (host.road.length - 1) * 1000,
    host.along + state.rules.marchPace,
  )
}

/** The armies a tick further: those in battle stand, the others march to the front or strike there; an army with nothing left to take goes home. */
export function advanceHosts(state: GameState): void {
  for (const host of state.hosts) {
    if (host.men === 0 || host.fighting) continue
    if (marching(host)) {
      walk(state, host)
      continue
    }
    march(state, host)
    if (host.men === 0 || host.queue.length > 0) continue
    state.players[host.owner].peasants += host.men
    host.men = 0
  }
  state.hosts = state.hosts.filter((host) => host.men > 0)
}
