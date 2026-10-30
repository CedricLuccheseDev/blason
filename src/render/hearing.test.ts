import { describe, expect, it } from 'vitest'
import { botsSetup, createGame } from '../../engine'
import { heardIn, makeHearing } from './hearing'
import type { Host } from '../../engine'

function game() {
  const land = Array.from({ length: 10 }, () => true)
  const grid = { width: 10, height: 1, size: 4, land, area: land.length }
  return createGame(grid, botsSetup({ seed: 'test', lords: 3 }))
}

/** An army of a lord's, raised at a tile: only what the ear reads of it. */
const hostOf = (owner: number, from: number) => ({ owner, from }) as Host

describe('what the player hears', () => {
  it('hears the news that concern him, each from where it happened', () => {
    expect(
      heardIn([
        { kind: 'attacked', lord: 1, tile: 7 },
        { kind: 'pact', lord: 1, how: 'made', tile: 8 },
        { kind: 'pact', lord: 1, how: 'offered', tile: 8 },
        { kind: 'betrayed', lord: 1, victim: 2 },
        { kind: 'stopped', lord: 1, tile: 3 },
      ]),
    ).toEqual([
      { cue: 'alarm', tile: 7 },
      { cue: 'pact', tile: 8 },
      { cue: 'herald', tile: 8 },
      { cue: 'betrayal', tile: -1 },
    ])
  })

  it('hears his army leave and his work laid, once, and not another’s', () => {
    const state = game()
    const hearing = makeHearing(state, 0)
    state.hosts.push(hostOf(0, 2), hostOf(1, 8))
    state.works.push({ work: 'village', tile: 3, owner: 0, ready: 50 })
    // A work taken from another stands already: no mallet for it.
    state.works.push({ work: 'market', tile: 4, owner: 0 })
    expect(hearing.watch()).toEqual([
      { cue: 'muster', tile: 2 },
      { cue: 'build', tile: 3 },
    ])
    expect(hearing.watch()).toEqual([])
  })

  it('hears the end once: the knell for his fall, nothing after', () => {
    const state = game()
    const hearing = makeHearing(state, 0)
    state.players[0].alive = false
    expect(hearing.watch()).toEqual([{ cue: 'defeat', tile: -1 }])
    state.winner = 1
    expect(hearing.watch()).toEqual([])
  })

  it('hears a victory when his side wins', () => {
    const state = game()
    const hearing = makeHearing(state, 0)
    state.winner = 0
    expect(hearing.watch()).toEqual([{ cue: 'victory', tile: -1 }])
  })

  it('hears no fall for a seat no one held yet', () => {
    const state = game()
    state.players[0].alive = false
    const hearing = makeHearing(state, 0)
    expect(hearing.watch()).toEqual([])
  })
})
