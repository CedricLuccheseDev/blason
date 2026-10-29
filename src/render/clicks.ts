import { canStart } from '../../engine'
import { keyOf } from './keys'
import type { GameState, Order } from '../../engine'
import type { makeHand } from './hand'

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
) {
  return (tile: number) => {
    if (tile < 0 || me < 0 || dismisses()) return
    if (state.tick < state.rules.openingTicks) {
      if (canStart(state, me, tile))
        send({ player: me, type: 'pickStart', tile })
      return
    }
    const held = hand.holding()
    send(hand.order(me, tile))
    if (held) refresh()
  }
}

/** What a key does: Escape closes the right click's menu; a digit takes an army, a work or a coup in hand, the figures read again. */
export function makeKeys(
  close: () => void,
  hand: Pick<ReturnType<typeof makeHand>, 'key'>,
  refresh: () => void,
) {
  return (e: KeyboardEvent) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === 'Escape') close()
    if (hand.key(keyOf(e))) refresh()
  }
}
