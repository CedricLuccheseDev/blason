import { describe, expect, it } from 'vitest'
import {
  RULES,
  createBot,
  createGame,
  generateWorld,
  makeGrid,
  stateHash,
  step,
} from '../../engine'
import { restoreGame, saveGame } from './save'
import { summarize } from './summary'
import type { GameState } from '../../engine'
import type { Save } from './save'

const seed = 'save-test'
const world = generateWorld(seed)
const grid = makeGrid(world.map, world.width, world.height, RULES.tileSize)

/** So many ticks of a game, twenty bots playing it, new ones if none are given. */
function play(state: GameState, ticks: number, each?: () => void) {
  const bots = state.players.map((_, id) => createBot(id, seed, 'normal'))
  for (let n = 0; n < ticks; n++) {
    step(
      state,
      state.players.flatMap((p, id) => (p.alive ? bots[id](state, id) : [])),
    )
    each?.()
  }
}

describe('a saved game', () => {
  const state = createGame(grid, 20, seed)
  play(state, 1500)
  const save = saveGame(state, grid, {
    size: 'standard',
    level: 'normal',
    me: 3,
    camera: 'home',
  })
  const text = JSON.stringify(save)
  const back = () => restoreGame(grid, JSON.parse(text) as Save)

  it('gives back the game it was made from, and the same HUD to every seat', () => {
    const restored = back()
    expect(stateHash(restored)).toBe(stateHash(state))
    const hand = { army: 'host', work: null, coup: null } as const
    for (let me = 0; me < 20; me++)
      expect(summarize(restored, me, hand)).toEqual(summarize(state, me, hand))
  })

  it('plays on as the game played on, tick for tick', () => {
    const restored = back()
    const original = structuredClone(state)
    const hashes: Array<string> = []
    play(original, 200, () => hashes.push(stateHash(original)))
    let n = 0
    play(restored, 200, () => expect(stateHash(restored)).toBe(hashes[n++]))
  })

  it('leaves out what the seed makes again, and packs the land and the roads', () => {
    expect(Object.keys(save.state)).not.toContain('grid')
    expect(Object.keys(save.state)).not.toContain('rules')
    expect(Object.keys(save.state)).not.toContain('realm')
    expect(text).toContain('"owner":{"$runs"')
    expect(text).toContain('"road":{"$path"')
    expect(text.length).toBeLessThan(80_000)
  })
})
