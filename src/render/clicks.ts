import { canStart } from '../../engine'
import { keyOf } from './keys'
import { tilePlaces } from './places'
import { canSend } from './course'
import type { GameState, Order } from '../../engine'
import type { makeHand } from './hand'
import type { Spot } from './roads'

// What a left click on the map sends, and a key: in the opening, the player's
// standard, only where it may stand (the last one sent is the one a lone
// player keeps when the opening begins again online); after it, what is in
// hand, an army or a work or a coup, the figures read again when it was a
// work or a coup put down.

export function makeClick(
  state: GameState,
  me: number,
  send: (order: Order) => void,
  hand: Pick<ReturnType<typeof makeHand>, 'holding' | 'order'>,
  /** Whether this click only closes the right click's menu. */
  dismisses: () => boolean,
  refresh: () => void,
  /** An army asked for that cannot go: no village free, or no man to raise. */
  refuse: () => void,
) {
  return (tile: number) => {
    if (tile < 0 || me < 0 || dismisses()) return
    if (state.tick < state.rules.openingTicks) {
      if (canStart(state, me, tile))
        send({ player: me, type: 'pickStart', tile })
      return
    }
    const held = hand.holding()
    const order = hand.order(me, tile)
    // Said, not silently dropped: on a phone no aim shows beforehand that
    // nothing can go (« quand on simple clic dans un territoire d'un autre
    // joueur ça attaque pas », its village's army out).
    if (
      order.type === 'attack' &&
      state.owner[tile] !== me &&
      !canSend(state, me, order.army)
    ) {
      refuse()
      return
    }
    send(order)
    if (held) refresh()
  }
}

/** What a key does: Escape closes the right click's menu; M mutes or brings back the sound; a digit takes an army, a work or a coup in hand, the figures read again. */
export function makeKeys(
  close: () => void,
  hand: Pick<ReturnType<typeof makeHand>, 'key'>,
  refresh: () => void,
  /** M: the sound muted or back. */
  mute: () => void,
) {
  return (e: KeyboardEvent) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === 'Escape') close()
    if (e.key.toLowerCase() === 'm') mute()
    if (hand.key(keyOf(e))) refresh()
  }
}

/** The tile a lord's name is written on, where his menu opens from his line in the list; -1 while he holds no land. */
function nameTile(state: GameState, lord: number): number {
  const at = tilePlaces(state).get(lord)
  if (!at) return -1
  const { width, size } = state.grid
  return Math.floor(at.y / size) * width + Math.floor(at.x / size)
}

/** A lord's menu opened from his line in the list, by the pointer there, as a right click on his name's tile would open it. */
export function menuFrom(
  state: GameState,
  point: (x: number, y: number) => void,
  open: (tile: number) => void,
) {
  return (lord: number, x: number, y: number) => {
    point(x, y)
    open(nameTile(state, lord))
  }
}

/** Where a click on the HUD brings the camera: to an army of mine, by the village or market it left from, grown while pointed at; to a lord's land, where his name is written. */
export function seeking(
  scene: {
    flagOf: (from: number) => Spot | null
    placeOf: (lord: number) => Spot | null
    lightArmy: (from: number | null) => void
  },
  camera: { toward: (x: number, y: number) => void },
) {
  const go = (at: Spot | null) => {
    if (at) camera.toward(at.x, at.y)
  }
  return {
    seek: (from: number) => go(scene.flagOf(from)),
    spot: scene.lightArmy,
    seekLord: (lord: number) => go(scene.placeOf(lord)),
  }
}
