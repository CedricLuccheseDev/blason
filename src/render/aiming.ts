import { UNIT, barredBy, coupPrice, launchSite } from '../../engine'
import { courseNow } from './course'
import { siteOf } from './marks'
import type { Container } from 'pixi.js'
import type { Army, Coup, GameState } from '../../engine'
import type { Hand } from './hand'

// What the pointer aims at: another's land or free land a click would
// strike, where the army would enter, and whose land it is; over any other
// lord's land, even one no army of mine reaches, his name, for the right
// click's menu he has there. A right click (or a long press) pins it on
// another lord's land alone, whatever is in hand, for that menu
// (components/game/LordMenu.tsx). With a coup in hand, the coup, where it
// would leave from, and whether it may go and be paid for. In the opening,
// only a spot where the standard may not stand, another lord's being too
// near. In pixels of the map's element.

/** Where the pointer aims at another's land: where the army would enter, whose land, and whether a right click pinned it there. */
export type Aim = {
  x: number
  y: number
  /** Where an army would enter, or a coup leave from; none where neither may go: an ally's land, or a land beyond reach. */
  entry: { x: number; y: number } | null
  lord: number | null
  /** Pinned by a right click on the lord's land, for his menu. */
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
  function coupAt(tile: number, coup: Coup): Aim {
    const site = launchSite(state, me, tile, coup)
    const owner = state.owner[tile]
    const price = coupPrice(state, me, coup) * UNIT
    return {
      ...pointer,
      entry: site < 0 ? null : onScreen(site),
      lord: owner >= 0 && owner !== me ? owner : null,
      pinned: false,
      coup: { coup, allowed: site >= 0, can: state.players[me].gold >= price },
      barred: false,
    }
  }

  /** In the opening, a tile where the standard may not stand for another's too near; none elsewhere. */
  function plantAt(tile: number): Aim | null {
    if (barredBy(state, me, tile).length === 0) return null
    return {
      ...pointer,
      entry: null,
      lord: null,
      pinned: false,
      coup: null,
      barred: true,
    }
  }

  /** Where the army in hand would strike a tile, and whose it is; none on my land, or where it may not go and no lord holds it. */
  function strikeAt(tile: number, pin: boolean, army: Army): Aim | null {
    const gate = courseNow(state, me, tile, army)?.entry ?? -1
    const owner = state.owner[tile]
    const lord = owner >= 0 && owner !== me ? owner : null
    // Another lord's land with nothing to strike, an ally's or one beyond
    // reach: still his name, and his menu under a right click.
    if (gate < 0 && lord === null) return null
    return {
      ...pointer,
      entry: gate < 0 ? null : onScreen(gate),
      lord,
      pinned: pin,
      coup: null,
      barred: false,
    }
  }

  return {
    /** The pointer set where it is on the HUD, off the map: a lord's menu opened from his line in the list stands by it. */
    point(x: number, y: number) {
      pointer.x = x
      pointer.y = y
    },
    /** The aim at a tile, or pinned there by a right click; none elsewhere. */
    at(tile: number, pin: boolean, hand: Hand): Aim | null {
      if (tile < 0) return null
      if (state.tick < state.rules.openingTicks)
        return pin ? null : plantAt(tile)
      // A right click opens a lord's menu, on his land alone, whatever is in hand.
      if (pin) {
        const aim = strikeAt(tile, true, hand.army)
        return aim && aim.lord !== null ? aim : null
      }
      if (hand.work) return null
      if (hand.coup) return coupAt(tile, hand.coup)
      return strikeAt(tile, false, hand.army)
    },
    destroy() {
      canvas.removeEventListener('pointermove', onPointer)
      canvas.removeEventListener('pointerdown', onPointer)
    },
  }
}
