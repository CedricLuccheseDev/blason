import { makeMixer } from '../audio/mixer'
import { bedsOf } from './ambience'
import { heardIn, makeHearing } from './hearing'
import { siteOf } from './marks'
import { makeSpectacle } from './spectacle'
import type { Container, Rectangle } from 'pixi.js'
import type { Rivers } from './ambience'
import type { Box } from './camera'
import type { Terrain } from './ground/terrain'
import type { GameState } from '../../engine'
import type { Heard } from './hearing'
import type { News } from './news'

// The game heard: what the player hears of it (hearing.ts), each sound
// placed left or right by where it happens on the screen, off the screen too,
// so that the ear tells him where to look; the land under the camera
// (ambience.ts) and, up close, the world's spectacle (spectacle.ts); and a
// light click on each piece of the HUD pressed.

/** How far a sound at the screen's edge leans to its side, 0 to 1. */
const LEAN = 0.8
/** What a press is in the HUD: what the player clicks, the map aside. */
const PRESSED = 'button, a, [role="button"]'

/** What the ear reads of the map: its ground, and the part of it on screen. */
export type Ear = { terrain: Terrain; rivers: Rivers; view: () => Box }

export function makeSound(
  state: GameState,
  me: number,
  world: Container,
  screen: () => Rectangle,
  ear: Ear,
) {
  const mixer = makeMixer()
  const hearing = makeHearing(state, me)
  const spectacle = makeSpectacle()

  /** From -1 (left) to 1 (right): a point's place across the screen. */
  function panAt(at: { x: number; y: number }): number {
    const { x } = world.toGlobal(at)
    const across = (x / screen().width) * 2 - 1
    return Math.max(-1, Math.min(1, across)) * LEAN
  }

  const hear = (heard: Array<Heard>) => {
    for (const { cue, tile } of heard)
      mixer.play(cue, tile < 0 ? 0 : panAt(siteOf(state, tile)))
  }

  /** Pixels a tile covers on screen. */
  const perTile = () => world.scale.x * state.grid.size

  // What cannot be had now (aria-disabled, the bar's pieces short) knocks dull.
  function press(e: PointerEvent) {
    if (!(e.target instanceof Element)) return
    const pressed = e.target.closest(PRESSED)
    if (!pressed) return
    const short = pressed.getAttribute('aria-disabled') === 'true'
    mixer.play(short ? 'refused' : 'press')
  }
  window.addEventListener('pointerdown', press)

  return {
    /** After every tick played. */
    tick() {
      hear(hearing.watch())
      for (const s of spectacle.watch(state, ear.view(), perTile()))
        mixer.play(s.cue, panAt(s), s.level)
    },
    /** Once a second: the news, and the beds as the screen has them. */
    news(news: Array<News>) {
      hear(heardIn(news))
      mixer.hear(bedsOf(state, ear.terrain, ear.rivers, ear.view(), perTile()))
    },
    toggle: mixer.toggle,
    destroy() {
      window.removeEventListener('pointerdown', press)
      mixer.destroy()
    },
  }
}
