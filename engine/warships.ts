import { UNIT } from './units'
import { isAllied } from './diplomacy'
import { apart, eachAround } from './grid'
import { drawInt } from './numbers'
import { standing } from './land'
import { afloat } from './crossing'
import { positionOf } from './muster'
import { isPort } from './ships'
import { wayFrom } from './seaways'
import type { GameState, Warship } from './types'

// The warships, as OpenFront's (« fais comme open front tu choisi une
// position sur l'eau et il part du port le plus proche »): taken from the bar
// as a work, its price doubling with each, and a click on the water; it is
// fitted out at its lord's port nearest that point by sea, sails there and
// patrols round it. Sent again by a click, it sails elsewhere on the same
// water. Every few seconds it shoots, near enough, at what is not its
// allies': a warship, which sinks at its last hull; the boat of an army
// crossing, which sinks with its men; a merchant ship, taken, its gold for
// its lord.

/** The water tile a warship is on. */
export const whereIs = (ship: Warship) =>
  ship.way[Math.min(ship.way.length - 1, Math.floor(ship.along / 1000))]

/** Whether a warship has come to the end of its way. */
const arrived = (ship: Warship) => ship.along >= (ship.way.length - 1) * 1000

/** A warship's price for a lord, in gold: a castle's, doubling with each of his afloat. */
export function warshipPrice(state: GameState, lord: number): number {
  const { warshipPrice: price, priceDoublings } = state.rules
  const held = state.warships.filter((s) => s.owner === lord).length
  return price * (1 << Math.min(held, priceDoublings))
}

/** Whether a tile of water lies beside one of the lord's ports that stands. */
function besidePort(state: GameState, lord: number): (tile: number) => boolean {
  const ports = new Set(
    state.works
      .filter((w) => w.owner === lord && standing(state, w) && isPort(w))
      .map((w) => w.tile),
  )
  return (tile) => {
    let by = false
    eachAround(state.grid, tile, (n) => {
      if (ports.has(n)) by = true
    })
    return by
  }
}

/** A warship for the lord, fitted out at his port nearest the tile of water by sea and sent there, for its price; none if no port of his reaches it. */
export function launchWarship(
  state: GameState,
  lord: number,
  tile: number,
): void {
  const price = warshipPrice(state, lord) * UNIT
  const player = state.players[lord]
  if (player.gold < price) return
  const way = wayFrom(state.grid, tile, besidePort(state, lord))
  if (!way) return
  player.gold -= price
  state.warshipsBuilt += 1
  state.warships.push({
    id: state.warshipsBuilt,
    owner: lord,
    post: tile,
    way,
    along: 0,
    hull: state.rules.warshipHull,
    reload: state.tick,
  })
}

/** One of the lord's warships sent to patrol round a tile of the water it sails. */
export function sendWarship(
  state: GameState,
  lord: number,
  id: number,
  tile: number,
): void {
  const ship = state.warships.find((s) => s.id === id && s.owner === lord)
  if (!ship) return
  const here = whereIs(ship)
  const way = wayFrom(state.grid, tile, (t) => t === here)
  if (!way) return
  Object.assign(ship, { post: tile, way, along: 0 })
}

/** Whether a lord's warship may strike what another lord has: neither his own nor an ally's. */
const foe = (state: GameState, lord: number, other: number) =>
  other !== lord && !isAllied(state, lord, other)

/** Whether a tile lies within so many tiles of another. */
const within = (state: GameState, a: number, b: number, tiles: number) =>
  apart(state.grid, a, b) <= tiles * tiles

/** The warship's shot, if it is ready and something of a foe's is near: a warship first, then an army's boat, then a merchant ship. */
function fire(state: GameState, ship: Warship): void {
  // Sunk this tick by one that shot first, it shoots no more.
  if (ship.hull <= 0 || state.tick < ship.reload) return
  const { warshipReach: reach, warshipReload } = state.rules
  const here = whereIs(ship)
  const near = (tile: number) => within(state, here, tile, reach)
  const enemy = state.warships.find(
    (s) => s.hull > 0 && foe(state, ship.owner, s.owner) && near(whereIs(s)),
  )
  const boat = state.hosts.find(
    (h) =>
      h.men > 0 &&
      foe(state, ship.owner, h.owner) &&
      afloat(state, h) &&
      near(positionOf(h)),
  )
  const trader = state.ships.find(
    (s) =>
      foe(state, ship.owner, s.owner) &&
      !state.works.some((w) => w.tile === s.to && w.owner === ship.owner) &&
      near(s.way[Math.floor(s.along / 1000)]),
  )
  if (enemy) enemy.hull -= 1
  else if (boat) boat.men = 0
  else if (trader) {
    state.players[ship.owner].gold += trader.gold
    state.ships = state.ships.filter((s) => s !== trader)
  } else return
  ship.reload = state.tick + warshipReload
}

/** Where a warship come to the end of its way goes next: at a foe's ship or boat within its patrol, the nearest; else a spot drawn round its post. */
function nextAim(state: GameState, ship: Warship): number {
  const { warshipPatrol: patrol, warshipReach: reach } = state.rules
  const here = whereIs(ship)
  const prey = [
    ...state.warships
      .filter((s) => foe(state, ship.owner, s.owner))
      .map(whereIs),
    ...state.hosts
      .filter((h) => foe(state, ship.owner, h.owner) && afloat(state, h))
      .map(positionOf),
    ...state.ships
      .filter((s) => foe(state, ship.owner, s.owner))
      .map((s) => s.way[Math.floor(s.along / 1000)]),
  ].filter(
    (t) =>
      within(state, ship.post, t, patrol) && !within(state, here, t, reach),
  )
  if (prey.length > 0)
    return prey.reduce(
      (a, b) =>
        apart(state.grid, here, b) < apart(state.grid, here, a) ? b : a,
      prey[0],
    )
  const { width } = state.grid
  const [x, y] = [ship.post % width, Math.floor(ship.post / width)]
  const span = 2 * patrol + 1
  const dx = drawInt(state.seed, span, 'patrol', state.tick, ship.id) - patrol
  const dy = drawInt(state.seed, span, 'patrol', ship.id, state.tick) - patrol
  const [px, py] = [x + dx, y + dy]
  if (px < 0 || py < 0 || px >= width || py >= state.grid.height) return -1
  return py * width + px
}

/** A tick of the warships: each shoots if it may, sails on, and at the end of its way sets out for the next. */
export function sailWarships(state: GameState): void {
  const { warshipPace, warshipPatrol: patrol } = state.rules
  for (const ship of state.warships) fire(state, ship)
  state.warships = state.warships.filter(
    (s) => s.hull > 0 && state.players[s.owner].alive,
  )
  for (const ship of state.warships) {
    if (!arrived(ship)) {
      ship.along = Math.min(
        ship.along + warshipPace,
        (ship.way.length - 1) * 1000,
      )
      continue
    }
    const aim = nextAim(state, ship)
    if (aim < 0 || !state.grid.water[aim]) continue
    const here = whereIs(ship)
    // Never further than its patrol's square, searched: a spot behind a cape is let be.
    const way = wayFrom(
      state.grid,
      aim,
      (t) => t === here,
      16 * patrol * patrol,
    )
    if (way && way.length > 1) Object.assign(ship, { way, along: 0 })
  }
}
