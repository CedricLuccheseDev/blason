import type { Container } from 'pixi.js'
import type { Spot } from './cord'
import type { News } from './news'

// What the HUD lays on the map at a place of it (components/game/Heralds.tsx):
// the seal of each of the player's alliances at the middle of its ribbon,
// the herald's letter of each offer made to him on his land, the news
// where it happened. The render says only where, in pixels of the map's
// element, each frame the camera or the places moved, and to those who
// listen; the HUD draws them, and sets at the edge of the screen those that
// fall off it.

type HeraldKind = 'pact' | 'offer' | 'note'

/** A place of the map the HUD lays something on, in map units; for a piece of news, what it says. */
export type Anchor = {
  key: string
  kind: HeraldKind
  lord: number
  at: Spot
  news?: News
}

/** The same on the screen, in pixels; off it when it lies beyond the element. */
export type Herald = Omit<Anchor, 'at'> & { x: number; y: number }

export type Heralds = { width: number; height: number; list: Array<Herald> }

export function makeHeralds(
  world: Container,
  screen: () => { width: number; height: number },
) {
  const listeners = new Set<(heralds: Heralds) => void>()
  let told = ''
  let current: Heralds = { width: 0, height: 0, list: [] }

  return {
    /** Told at once where they stand, then each time they move; the call returned stops it. */
    listen(listener: (heralds: Heralds) => void): () => void {
      listeners.add(listener)
      listener(current)
      return () => listeners.delete(listener)
    },
    /** The anchors of this frame, projected on the screen; told only when one moved by a pixel, came or went. */
    show(anchors: Array<Anchor>) {
      const { width, height } = screen()
      const list = anchors.map(({ at, ...rest }) => {
        const p = world.toGlobal(at)
        return { ...rest, x: Math.round(p.x), y: Math.round(p.y) }
      })
      const where = list.map((h) => `${h.key}@${h.x},${h.y}`).join(';')
      const said = `${width}x${height};${where}`
      if (said === told) return
      told = said
      current = { width, height, list }
      for (const listener of listeners) listener(current)
    },
  }
}
