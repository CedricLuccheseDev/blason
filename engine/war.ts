import { UNIT } from './units'
import { isqrt } from './numbers'
import { apart, around } from './grid'
import { isAllied, isFelon } from './diplomacy'
import { density, setOwner } from './land'
import { NEUTRAL } from './types'
import type { Army } from './rules'
import type { GameState, Host } from './types'

// The war, as in OpenFront: an army spreads into another's land a few tiles
// at a time, and its frontier moves smoothly. A click raises it out of the
// lord's peasants, paid in gold; it enters by the border tile nearest the
// click and spreads from there as a bulge moving towards it, a few tiles a
// tick whatever its size: more men take it further, never faster.
// Each tile costs the men holding it: its share of its lord's peasants
// (three times more under a castle), or its militia when free. An army
// fights until it cannot pay for the next tile; with nothing left to take,
// its survivors go home to the peasants.

type Item = [number, number]

function before(a: Item, b: Item) {
  return a[0] < b[0] || (a[0] === b[0] && a[1] < b[1])
}

function swap(heap: Array<Item>, a: number, b: number) {
  const item = heap[a]
  heap[a] = heap[b]
  heap[b] = item
}

/** A heap of [priority, tile], the smallest first, ties by tile. */
function push(heap: Array<Item>, item: Item) {
  heap.push(item)
  let i = heap.length - 1
  while (i > 0) {
    const up = (i - 1) >> 1
    if (!before(heap[i], heap[up])) break
    swap(heap, i, up)
    i = up
  }
}

function pop(heap: Array<Item>): Item | undefined {
  const top = heap.at(0)
  const last = heap.pop()
  if (!top || !last || heap.length === 0) return top
  heap[0] = last
  let i = 0
  for (;;) {
    const l = 2 * i + 1
    let m = i
    if (l < heap.length && before(heap[l], heap[m])) m = l
    if (l + 1 < heap.length && before(heap[l + 1], heap[m])) m = l + 1
    if (m === i) return top
    swap(heap, i, m)
    i = m
  }
}

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

/** Whether a tile is the army's to strike: its target's, and against free land, of its domain. */
function struck(state: GameState, target: number, realm: number, tile: number) {
  if (state.owner[tile] !== target) return false
  return target !== NEUTRAL || state.realm[tile] === realm
}

/** Where an army against the tile's lord, or its free domain, enters: its tile bordering mine nearest the tile, or -1. */
export function entryFor(state: GameState, player: number, tile: number) {
  const target = state.owner[tile]
  if (target === player || target < NEUTRAL) return -1
  if (target >= 0 && isAllied(state, player, target)) return -1
  const realm = state.realm[tile]
  let best = -1
  let gap = Infinity
  state.owner.forEach((_, t) => {
    if (!struck(state, target, realm, t) || !touches(state, player, t)) return
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

/**
 * A click: an army raised and paid, entering the clicked tile's lord's land
 * at the border nearest it. If that lord's armies are striking the player's
 * land, they meet first, man for man, as in OpenFront.
 */
export function attack(
  state: GameState,
  player: number,
  tile: number,
  army: Army,
): void {
  if (!state.players[player].alive) return
  const entry = entryFor(state, player, tile)
  if (entry < 0) return
  let men = menFor(state, player, army)
  if (men < UNIT) return
  const lord = state.players[player]
  lord.peasants -= men
  lord.gold -= costOf(state, men)
  const target = state.owner[tile]
  for (const host of state.hosts) {
    if (host.owner !== target || host.target !== player || men === 0) continue
    const met = Math.min(host.men, men)
    host.men -= met
    men -= met
  }
  if (men === 0) return
  state.hosts.push({
    owner: player,
    target,
    men,
    aim: tile,
    entry,
    realm: target === NEUTRAL ? state.realm[tile] : -1,
    departs: state.tick,
    queue: [[0, entry]],
    edge: [],
  })
}

/** The men holding a tile: its lord's share of his peasants, more under his castle; or its militia, more round a free village. */
export function holdOf(state: GameState, tile: number): number {
  const owner = state.owner[tile]
  const { rules, grid } = state
  if (owner === NEUTRAL) {
    const r = rules.villageRadius
    const near = state.villages.some((v) => apart(grid, v, tile) <= r * r)
    return near ? rules.villageMilitia : rules.militia
  }
  const r = rules.castleRadius
  const walled = state.works.some(
    (w) =>
      w.owner === owner &&
      w.work === 'castle' &&
      apart(grid, w.tile, tile) <= r * r,
  )
  const walls = walled ? rules.castleHold : 100
  const mark = isFelon(state, owner) ? rules.felonHold : 100
  return Math.floor((density(state, owner) * walls * mark) / 10000)
}

/** A tile taken: its new lord, its free village's gold and its work. */
function take(state: GameState, host: Host, tile: number) {
  const was = state.owner[tile]
  if (was === NEUTRAL && state.villages.includes(tile)) {
    state.villages = state.villages.filter((v) => v !== tile)
    state.players[host.owner].gold += state.rules.villageGold * UNIT
    state.works.push({ work: 'village', tile, owner: host.owner })
  }
  for (const work of state.works)
    if (work.tile === tile) work.owner = host.owner
  setOwner(state, tile, host.owner)
  for (const t of around(state.grid, tile))
    if (struck(state, host.target, host.realm, t))
      push(host.queue, [priority(state, host, t), t])
}

/** One tick of an army: it takes the next tiles it can pay for, a few at most. */
function march(state: GameState, host: Host) {
  const taken: Array<number> = []
  while (taken.length < state.rules.paceTiles && host.men > 0) {
    const next = pop(host.queue)
    if (!next) break
    const tile = next[1]
    const ours = struck(state, host.target, host.realm, tile)
    if (!ours || !touches(state, host.owner, tile)) continue
    const cost = holdOf(state, tile)
    const lord = host.target === NEUTRAL ? null : state.players[host.target]
    // Not enough to take it: the last men fall there, and as many of its own.
    const paid = Math.min(cost, host.men)
    if (lord) lord.peasants = Math.max(0, lord.peasants - paid)
    host.men -= paid
    if (paid < cost) break
    take(state, host, tile)
    taken.push(tile)
  }
  if (taken.length) host.edge = [...taken, ...host.edge].slice(0, 9)
}

/** The armies a tick further; an army with nothing left to take goes home. */
export function advanceHosts(state: GameState): void {
  for (const host of state.hosts) {
    if (host.men === 0) continue
    march(state, host)
    if (host.men === 0 || host.queue.length > 0) continue
    state.players[host.owner].peasants += host.men
    host.men = 0
  }
  state.hosts = state.hosts.filter((host) => host.men > 0)
}
