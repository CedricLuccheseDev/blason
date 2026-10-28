import { makeAssets, texturesOf } from './assets'
import { paint, texture } from './paint/canvas'
import { setStage } from './stage'
import { throwDie } from './dice'
import { move, still } from './motion'
import { layOverlays } from './overlays'
import { overlaySpecs } from './pins'
import { followPointer, pickAt } from './touch'
import { LAYOUTS, MAP_PX } from './sizes'
import type { Feel } from './motion'
import type { Words } from './assets'
import type { Pick } from './stage'
import type { Variant } from './sizes'

// The home as a real table, in 3D (Three.js): the board in the middle with a
// game on it, the box's lid, the cards of the modes, the seal that plays,
// the die, the journal, the candle for light. This is its contract: the
// home mounts a table in a frame, lays its own HTML over it (each piece
// named by `data-ov`, see overlays.ts), and tells it what the player chose;
// the table says what the pointer touched. It decides nothing.

export type { Pick } from './stage'
export type { Variant } from './sizes'
export type { Words } from './assets'
export type { Mode } from './modes'
export { variantOf } from './sizes'

export type TableHandle = {
  /** What the player has chosen: the card turned, the journal read, the thing focused. */
  view: (
    next: Partial<{
      open: number | null
      reading: boolean
      focus: Pick | null
    }>,
  ) => void
  /** The seal pressed. */
  press: () => void
  /** The die rolled to land on the mode `mode` (0 to 2); done when it lies still. */
  roll: (mode: number) => Promise<void>
  /** The camera dives onto the board (or rises back); done when it is there. */
  dive: (into: boolean) => Promise<void>
  /** The picture the board shows from now on, read again a few times a second. */
  show: (map: HTMLCanvasElement) => void
  /** Whether the table is drawn at all (not while the board fills the screen). */
  pause: (paused: boolean) => void
  destroy: () => void
}

type Options = {
  variant: Variant
  words: Words
  /** The player's colour, as CSS and as a number. */
  colour: [string, number]
  onPick: (pick: Pick | null) => void
}

/** How often the board's map is read again, in ms. */
const MAP_EVERY = 250

export async function mountTable(
  frame: HTMLElement,
  overlay: HTMLElement,
  o: Options,
): Promise<TableHandle> {
  const A = await makeAssets(o.words, o.colour[0])
  // Until a game is shown on it, the board is blank parchment.
  const map = texture(
    paint(MAP_PX.w, MAP_PX.h, (g, w, h) => {
      g.fillStyle = '#efe3c4'
      g.fillRect(0, 0, w, h)
    }),
  )
  const S = setStage(A, o.variant, map, o.colour[1])
  S.renderer.domElement.setAttribute('aria-hidden', 'true')
  S.renderer.domElement.className = 'table-gl'
  frame.prepend(S.renderer.domElement)
  const feel: Feel = { open: null, reading: false, hover: null, zoom: false }
  let focus: Pick | null = null
  let pointed: Pick | null = null
  let size: [number, number, number] = [0, 0, 1]
  const fit = () => {
    const [w, h] = [frame.clientWidth, frame.clientHeight]
    if (!w || !h) return
    S.renderer.setSize(w, h, false)
    S.camera.aspect = w / h
    size = [
      w,
      h,
      Math.min(
        w / LAYOUTS[o.variant].width,
        h / (o.variant === 'phone' ? 844 : 900),
      ),
    ]
  }
  const resized = new ResizeObserver(fit)
  resized.observe(frame)
  fit()
  let visible = true
  const seen = new IntersectionObserver(
    (es) => (visible = es.some((e) => e.isIntersecting)),
  )
  seen.observe(frame)
  const specs = overlaySpecs(S, feel)
  const unfollow = followPointer(
    frame,
    (e) => pickAt(frame, S.camera, S.picks, e),
    {
      hover: (p) => (pointed = p),
      click: o.onPick,
    },
  )

  let zoomE = 0
  let dived: (() => void) | null = null
  let paused = false
  let mapRead = 0
  let last = performance.now()
  const t0 = last
  let raf = 0
  const frameOf = (now: number) => {
    raf = requestAnimationFrame(frameOf)
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now
    if (paused || !visible || !size[0] || document.hidden) return
    if (now - mapRead > MAP_EVERY) {
      mapRead = now
      map.needsUpdate = true
    }
    const target = feel.zoom ? 1 : 0
    zoomE = still()
      ? target
      : zoomE +
        Math.sign(target - zoomE) * Math.min(Math.abs(target - zoomE), dt / 0.9)
    if (zoomE === target && dived) {
      dived()
      dived = null
    }
    feel.hover = pointed ?? focus
    if (move(S, feel, [(now - t0) / 1000, now, dt], zoomE))
      S.renderer.shadowMap.needsUpdate = true
    S.scene.updateMatrixWorld()
    S.renderer.render(S.scene, S.camera)
    layOverlays(overlay, specs, S.camera, size)
  }
  raf = requestAnimationFrame(frameOf)

  return {
    view(next) {
      if ('open' in next) feel.open = next.open ?? null
      if ('reading' in next) feel.reading = next.reading ?? false
      if ('focus' in next) focus = next.focus ?? null
    },
    press: () => (S.seal.pressT = performance.now()),
    show(canvas) {
      map.image = canvas
      map.needsUpdate = true
    },
    roll: (mode) => throwDie(S, mode, still()),
    dive(into) {
      feel.zoom = into
      dived?.()
      return new Promise((done) => (dived = done))
    },
    pause(p) {
      paused = p
    },
    destroy() {
      cancelAnimationFrame(raf)
      unfollow()
      resized.disconnect()
      seen.disconnect()
      for (const t of [...texturesOf(A), map]) t.dispose()
      S.renderer.dispose()
      S.renderer.forceContextLoss()
      S.renderer.domElement.remove()
    },
  }
}
