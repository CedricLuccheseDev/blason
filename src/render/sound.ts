import { makeMixer } from '../audio/mixer'
import type { Mixer } from '../audio/mixer'
import { listenPresses } from '../audio/presses'
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
// (ambience.ts) and, up close, the world's spectacle (spectacle.ts); and the
// HUD's presses (audio/presses.ts).

/** How far a sound at the screen's edge leans to its side, 0 to 1. */
const LEAN = 0.8

/** What the ear reads of the map: its ground, and the part of it on screen. */
export type Ear = { terrain: Terrain; rivers: Rivers; view: () => Box }

/** The game's mixer, kept from one game to the next on the page: a land changed in the book mounts the game anew, and its music went on from its start each time (« quand on change de map ça reset la musique »). */
let kept: {
  mixer: Mixer
  closing: ReturnType<typeof setTimeout> | null
} | null = null
/** How long a game's mixer waits for the next before it falls silent, in ms. */
const KEEP_MS = 1500

/** The mixer a game sounds through: the last game's if it is waiting and its end was not heard, else a new one. */
function claimMixer(): Mixer {
  if (kept) {
    if (kept.closing) clearTimeout(kept.closing)
    if (!kept.mixer.ended()) return kept.mixer
    kept.mixer.destroy()
  }
  kept = { mixer: makeMixer(), closing: null }
  return kept.mixer
}

/** A game gone: its mixer waits a moment for the next, then falls silent. */
function releaseMixer() {
  const held = kept
  if (!held) return
  held.closing = setTimeout(() => {
    held.mixer.destroy()
    if (kept === held) kept = null
  }, KEEP_MS)
}

export function makeSound(
  state: GameState,
  me: number,
  world: Container,
  screen: () => Rectangle,
  ear: Ear,
) {
  const mixer = claimMixer()
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

  const stopPresses = listenPresses((cue) => mixer.play(cue))

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
    /** An order refused before it is sent: the dull knock of the HUD's refusals. */
    refuse: () => mixer.play('refused'),
    toggle: mixer.toggle,
    destroy() {
      stopPresses()
      releaseMixer()
    },
  }
}
