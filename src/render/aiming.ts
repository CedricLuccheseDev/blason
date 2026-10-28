import { NEUTRAL, entryFor } from '../../engine'
import { siteOf } from './marks'
import type { Container } from 'pixi.js'
import type { GameState } from '../../engine'

// What the pointer aims at: another's land or free land a click would
// strike, where the army would enter, whose land it is, and whether a right
// click (or a long press) pinned it there; over any other lord's land, even
// one no army of mine reaches, his name and the alliance a right click
// offers. In pixels of the map's element.

/** Where the pointer aims at another's land: where the army would enter, whose land, and whether a right click pinned it there. */
export type Aim = {
  x: number
  y: number
  /** Where an army would enter, or none where no army strikes: an ally's land, or a land beyond reach. */
  entry: { x: number; y: number } | null
  lord: number | null
  pinned: boolean
}

export function makeAiming(
  canvas: HTMLCanvasElement,
  state: GameState,
  me: number,
  world: Container,
) {
  const pointer = { x: 0, y: 0 }
  const onPointer = (e: PointerEvent) => {
    pointer.x = e.offsetX
    pointer.y = e.offsetY
  }
  canvas.addEventListener('pointermove', onPointer)
  canvas.addEventListener('pointerdown', onPointer)

  return {
    /** The aim at a tile; none elsewhere, in the opening, or with a work in hand. */
    at(tile: number, pin: boolean, holding: boolean): Aim | null {
      if (tile < 0 || holding || state.tick < state.rules.openingTicks)
        return null
      const gate = entryFor(state, me, tile)
      const owner = state.owner[tile]
      // Another lord's land with nothing to strike, an ally's or one beyond
      // reach: still his name, and the alliance a right click offers.
      if (gate < 0 && !(owner >= 0 && owner !== me)) return null
      const at = gate < 0 ? null : world.toGlobal(siteOf(state, gate))
      return {
        ...pointer,
        entry: at && { x: at.x, y: at.y },
        lord: owner === NEUTRAL ? null : owner,
        pinned: pin,
      }
    },
    destroy() {
      canvas.removeEventListener('pointermove', onPointer)
      canvas.removeEventListener('pointerdown', onPointer)
    },
  }
}
