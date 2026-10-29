import {
  NEUTRAL,
  UNIT,
  barredBy,
  coupPrice,
  entryFor,
  launchSite,
} from '../../engine'
import { siteOf } from './marks'
import type { Container } from 'pixi.js'
import type { Coup, GameState } from '../../engine'
import type { Hand } from './hand'

// What the pointer aims at: another's land or free land a click would
// strike, where the army would enter, whose land it is, and whether a right
// click (or a long press) pinned it there; over any other lord's land, even
// one no army of mine reaches, his name and the alliance a right click
// offers. With a coup in hand, the coup, where it would leave from, and
// whether it may go and be paid for. In the opening, only a spot where the
// standard may not stand, another lord's being too near. In pixels of the
// map's element.

/** Where the pointer aims at another's land: where the army would enter, whose land, and whether a right click pinned it there. */
export type Aim = {
  x: number
  y: number
  /** Where an army would enter, or a coup leave from; none where neither may go: an ally's land, or a land beyond reach. */
  entry: { x: number; y: number } | null
  lord: number | null
  pinned: boolean
  /** The coup in hand: whether it may strike there now, and whether the gold is there for it. */
  coup: { coup: Coup; allowed: boolean; can: boolean } | null
  /** In the opening, whether another lord's standard is too near for mine there. */
  barred: boolean
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
  const onScreen = (tile: number) => {
    const at = world.toGlobal(siteOf(state, tile))
    return { x: at.x, y: at.y }
  }

  /** A coup aimed at a tile: where it would leave from, whether it may, whether it is paid. */
  function coupAt(tile: number, pin: boolean, coup: Coup): Aim {
    const site = launchSite(state, me, tile, coup)
    const owner = state.owner[tile]
    const price = coupPrice(state, me, coup) * UNIT
    return {
      ...pointer,
      entry: site < 0 ? null : onScreen(site),
      lord: owner >= 0 && owner !== me ? owner : null,
      pinned: pin,
      coup: { coup, allowed: site >= 0, can: state.players[me].gold >= price },
      barred: false,
    }
  }

  /** In the opening, a tile where the standard may not stand for another's too near; none elsewhere, and nothing pinned. */
  function plantAt(tile: number, pin: boolean): Aim | null {
    if (pin || barredBy(state, me, tile).length === 0) return null
    return {
      ...pointer,
      entry: null,
      lord: null,
      pinned: false,
      coup: null,
      barred: true,
    }
  }

  return {
    /** The aim at a tile; none elsewhere or with a work in hand. */
    at(tile: number, pin: boolean, hand: Hand): Aim | null {
      if (tile < 0) return null
      if (state.tick < state.rules.openingTicks) return plantAt(tile, pin)
      if (hand.work) return null
      if (hand.coup) return coupAt(tile, pin, hand.coup)
      const gate = entryFor(state, me, tile)
      const owner = state.owner[tile]
      // Another lord's land with nothing to strike, an ally's or one beyond
      // reach: still his name, and the alliance a right click offers.
      if (gate < 0 && !(owner >= 0 && owner !== me)) return null
      return {
        ...pointer,
        entry: gate < 0 ? null : onScreen(gate),
        lord: owner === NEUTRAL ? null : owner,
        pinned: pin,
        coup: null,
        barred: false,
      }
    },
    destroy() {
      canvas.removeEventListener('pointermove', onPointer)
      canvas.removeEventListener('pointerdown', onPointer)
    },
  }
}
