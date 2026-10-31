import { describe, expect, it } from 'vitest'
import { createGame } from './land'
import { RULES } from './rules'
import { hold, setupOf } from './testing'
import { UNIT } from './units'
import { launchWarship, sailWarships, sendWarship, whereIs } from './warships'
import type { GameState, Grid, Host, Warship } from './types'

/** A sea between two coasts: four columns of land each side, twelve of water, twelve rows down. */
function sea(): Grid {
  const land = Array.from({ length: 240 }, (_, t) => t % 20 < 4 || t % 20 >= 16)
  return {
    width: 20,
    height: 12,
    size: 4,
    land,
    water: land.map((on) => !on),
    area: land.filter(Boolean).length,
  }
}

/** The tile at a column and a row. */
const at = (x: number, y: number) => y * 20 + x

function game() {
  const state = createGame(sea(), setupOf(2), {
    ...RULES,
    fillSeconds: Number.MAX_SAFE_INTEGER,
    sickness: 0,
    seaWalled: 0,
    shipCrowd: 1000,
  })
  state.tick = state.rules.openingTicks
  const west = Array.from({ length: 240 }, (_, t) => t).filter((t) => t % 20 < 4)
  hold(state, 0, west)
  hold(state, 1, west.map((t) => t + 16))
  state.works.push({ work: 'port', tile: at(3, 5), owner: 0 })
  state.works.push({ work: 'port', tile: at(16, 5), owner: 1 })
  for (const lord of state.players) lord.gold = 1000 * UNIT
  return state
}

/** A warship of a lord's lying at a tile, its way ended there. */
function afloat(state: GameState, owner: number, tile: number): Warship {
  const ship: Warship = {
    id: (state.warshipsBuilt += 1),
    owner,
    post: tile,
    way: [tile],
    along: 0,
    hull: state.rules.warshipHull,
    reload: state.tick,
  }
  state.warships.push(ship)
  return ship
}

describe('the warships', () => {
  it('are fitted out at the lord’s port nearest the water clicked, and sail there', () => {
    const state = game()
    launchWarship(state, 0, at(10, 2))
    const [ship] = state.warships
    expect(ship.owner).toBe(0)
    expect(ship.way[0]).toBe(at(4, 5))
    expect(ship.way.at(-1)).toBe(at(10, 2))
    expect(ship.way.every((t) => state.grid.water[t])).toBe(true)
    expect(state.players[0].gold).toBe((1000 - RULES.warshipPrice) * UNIT)
    for (let t = 0; t < 30; t++) {
      sailWarships(state)
      state.tick++
    }
    expect(state.rules.warshipPatrol ** 2).toBeGreaterThanOrEqual(
      (whereIs(ship) % 20 - 10) ** 2 + (Math.floor(whereIs(ship) / 20) - 2) ** 2,
    )
  })

  it('cost nothing and are none with no port of one’s own', () => {
    const state = game()
    state.works = state.works.filter((w) => w.owner !== 0)
    launchWarship(state, 0, at(10, 2))
    expect(state.warships).toEqual([])
    expect(state.players[0].gold).toBe(1000 * UNIT)
  })

  it('are sent elsewhere on the same water', () => {
    const state = game()
    const ship = afloat(state, 0, at(6, 6))
    sendWarship(state, 0, ship.id, at(12, 10))
    expect(ship.post).toBe(at(12, 10))
    expect(ship.way[0]).toBe(at(6, 6))
    expect(ship.way.at(-1)).toBe(at(12, 10))
    sendWarship(state, 1, ship.id, at(5, 1))
    expect(ship.post).toBe(at(12, 10))
  })

  it('take a foe’s merchant ship passing near, its gold for their lord', () => {
    const state = game()
    afloat(state, 0, at(10, 6))
    state.ships.push({
      owner: 1,
      from: at(16, 5),
      to: at(3, 9),
      way: [at(11, 6), at(10, 7)],
      along: 0,
      gold: 300 * UNIT,
    })
    sailWarships(state)
    expect(state.ships).toEqual([])
    expect(state.players[0].gold).toBe(1300 * UNIT)
  })

  it('sink an enemy army’s boat crossing, its men with it', () => {
    const state = game()
    afloat(state, 0, at(10, 6))
    const boat = {
      owner: 1,
      men: 50 * UNIT,
      road: [at(16, 6), at(11, 6), at(4, 6)],
      along: 1000,
      edge: [],
    } as unknown as Host
    state.hosts.push(boat)
    sailWarships(state)
    expect(boat.men).toBe(0)
  })

  it('fight shot for shot, the first to shoot left afloat', () => {
    const state = game()
    const first = afloat(state, 0, at(10, 6))
    const second = afloat(state, 1, at(11, 6))
    for (let t = 0; t < 20 * state.rules.warshipReload; t++) {
      sailWarships(state)
      state.tick++
    }
    expect(state.warships).toEqual([first])
    expect(second.hull).toBe(0)
  })

  it('leave an ally’s ships be', () => {
    const state = game()
    afloat(state, 0, at(10, 6))
    afloat(state, 1, at(11, 6))
    state.alliances.push({
      a: 0,
      b: 1,
      expires: state.tick + 1000,
      renewA: false,
      renewB: false,
    })
    sailWarships(state)
    expect(state.warships.map((s) => s.hull)).toEqual([4, 4])
  })
})
