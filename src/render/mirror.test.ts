import { describe, expect, it } from 'vitest'
import {
  NO_ONE,
  botsSetup,
  createBot,
  createGame,
  landOf,
  step,
} from '../../engine'
import { makeDiffer, makeMirror } from './mirror'

describe('the game mirrored from its thread', () => {
  it('matches the game step by step, each thing the same object', () => {
    const setup = botsSetup({ seed: 'mirror', level: 'normal', lords: 6 })
    const { grid } = landOf(setup)
    const played = createGame(grid, setup)
    const shown = createGame(grid, setup)
    const differ = makeDiffer(played)
    const mirror = makeMirror(shown)
    const bots = played.players.map((_, id) => createBot(id, setup.seed))
    let army: object | null = null
    let kept = false
    while (played.tick < 900 && played.winner === NO_ONE) {
      step(
        played,
        played.players.flatMap((p, id) =>
          p.alive ? bots[id](played, id) : [],
        ),
      )
      mirror.apply(differ.delta())
      if (army && shown.hosts.includes(army as never)) kept = true
      army ??= shown.hosts[0] ?? null
    }
    expect(shown.tick).toBe(played.tick)
    expect(shown.owner).toEqual(played.owner)
    expect(shown.players).toEqual(played.players)
    expect(shown.works).toEqual(played.works)
    expect(shown.hosts.map((h) => ({ ...h, queue: [] }))).toEqual(
      played.hosts.map((h) => ({ ...h, queue: [] })),
    )
    expect(kept).toBe(true)
  })
})
