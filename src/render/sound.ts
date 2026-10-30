import { makeMixer } from '../audio/mixer'
import { heardIn, makeHearing } from './hearing'
import { siteOf } from './marks'
import type { Container, Rectangle } from 'pixi.js'
import type { GameState } from '../../engine'
import type { Heard } from './hearing'
import type { News } from './news'

// The game heard: what the player hears of it (hearing.ts), each sound
// placed left or right by where it happens on the screen, off the screen too,
// so that the ear tells him where to look.

/** How far a sound at the screen's edge leans to its side, 0 to 1. */
const LEAN = 0.8

export function makeSound(
  state: GameState,
  me: number,
  world: Container,
  screen: () => Rectangle,
) {
  const mixer = makeMixer()
  const hearing = makeHearing(state, me)

  /** From -1 (left) to 1 (right): the tile's place across the screen. */
  function panOf(tile: number): number {
    if (tile < 0) return 0
    const { x } = world.toGlobal(siteOf(state, tile))
    const across = (x / screen().width) * 2 - 1
    return Math.max(-1, Math.min(1, across)) * LEAN
  }

  const hear = (heard: Array<Heard>) => {
    for (const { cue, tile } of heard) mixer.play(cue, panOf(tile))
  }

  return {
    /** After every tick played. */
    tick: () => hear(hearing.watch()),
    /** Once a second, with the news. */
    news: (news: Array<News>) => hear(heardIn(news)),
    toggle: mixer.toggle,
    destroy: mixer.destroy,
  }
}
