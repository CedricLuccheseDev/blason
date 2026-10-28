import type { Container } from 'pixi.js'

// The player's gestures: a click on a tile, or off the land (-1). A press
// that moves is the camera's drag, not a click; the right button, or a long
// press of a finger, opens what binds the player to the tile's lord.

/** How far a press may wander, in pixels, and still be a click. */
const SLOP = 6
/** How long a finger rests before its press is the right button's. */
const LONG_PRESS_MS = 500

export function makeInput(
  canvas: HTMLCanvasElement,
  view: Container,
  /** What lies at a point of the map: a tile, or -1. */
  pick: (x: number, y: number) => number,
  on: {
    click: (tile: number) => void
    hover: (tile: number) => void
    /** The right button: what binds the player to the tile's lord. */
    menu: (tile: number) => void
    /** The camera moves: whatever was open closes. */
    away: () => void
  },
) {
  let press: { x: number; y: number } | null = null
  let long: ReturnType<typeof setTimeout> | undefined

  function tileAt(e: PointerEvent): number {
    const { x, y } = view.toLocal({ x: e.offsetX, y: e.offsetY })
    return pick(x, y)
  }

  const onDown = (e: PointerEvent) => {
    clearTimeout(long)
    if (e.button !== 0 && e.button !== 2) return
    press = { x: e.clientX, y: e.clientY }
    if (e.pointerType !== 'touch') return
    const tile = tileAt(e)
    long = setTimeout(() => {
      press = null
      on.menu(tile)
    }, LONG_PRESS_MS)
  }
  const onUp = (e: PointerEvent) => {
    clearTimeout(long)
    if (!press || (e.button !== 0 && e.button !== 2)) return
    const moved = Math.hypot(e.clientX - press.x, e.clientY - press.y)
    press = null
    if (moved > SLOP) {
      on.away()
      return
    }
    const tile = tileAt(e)
    if (e.button === 2) on.menu(tile)
    else on.click(tile)
  }
  const onWheel = () => on.away()
  const onMove = (e: PointerEvent) => {
    if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > SLOP)
      clearTimeout(long)
    on.hover(press ? -1 : tileAt(e))
  }
  const onLeave = () => on.hover(-1)
  const onMenu = (e: Event) => e.preventDefault()
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerleave', onLeave)
  canvas.addEventListener('contextmenu', onMenu)
  canvas.addEventListener('wheel', onWheel, { passive: true })

  return {
    destroy() {
      clearTimeout(long)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('contextmenu', onMenu)
      canvas.removeEventListener('wheel', onWheel)
    },
  }
}
