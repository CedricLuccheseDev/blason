import { describe, expect, it } from 'vitest'
import { createGame } from './land'
import { RULES, WORKS } from './rules'
import { isPort, moveShips, sendShips } from './ships'
import { canBuild, roomFor } from './works'
import { hold, setupOf } from './testing'
import type { Grid } from './types'

/** Two lands across a strait: four columns of land, four of water, eight of land, three rows down. */
function strait(): Grid {
  const land = Array.from({ length: 48 }, (_, t) => t % 16 < 4 || t % 16 >= 8)
  return {
    width: 16,
    height: 3,
    size: 4,
    land,
    water: land.map((on) => !on),
    area: land.filter(Boolean).length,
  }
}

function game() {
  const state = createGame(strait(), setupOf(3), {
    ...RULES,
    fillSeconds: Number.MAX_SAFE_INTEGER,
    sickness: 0,
    seaWalled: 0,
    shipCrowd: 1000,
  })
  state.tick = state.rules.openingTicks
  hold(state, 0, [16, 17, 18, 19])
  hold(state, 1, [24, 25, 26, 27])
  hold(state, 2, [14, 15, 30, 31, 46, 47])
  for (const lord of state.players) lord.gold = 0
  return state
}

describe('the merchant ships', () => {
  it('stand only by the water, a work of their own, never a market', () => {
    const state = game()
    expect(isPort({ work: 'port' })).toBe(true)
    expect(isPort({ work: 'market' })).toBe(false)
    expect(canBuild(state, 0, 19, 'port')).toBe(true)
    expect(canBuild(state, 0, 17, 'port')).toBe(false)
  })

  it('light, for each work, the very tiles it may be built on', () => {
    const state = game()
    state.works.push({ work: 'castle', tile: 18, owner: 0 })
    state.works.push({ work: 'port', tile: 25, owner: 1 })
    for (const work of WORKS) {
      const room = roomFor(state, 0, work)
      state.owner.forEach((_, t) =>
        expect([work, t, room[t] === 1]).toEqual([
          work,
          t,
          canBuild(state, 0, t, work),
        ]),
      )
    }
  })

  it('sail from port to port over the water and pay both', () => {
    const state = game()
    state.works.push({ work: 'port', tile: 19, owner: 0 })
    state.works.push({ work: 'port', tile: 24, owner: 1 })
    for (let t = 0; t < state.rules.shipTicks && !state.ships.length; t++) {
      sendShips(state)
      state.tick++
    }
    expect(state.ships.length).toBeGreaterThan(0)
    const [ship] = state.ships
    expect(ship.way.every((t) => state.grid.water[t])).toBe(true)
    const paid = ship.gold
    for (let t = 0; t < 100 && state.ships.length; t++) moveShips(state)
    expect(state.ships).toEqual([])
    expect(state.players[ship.owner].gold).toBe(paid)
    expect(state.players[1 - ship.owner].gold).toBe(paid)
  })
})
