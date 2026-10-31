import { makeClick, makeKeys } from './clicks'
import { makeInput } from './input'
import { affordable } from './keys'
import { tileAt } from './marks'
import type { makeHand } from './hand'
import type { makePin } from './pin'
import type { Container } from 'pixi.js'
import type { GameState, Order } from '../../engine'

// The player's hands on the map: the pointer (a click sends what is in
// hand, a right click opens a lord's menu, clicks.ts) and the keys (an army,
// a work or a coup taken in hand, M for the sound). A spectator has none.

export function makeControls(
  canvas: HTMLCanvasElement,
  world: Container,
  state: GameState,
  me: number,
  {
    send,
    hand,
    pin,
    refresh,
    sound,
  }: {
    send: (order: Order) => void
    hand: ReturnType<typeof makeHand>
    pin: ReturnType<typeof makePin>
    refresh: () => void
    sound: { refuse: () => void; toggle: () => void }
  },
) {
  if (me < 0) return { destroy: () => undefined }
  const click = makeClick(
    state,
    me,
    send,
    hand,
    pin.dismisses,
    refresh,
    sound.refuse,
  )
  const pick = (x: number, y: number) => tileAt(state.grid, x, y)
  const input = makeInput(canvas, world, pick, {
    hover: pin.hover,
    click,
    // A right click puts down what is in hand over the army, as in most
    // strategy games; with the army alone in hand, it opens the place's menu.
    menu: (tile: number) => {
      if (hand.release()) refresh()
      else pin.open(tile)
    },
    away: pin.close,
  })
  const onKey = makeKeys(
    pin.close,
    hand,
    refresh,
    sound.toggle,
    affordable(state, me, hand.hand, sound.refuse),
  )
  window.addEventListener('keydown', onKey)
  return {
    destroy() {
      input.destroy()
      window.removeEventListener('keydown', onKey)
    },
  }
}
