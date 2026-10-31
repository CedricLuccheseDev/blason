import {
  UNIT,
  WORKS,
  barredBy,
  canBuild,
  coupPrice,
  launchSite,
  reachesSea,
} from '../../engine'
import { courseNow } from './course'
import { siteOf } from './marks'
import { onCanvas } from './input'
import type { Container } from 'pixi.js'
import type { Army, Coup, GameState, Work } from '../../engine'
import type { Hand } from './hand'

// What the pointer aims at: another's land or free land a click would
// strike, where the army would enter, and whose land it is; over any other
// lord's land, even one no army of mine reaches, his name, for the right
// click's menu he has there; over my own land, the works that may stand on
// the tile; over the water a port of mine reaches, a warship to fit out
// there (« Parfait pour le tableau, fais quelque chose d'homogene »). A
// right click (or a long press) pins it there, for the menu of what may be
// done there (components/game/LordMenu.tsx, PlaceMenu.tsx). With a coup in hand, the coup, where it
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
  /** Over my own land, the works that may stand on the tile, for the right click's menu; none elsewhere. */
  works: ReadonlyArray<Work>
  /** Over the water a port of mine reaches: a warship may be fitted out for it. */
  sea: boolean
}

export function makeAiming(
  canvas: HTMLCanvasElement,
  state: GameState,
  me: number,
  world: Container,
) {
  const pointer = { x: 0, y: 0 }
  const onPointer = (e: PointerEvent) => {
    const { x, y } = onCanvas(canvas, e)
    pointer.x = x
    pointer.y = y
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
      works: [],
      sea: false,
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
      works: [],
      sea: false,
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
      works: [],
      sea: false,
    }
  }

  /** Over my own land, the works that may stand there; over the water a port of mine reaches, a warship; none elsewhere. */
  function placeAt(tile: number, pin: boolean): Aim | null {
    const mine = state.owner[tile] === me
    const works = mine ? WORKS.filter((w) => canBuild(state, me, tile, w)) : []
    const sea = !mine && reachesSea(state, me, tile)
    if (works.length === 0 && !sea) return null
    return {
      ...pointer,
      entry: null,
      lord: null,
      pinned: pin,
      coup: null,
      barred: false,
      works,
      sea,
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
      // A right click opens the menu of the place: a lord's on his land, the
      // works on mine, a warship on the water a port of mine reaches.
      if (pin) {
        const aim = strikeAt(tile, true, hand.army)
        return aim && aim.lord !== null ? aim : placeAt(tile, true)
      }
      if (hand.work) return null
      if (hand.coup) return coupAt(tile, hand.coup)
      return strikeAt(tile, false, hand.army) ?? placeAt(tile, false)
    },
    destroy() {
      canvas.removeEventListener('pointermove', onPointer)
      canvas.removeEventListener('pointerdown', onPointer)
    },
  }
}
