import { describe, expect, it } from 'vitest'
import { TICKS_PER_SECOND, UNIT } from './units'
import { holdOf } from './land'
import { canBuild } from './works'
import { coupPrice } from './coups'
import { attack, endow, field, hold, muster, playing, run } from './testing'
import type { Coup } from './rules'
import type { GameState, Order } from './types'

const SECOND = TICKS_PER_SECOND

/** Two lords on a row of 30: lord 0 the left half, lord 1 the right, each a village at his border. */
function facing(): GameState {
  const state = playing(field(30))
  hold(
    state,
    0,
    Array.from({ length: 15 }, (_, t) => t),
  )
  hold(
    state,
    1,
    Array.from({ length: 15 }, (_, t) => t + 15),
  )
  muster(state, 0, 14)
  muster(state, 1, 15)
  endow(state, 0, 400, 5000)
  endow(state, 1, 400, 5000)
  return state
}

const coup = (player: number, tile: number, kind: Coup): Order => ({
  player,
  type: 'coup',
  tile,
  coup: kind,
})

describe('the coups', () => {
  it('cost more with each launched, doubled three times at most', () => {
    const state = facing()
    expect(coupPrice(state, 0, 'fire')).toBe(600)
    for (let n = 0; n < 5; n++) run(state, 1, [coup(0, 20, 'fire')])
    expect(coupPrice(state, 0, 'fire')).toBe(4800)
  })

  it('archers: a volley near the border kills a share of the enemy armies under it', () => {
    // Lord 0's village at the far end of his land: his army marches to the border, under the volley.
    const state = facing()
    state.works[0].tile = 0
    run(state, 1, [attack(0, 25, 'host'), coup(1, 12, 'archers')])
    const host = state.hosts[0]
    run(state, 2 * SECOND - 1)
    const before = host.men
    run(state, 1)
    expect(host.men).toBeLessThan(before)
    expect(host.men).toBeLessThanOrEqual(Math.ceil(before * 0.7) + UNIT)
  })

  it('archers reach no farther than a few tiles from the border', () => {
    const state = facing()
    run(state, 1, [coup(0, 28, 'archers')])
    expect(state.strikes).toEqual([])
    expect(state.players[0].gold).toBe(5000 * UNIT)
  })

  it('Greek fire burns the works round where it falls, and no one may build there a while', () => {
    const state = facing()
    state.works.push({ work: 'market', tile: 20, owner: 1 })
    run(state, 1, [coup(0, 20, 'fire')])
    run(state, 4 * SECOND)
    expect(state.works.some((w) => w.tile === 20)).toBe(false)
    expect(canBuild(state, 1, 20, 'market')).toBe(false)
    run(state, 61 * SECOND)
    expect(canBuild(state, 1, 20, 'market')).toBe(true)
  })

  it('the troublemaker walks there, and the land round him rises, free and held by rebels', () => {
    const state = facing()
    const free = holdOf(state, 0)
    run(state, 1, [coup(0, 24, 'troublemaker')])
    expect(state.owner[24]).toBe(1)
    run(state, 10 * SECOND)
    expect(state.owner[24]).toBe(-1)
    expect(state.owner[18]).toBe(-1)
    expect(state.owner[17]).toBe(1)
    expect(state.works).toHaveLength(2)
    expect(holdOf(state, 24)).toBeGreaterThanOrEqual(free)
  })

  it('the troublemaker is ended by an army of the lord he walks on', () => {
    const state = facing()
    run(state, 1, [attack(1, 5, 'host'), coup(0, 28, 'troublemaker')])
    run(state, 10 * SECOND)
    expect(state.owner[28]).toBe(1)
    expect(state.strikes).toEqual([])
  })
})
