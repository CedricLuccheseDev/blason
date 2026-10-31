import { describe, expect, it } from 'vitest'
import { botsSetup, createGame } from '../../engine'
import { makeSpectacle } from './spectacle'
import type { Host, Strike } from '../../engine'

function game() {
  const land = Array.from({ length: 10 }, () => true)
  const grid = {
    width: 10,
    height: 1,
    size: 4,
    land,
    water: land.map((on) => !on),
    area: land.length,
  }
  return createGame(grid, botsSetup({ seed: 'test', lords: 2 }))
}

const ALL = { left: 0, top: 0, right: 40, bottom: 4 }
const ELSEWHERE = { left: 100, top: 100, right: 140, bottom: 104 }
/** Two armies at grips at tile 3: only what the ear reads of them. */
const battle = (state: ReturnType<typeof game>) =>
  state.hosts.push({
    owner: 0,
    fighting: true,
    closing: 0,
    men: 10,
    edge: [3],
    road: [3],
    along: 0,
  } as unknown as Host)

/** The clashes heard in so many ticks. */
function clashes(view: typeof ALL, perTile: number, ticks = 60) {
  const state = game()
  battle(state)
  const spectacle = makeSpectacle()
  let heard = 0
  for (let i = 0; i < ticks; i++)
    heard += spectacle
      .watch(state, view, perTile)
      .filter((s) => s.cue === 'clash').length
  return heard
}

describe('the world heard up close', () => {
  it('hears a battle on screen now and then, not every tick', () => {
    const heard = clashes(ALL, 30)
    expect(heard).toBeGreaterThan(0)
    expect(heard).toBeLessThan(60)
  })

  it('hears no battle off the screen, nor from afar', () => {
    expect(clashes(ELSEWHERE, 30)).toBe(0)
    expect(clashes(ALL, 3)).toBe(0)
  })

  it('hears a trebuchet loosed, and its stone where it came down', () => {
    const state = game()
    const spectacle = makeSpectacle()
    const stone = {
      coup: 'trebuchet',
      owner: 0,
      victim: 1,
      from: 0,
      target: 7,
      lands: 5,
    } as Strike
    state.strikes.push(stone)
    // Loosed from its lord's border, then come down.
    expect(spectacle.watch(state, ALL, 30)).toEqual([
      { cue: 'launch', x: 2, y: 2, level: 1 },
    ])
    state.strikes = []
    state.tick = 5
    expect(spectacle.watch(state, ALL, 30)).toEqual([
      { cue: 'stone', x: 30, y: 2, level: 1 },
    ])
  })
})
