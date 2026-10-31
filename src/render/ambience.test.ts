import { describe, expect, it } from 'vitest'
import { botsSetup, createGame } from '../../engine'
import { bedsOf } from './ambience'
import { FOREST } from './ground/terrain'
import type { Host } from '../../engine'

/** A strip of land, ten tiles of four units: the west half sea, the east half wood. */
function game() {
  const land = Array.from({ length: 10 }, (_, i) => i >= 5)
  const grid = {
    width: 10,
    height: 1,
    size: 4,
    land,
    water: land.map((on) => !on),
    area: 5,
  }
  const state = createGame(grid, botsSetup({ seed: 'test', lords: 2 }))
  const biome = Uint8Array.from(land, (l) => (l ? FOREST : 255))
  const shore = Uint8Array.from(
    { length: 10 },
    (_, i) => Math.abs(i - 4.5) + 0.5,
  )
  return { state, terrain: { biome, shore } }
}

const SEA = { left: 0, top: 0, right: 20, bottom: 4 }
const WOOD = { left: 20, top: 0, right: 40, bottom: 4 }

describe('the beds the land gives to hear', () => {
  it('hears the sea over the sea, and no wood there', () => {
    const { state, terrain } = game()
    const { beds } = bedsOf(state, terrain, [], SEA, 30)
    expect(beds.sea.level).toBeGreaterThan(0)
    expect(beds.wood.level).toBe(0)
    expect(beds.wind.level).toBe(0)
  })

  it('hears the wood coming closer, not from afar', () => {
    const { state, terrain } = game()
    expect(
      bedsOf(state, terrain, [], WOOD, 30).beds.wood.level,
    ).toBeGreaterThan(0)
    expect(bedsOf(state, terrain, [], WOOD, 4).beds.wood.level).toBe(0)
  })

  it('keeps the wind over the land from afar, the highs filtered', () => {
    const { state, terrain } = game()
    const far = bedsOf(state, terrain, [], WOOD, 4)
    expect(far.beds.wind.level).toBeGreaterThan(0)
    expect(far.near).toBe(0)
  })

  it('hears a village from its side of the screen, and a battle where it is fought', () => {
    const { state, terrain } = game()
    state.works.push({ work: 'village', tile: 9, owner: 0 })
    state.hosts.push({
      men: 10,
      edge: [6],
      closing: 0,
      road: [],
    } as unknown as Host)
    const { beds } = bedsOf(state, terrain, [], WOOD, 30)
    expect(beds.village.level).toBeGreaterThan(0)
    expect(beds.village.pan).toBeGreaterThan(0.5)
    expect(beds.battle.level).toBeGreaterThan(0)
    expect(beds.march.level).toBe(0)
  })
})
