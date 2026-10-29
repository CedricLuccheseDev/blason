import { describe, expect, it } from 'vitest'
import { TICKS_PER_SECOND, UNIT } from './units'
import { shoot } from './volleys'
import { attack, endow, field, hold, muster, playing, run } from './testing'
import type { GameState, Host } from './types'

const SECOND = TICKS_PER_SECOND
const CASTLE = 45

const span = (from: number, to: number) =>
  Array.from({ length: to - from }, (_, i) => from + i)

/**
 * Three lords on a land two rows high: lord 0 the left half of the first
 * row, lord 2 its right half, lord 1 the whole second row, his castle in its
 * middle, done at a tick. Its zone, 12 tiles round, covers the middle of
 * both rows, and neither end of the second.
 */
function besieged(ready = 100): GameState {
  const state = playing(field(30, 2), 3)
  hold(state, 0, span(0, 15))
  hold(state, 2, span(15, 30))
  hold(state, 1, span(30, 60))
  state.works.push({ work: 'castle', tile: CASTLE, owner: 1, ready })
  return state
}

/** An army of one lord striking another, its front on these tiles, so many men strong. */
function striking(
  state: GameState,
  owner: number,
  target: number,
  edge: Array<number>,
  men = 200,
): Host {
  const host: Host = {
    owner,
    army: 'host',
    target,
    men: men * UNIT,
    aim: edge[0],
    entry: edge[0],
    departs: state.tick,
    queue: [],
    edge,
    from: -1,
    road: [edge[0]],
    along: 0,
    fighting: false,
    closing: -1,
    wide: state.rules.bandTiles,
  }
  state.hosts.push(host)
  return host
}

/** The ticks the castles shoot at an army, from one tick to another, the volleys alone played. */
function volleysOn(state: GameState, host: Host, from: number, to: number) {
  const struck: Array<number> = []
  for (let tick = from; tick < to; tick++) {
    state.tick = tick
    const before = host.men
    shoot(state)
    if (host.men < before) struck.push(tick)
  }
  return struck
}

describe("the castles' arrows", () => {
  it('fall every 3 seconds from the castle standing on an army biting its land in its zone, 5 % of its men each time', () => {
    const state = besieged()
    const host = striking(state, 0, 1, [42, 41, 40])
    expect(volleysOn(state, host, 100, 100 + 10 * SECOND)).toEqual([
      100, 130, 160, 190,
    ])
    // 200 men, then 190, 180.5, 171.475 and 162.902, rounded down to the thousandth.
    expect(host.men).toBe(162_902)
  })

  it('kill one man at least', () => {
    const state = besieged()
    const host = striking(state, 0, 1, [42], 10)
    volleysOn(state, host, 100, 101)
    expect(host.men).toBe(9 * UNIT)
  })

  it('leave alone an army whose front lies outside the zone', () => {
    // The second row's left end, 13 tiles and more from the castle.
    const state = besieged()
    const host = striking(state, 0, 1, [32, 31, 30])
    expect(volleysOn(state, host, 100, 200)).toEqual([])
  })

  it("leave alone an ally's army and an army striking someone else, in the zone", () => {
    const state = besieged()
    state.alliances.push({
      a: 1,
      b: 2,
      expires: 10 * 60 * SECOND,
      renewA: false,
      renewB: false,
    })
    const ally = striking(state, 2, 0, [14, 13, 12])
    const elsewhere = striking(state, 0, 2, [15, 16, 17])
    const foe = striking(state, 0, 1, [40])
    volleysOn(state, foe, 100, 101)
    expect(ally.men).toBe(200 * UNIT)
    expect(elsewhere.men).toBe(200 * UNIT)
    expect(foe.men).toBe(190 * UNIT)
  })

  it('wait for the castle to be built', () => {
    const state = besieged(300)
    const host = striking(state, 0, 1, [42, 41, 40])
    expect(volleysOn(state, host, 100, 340)).toEqual([300, 330])
  })

  it('end an army brought to nothing as one beaten in battle: gone, none of its men home', () => {
    const shot = besieged()
    striking(shot, 0, 1, [42], 0.5)
    run(shot, 1)
    expect(shot.hosts).toEqual([])
    expect(shot.players[0].peasants).toBe(0)
    // Spared, the same army with nothing left to take goes home.
    const spared = besieged(200)
    striking(spared, 0, 1, [42], 0.5)
    run(spared, 1)
    expect(spared.hosts).toEqual([])
    expect(spared.players[0].peasants).toBe(UNIT / 2)
  })

  it('fall as the game goes on an army biting the land in the zone', () => {
    // Lord 1 has no peasants: his land costs nothing to take, so that the
    // army loses men to the arrows alone. His castle is done at tick 103.
    const state = playing(field(60))
    hold(state, 0, span(0, 20))
    hold(state, 1, span(20, 60))
    muster(state, 0, 19)
    endow(state, 0, 800)
    state.works.push({ work: 'castle', tile: 30, owner: 1, ready: 103 })
    run(state, 3, [attack(0, 59, 'host')])
    const [host] = state.hosts
    expect(host.men).toBe(200 * UNIT)
    run(state, 1)
    expect(host.men).toBe(190 * UNIT)
  })
})
