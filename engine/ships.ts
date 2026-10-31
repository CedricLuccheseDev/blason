import { isAllied, warsOf } from './diplomacy'
import { apart, eachAround } from './grid'
import { drawInt } from './numbers'
import { standing } from './land'
import type { GameState, Grid, Ship } from './types'

// The merchant ships, as OpenFront's (« il faut faire les bateaux marchands
// comme sur openfront »): the port, a work of its own built by the water
// (« Dans la boîte a construction rajoute port, sors le de marché. Et ne
// relié pas les ports avec les marchés fait exactement comme openfront »),
// and now and then a port sends a ship to a port of another lord the same
// water reaches, never one at war with its own, the far ones and the
// allies' more often, less often the more ships its lord has at sea. It
// sails the shortest way over the water and, arriving, pays both ports,
// more the longer its way, twice as much between allies. Nothing takes it
// yet: the warships will.

/** Whether a tile lies by the water, the sea's or a lake's: where a port may stand. */
export function byWater(grid: Grid, tile: number): boolean {
  let wet = false
  eachAround(grid, tile, (n) => {
    if (grid.water[n]) wet = true
  })
  return wet
}

/** Whether a work is a port. */
export const isPort = (w: { work: string }) => w.work === 'port'

/** Each map's water in its seas, a number each, and the ways found between ports, kept: the water never changes. */
const SEAS = new WeakMap<
  Grid,
  { sea: Int32Array; ways: Map<number, Array<number> | null> }
>()

function seasOf(grid: Grid) {
  let known = SEAS.get(grid)
  if (known) return known
  const sea = new Int32Array(grid.water.length).fill(-1)
  let count = 0
  grid.water.forEach((wet, start) => {
    if (!wet || sea[start] >= 0) return
    const queue = [start]
    sea[start] = count
    for (let k = 0; k < queue.length; k++)
      eachAround(grid, queue[k], (n) => {
        if (!grid.water[n] || sea[n] >= 0) return
        sea[n] = count
        queue.push(n)
      })
    count++
  })
  known = { sea, ways: new Map() }
  SEAS.set(grid, known)
  return known
}

/** The seas a port's tile touches. */
function seasBy(grid: Grid, tile: number): Set<number> {
  const { sea } = seasOf(grid)
  const out = new Set<number>()
  eachAround(grid, tile, (n) => {
    if (sea[n] >= 0) out.add(sea[n])
  })
  return out
}

/** Whether a tile of water lies on a sea one of the lord's standing ports touches: where a warship of his may be fitted out for. */
export function reachesSea(
  state: GameState,
  lord: number,
  tile: number,
): boolean {
  if (!state.grid.water[tile]) return false
  const at = seasOf(state.grid).sea[tile]
  return state.works.some(
    (w) =>
      w.owner === lord &&
      isPort(w) &&
      standing(state, w) &&
      seasBy(state.grid, w.tile).has(at),
  )
}

/** The shortest way over the water from beside one port to beside another, both ends on the water; none if no water joins them. */
function seaWay(grid: Grid, from: number, to: number): Array<number> | null {
  const { ways } = seasOf(grid)
  const key = from * grid.water.length + to
  if (ways.has(key)) return ways.get(key) ?? null
  const before = new Map<number, number>()
  const queue: Array<number> = []
  eachAround(grid, from, (n) => {
    if (grid.water[n] && !before.has(n)) {
      before.set(n, -1)
      queue.push(n)
    }
  })
  let end = -1
  for (let k = 0; k < queue.length && end < 0; k++) {
    const t = queue[k]
    eachAround(grid, t, (n) => {
      if (end >= 0) return
      if (n === to) end = t
      else if (grid.water[n] && !before.has(n)) {
        before.set(n, t)
        queue.push(n)
      }
    })
  }
  let way: Array<number> | null = null
  if (end >= 0) {
    way = [end]
    for (let at = before.get(end) ?? -1; at >= 0; at = before.get(at) ?? -1)
      way.push(at)
    way.reverse()
  }
  ways.set(key, way)
  return way
}

/** What a ship's lord makes of trade with the port's, in percent: an ally's more. */
const tradeWith = (state: GameState, lord: number, to: number) =>
  isAllied(state, lord, to) ? state.rules.allyTrade : 100

/** Whether a port sends a ship this time: less likely the more its lord has at sea. */
function sends(state: GameState, lord: number, port: number): boolean {
  const { shipCrowd } = state.rules
  const out = state.ships.filter((s) => s.owner === lord).length
  return (
    drawInt(state.seed, shipCrowd + out, 'sail', state.tick, port) < shipCrowd
  )
}

/** Each port sends a ship now and then, each at its own moment, to a port drawn by lot. */
export function sendShips(state: GameState) {
  const { shipTicks, shipGold } = state.rules
  const ports = state.works.filter((w) => standing(state, w) && isPort(w))
  if (ports.length < 2) return
  const wars = warsOf(state)
  for (const from of ports) {
    if ((state.tick + from.tile * 11) % shipTicks !== 0) continue
    if (!sends(state, from.owner, from.tile)) continue
    const seas = seasBy(state.grid, from.tile)
    const ends = ports.filter(
      (to) =>
        to.owner !== from.owner &&
        !wars.has(from.owner * 64 + to.owner) &&
        [...seasBy(state.grid, to.tile)].some((s) => seas.has(s)),
    )
    const weights = ends.map(
      (to) =>
        (1 + Math.floor(apart(state.grid, from.tile, to.tile) / 64)) *
        tradeWith(state, from.owner, to.owner),
    )
    const total = weights.reduce((a, b) => a + b, 0)
    if (total === 0) continue
    let lot = drawInt(state.seed, total, 'port', state.tick, from.tile)
    const to = ends.find((_, i) => (lot -= weights[i]) < 0)
    if (!to) continue
    const way = seaWay(state.grid, from.tile, to.tile)
    if (!way || way.length < 2) continue
    const bonus = tradeWith(state, from.owner, to.owner)
    state.ships.push({
      owner: from.owner,
      from: from.tile,
      to: to.tile,
      way,
      along: 0,
      gold: Math.floor((way.length * shipGold * bonus) / 100),
    })
  }
}

/** The ships a tick further, paying both ports as they come in; a port gone, the trade is lost. */
export function moveShips(state: GameState) {
  state.ships = state.ships.filter((ship: Ship) => {
    if (!state.players[ship.owner].alive) return false
    ship.along += state.rules.shipPace
    if (ship.along < (ship.way.length - 1) * 1000) return true
    const port = state.works.find((w) => w.tile === ship.to && isPort(w))
    if (!port) return false
    state.players[ship.owner].gold += ship.gold
    if (port.owner !== ship.owner) state.players[port.owner].gold += ship.gold
    return false
  })
}
