import { makeGestures } from './gestures'
import type { Application, Container } from 'pixi.js'

// The camera: the wheel zooms towards the pointer, smoothed over a few
// frames; a drag moves the map, out past its edges if need be, and two
// fingers pinch it (gestures.ts); the Home key flies back to the player's
// realm, or to the whole land when there is none. It goes out farther than
// the whole land, until the page shows round it.

/** The widest and the closest zoom, against the whole land on screen: at the widest it fills half the screen. */
const [FAR, CLOSE] = [0.5, 9]

export type Box = { left: number; top: number; right: number; bottom: number }

export function makeCamera(
  app: Application,
  world: Container,
  size: { width: number; height: number },
  home: () => Box | null,
) {
  const canvas = app.canvas
  let target = 1
  let anchor = { x: 0, y: 0 }
  // Still showing the whole land, as fitted: a resize fits it again.
  let fitted = true
  // A point of the world the camera is flying to, and frames left to get there.
  let aim: { x: number; y: number; frames: number } | null = null

  const fitZoom = () =>
    Math.min(app.screen.width / size.width, app.screen.height / size.height) *
    0.96
  /** A zoom within the camera's reach. */
  const within = (k: number) =>
    Math.max(FAR * fitZoom(), Math.min(CLOSE * fitZoom(), k))

  function clamp() {
    const k = world.scale.x
    const w = size.width * k
    const h = size.height * k
    const { width, height } = app.screen
    // The map may leave the screen up to its middle: any place, a corner's
    // too, can be brought to the centre. The page round it fills the rest.
    const minX = width / 2 - w
    const maxX = width / 2
    const minY = height / 2 - h
    const maxY = height / 2
    world.x = Math.max(minX, Math.min(maxX, world.x))
    world.y = Math.max(minY, Math.min(maxY, world.y))
  }

  function apply(k: number) {
    world.x = anchor.x - ((anchor.x - world.x) / world.scale.x) * k
    world.y = anchor.y - ((anchor.y - world.y) / world.scale.y) * k
    world.scale.set(k)
    clamp()
  }

  function fit() {
    fitted = true
    target = fitZoom()
    world.scale.set(target)
    world.x = (app.screen.width - size.width * target) / 2
    world.y = (app.screen.height - size.height * target) / 2
  }

  function focus(box: Box) {
    fitted = false
    const room = 160
    const k = Math.min(
      app.screen.width / (box.right - box.left + room),
      app.screen.height / (box.bottom - box.top + room),
    )
    target = Math.max(fitZoom(), Math.min((CLOSE / 2) * fitZoom(), k))
    aim = {
      x: (box.left + box.right) / 2,
      y: (box.top + box.bottom) / 2,
      frames: 90,
    }
  }

  function fly(to: { x: number; y: number; frames: number }) {
    const k = world.scale.x + (target - world.scale.x) * 0.15
    world.scale.set(k)
    world.x += (app.screen.width / 2 - to.x * k - world.x) * 0.15
    world.y += (app.screen.height / 2 - to.y * k - world.y) * 0.15
    clamp()
    to.frames--
    if (to.frames <= 0) aim = null
  }

  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    fitted = false
    aim = null
    const factor = e.deltaY < 0 ? 1.25 : 1 / 1.25
    target = within(target * factor)
    anchor = { x: e.offsetX, y: e.offsetY }
  }
  const gestures = makeGestures(canvas, {
    start: () => (aim = null),
    pan(dx, dy) {
      fitted = false
      world.x += dx
      world.y += dy
      clamp()
    },
    pinch(factor, at) {
      fitted = false
      anchor = at
      target = within(world.scale.x * factor)
      apply(target)
    },
  })
  /** Back to the player's realm, or the whole land when he has none. */
  function goHome() {
    const box = home()
    if (box) focus(box)
    else fit()
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Home') goHome()
  }
  canvas.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('keydown', onKey)
  fit()

  return {
    /** Zoom relative to the whole land on screen: 1 shows it all, less shows the page round it. */
    level: () => world.scale.x / fitZoom(),
    zoom: () => world.scale.x,
    /** The part of the world on screen, in world units. */
    view() {
      const k = world.scale.x
      return {
        left: -world.x / k,
        top: -world.y / k,
        right: (app.screen.width - world.x) / k,
        bottom: (app.screen.height - world.y) / k,
      }
    },
    /** One frame of the smoothing towards the wheel's target. */
    step() {
      if (aim) {
        fly(aim)
        return
      }
      const k = world.scale.x
      if (Math.abs(target - k) / target < 0.002) return
      apply(k + (target - k) * 0.3)
    },
    fit,
    focus,
    home: goHome,
    /** One step closer (1) or farther (-1), round the middle of the screen. */
    zoomBy(step: 1 | -1) {
      fitted = false
      aim = null
      target = within(target * 1.25 ** (2 * step))
      anchor = { x: app.screen.width / 2, y: app.screen.height / 2 }
    },
    /** After the screen changed size: fit again, or keep the view inside. */
    resize() {
      if (fitted) fit()
      else {
        target = within(target)
        clamp()
      }
    },
    destroy() {
      canvas.removeEventListener('wheel', onWheel)
      gestures.destroy()
      window.removeEventListener('keydown', onKey)
    },
  }
}
