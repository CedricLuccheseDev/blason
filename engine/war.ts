import { UNIT } from './units'
import { isqrt } from './numbers'
import { around } from './grid'
import { holdOf, setOwner } from './land'
import { NEUTRAL } from './types'
import { pop, push } from './heap'
import { walled } from './battle'
import { disband, hired } from './armies'
import { costOf, marching, menFor, paceOf, passable } from './muster'
import { courseFor, wideOf } from './course'
import type { Army } from './rules'
import type { GameState, Host } from './types'

// The war. A click raises an army out of the lord's peasants at one of his
// free villages, or hires mercenaries for gold at one of his free markets
// (muster.ts); it marches over his land and his allies' (so that a lord met
// only beyond an ally may be struck), seen by all, to the border tile that
// brings it soonest to the click, the march and the way through the enemy's
// land counted (course.ts), then enters there and spreads as a bulge moving
// towards the click, a few tiles a tick whatever its size:
// more men take it further, never faster. Each tile is held by its share of
// its lord's peasants, or its militia when free, and costs the attacker as
// the combat table says: a soldier is worth two peasants, one under a castle.
// An army fights until it cannot pay for the next tile; with nothing left to
// take, its survivors go home to the peasants, the mercenaries their way
// (armies.ts). Two enemy armies that meet fight a battle first (battle.ts).

/**
 * The order an army takes tiles in: from where it entered, twice as fast
 * towards the click as to the sides, within its band (inBand), so its front
 * is a wall moving on, not a thread. Distances in tenths of a tile.
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

/**
 * Whether a tile lies in the army's band: near enough the line from where it
 * entered towards the click, as wide as its men. An army pushes on along its
 * line, past the click while it has men, and never swells into a ball.
 */
function inBand(state: GameState, host: Host, tile: number): boolean {
  const w = state.grid.width
  const dx = (tile % w) - (host.entry % w)
  const dy = Math.floor(tile / w) - Math.floor(host.entry / w)
  const ax = (host.aim % w) - (host.entry % w)
  const ay = Math.floor(host.aim / w) - Math.floor(host.entry / w)
  const length = ax * ax + ay * ay
  if (length === 0) return dx * dx + dy * dy <= host.wide * host.wide
  const across = dx * ay - dy * ax
  return across * across <= host.wide * host.wide * length
}

/** Whether a tile borders land the lord's armies walk: his own, or an ally's, through which they go to strike beyond it. */
function touches(state: GameState, player: number, tile: number) {
  return around(state.grid, tile).some((t) => passable(state, player, t))
}

/** Whether a tile is the army's to strike: its target's, or free. */
const struck = (state: GameState, target: number, tile: number) =>
  state.owner[tile] === target

/** A click: an army raised at one of the lord's free villages, or mercenaries hired at one of his free markets, marching by the course that brings it soonest to strike the clicked tile's lord or free domain. */
export function attack(
  state: GameState,
  player: number,
  tile: number,
  army: Army,
): void {
  if (!state.players[player].alive) return
  const course = courseFor(state, player, tile, army)
  if (!course) return
  const men = menFor(state, player, army)
  if (men < UNIT || course.from < 0) return
  const lord = state.players[player]
  if (!hired(state, army)) lord.peasants -= men
  lord.gold -= costOf(state, men, army)
  const { entry, from, road } = course
  state.hosts.push({
    owner: player,
    army,
    target: state.owner[tile],
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
    wide: wideOf(state, men),
  })
}

/** A tile taken: its new lord, and its work; a free one, a little gold. */
function take(state: GameState, host: Host, tile: number) {
  if (state.owner[tile] === NEUTRAL)
    state.players[host.owner].gold += state.rules.neutralGold
  for (const work of state.works)
    if (work.tile === tile) work.owner = host.owner
  setOwner(state, tile, host.owner)
  for (const t of around(state.grid, tile))
    if (struck(state, host.target, t) && inBand(state, host, t))
      push(host.queue, [priority(state, host, t), t])
}

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

/** The tiles an army may take this tick: the front's pace at its army's speed, the fraction carried tick to tick. */
function strideOf(state: GameState, host: Host): number {
  const per = state.rules.paceTiles * state.rules.armySpeed[host.army]
  const t = state.tick - host.departs
  return Math.floor(((t + 1) * per) / 100) - Math.floor((t * per) / 100)
}

/** One tick of an army: it takes the next tiles it can pay for, a few at most. */
function march(state: GameState, host: Host) {
  const taken: Array<number> = []
  const stride = strideOf(state, host)
  while (taken.length < stride && host.men > 0) {
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
    Math.floor((host.along + paceOf(state, host)) / 1000),
  )
  for (let i = Math.floor(host.along / 1000) + 1; i <= next; i++) {
    const tile = host.road[i]
    const owner = state.owner[tile]
    // Its own land and its allies' it walks; an ally turned away on the road sends it home.
    if (passable(state, host.owner, tile)) continue
    if (owner === host.target) {
      host.road = host.road.slice(0, i)
      host.along = (host.road.length - 1) * 1000
      host.entry = tile
      host.queue = [[0, tile]]
      return
    }
    disband(state, host)
    return
  }
  host.along = Math.min(
    (host.road.length - 1) * 1000,
    host.along + paceOf(state, host),
  )
}

/** An army of the lord's called home, by the village or market it left from (« une croix pour les rappeler »): its survivors back to his peasants, the mercenaries their way. */
export function recall(state: GameState, lord: number, from: number): void {
  const host = state.hosts.find((h) => h.owner === lord && h.from === from)
  if (host) disband(state, host)
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
    disband(state, host)
  }
  state.hosts = state.hosts.filter((host) => host.men > 0)
}
