import type { Aim } from './aiming'

// The aim the HUD is shown (client.ts): the pointer's as it moves over the
// map, or the one a right click pinned on another lord's land, his menu
// open there (components/game/LordMenu.tsx), which stays until it is
// closed: by Escape, a click elsewhere on the map, the camera moved, the
// pointer gone far, an act of the menu done. A click on the map only closes
// it, and so does one just after the pointer left it behind, so that no
// army goes out of a click meant to put the menu away. A right click opens
// the place's menu there: a lord's on his land, the works on mine, a warship
// on the water a port of mine reaches; anywhere else it only closes what was
// open.

/** How long after the pointer left a menu behind a click on the map only finishes closing it, in milliseconds. */
const GRACE = 400

export function makePin(
  /** The aim at a tile, as the pointer would show it, or pinned there by a right click. */
  aimAt: (tile: number, pin: boolean) => Aim | null,
  show: (aim: Aim | null) => void,
) {
  let hovered = -1
  let pinned: Aim | null = null
  let at = -1
  let left = -Infinity

  /** The pointer's aim shown again, but while a menu is open. */
  const again = () => {
    if (!pinned) show(aimAt(hovered, false))
  }
  function close() {
    pinned = null
    at = -1
    show(aimAt(hovered, false))
  }

  return {
    /** The tile under the pointer, -1 off the land. */
    hovered: () => hovered,
    /** The tile of the menu open, -1 while none is. */
    menuAt: () => at,
    /** Whether a click on the map only closes a menu: one open, closed by it, or one the pointer left behind a moment ago. */
    dismisses(): boolean {
      if (pinned) {
        close()
        return true
      }
      return performance.now() - left < GRACE
    },
    hover(tile: number) {
      hovered = tile
      again()
    },
    again,
    close,
    /** The pointer gone far from the menu: closed, a click on the map just after only finishing it. */
    leave() {
      close()
      left = performance.now()
    },
    /** A right click on a tile: the place's menu opened there; where nothing may be done, only what was open closes. */
    open(tile: number) {
      const aim = aimAt(tile, true)
      if (!aim) {
        close()
        return
      }
      pinned = aim
      at = tile
      show(pinned)
    },
  }
}
