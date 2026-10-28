import { TONE } from '../palette'
import { css, ellipse } from './ink'
import type { Pen } from './ink'

// One light over the whole map, from the upper left, so that what stands on
// it stands, never pasted on: each thing casts on the ground a soft shadow
// towards the lower right, as long as it is high; a darker contact at its
// foot; its faces turned away from the light in shade. The shadows are
// painted once with what casts them, into the decoration's chunks and the
// works' textures, never each frame.

/** How far a point so high above the ground falls from its foot, across and down, per unit of height. */
export const LIGHT = { across: 0.62, down: 0.3 }

/**
 * Draws what stands on a foot line laid flat on the ground by the light: a
 * point h above the line falls h * across to the right and h * down below
 * it, mirrored as a shadow is.
 */
export function laid(
  g: CanvasRenderingContext2D,
  footY: number,
  draw: () => void,
) {
  g.save()
  g.transform(
    1,
    0,
    -LIGHT.across,
    -LIGHT.down,
    LIGHT.across * footY,
    (1 + LIGHT.down) * footY,
  )
  draw()
  g.restore()
}

let scratch: HTMLCanvasElement | null = null

/**
 * A small canvas over another, `k` of its pixels to one of the other's and
 * a pixel of margin round it, cleared and drawn with the same transform
 * scaled down.
 */
function scratchFor(g: CanvasRenderingContext2D, k: number) {
  const width = Math.ceil(g.canvas.width * k) + 2
  const height = Math.ceil(g.canvas.height * k) + 2
  scratch ??= document.createElement('canvas')
  if (scratch.width !== width || scratch.height !== height) {
    scratch.width = width
    scratch.height = height
  }
  const s = scratch.getContext('2d')
  if (!s) return null
  s.setTransform(1, 0, 0, 1, 0, 0)
  s.clearRect(0, 0, width, height)
  const m = g.getTransform()
  s.setTransform(m.a * k, m.b * k, m.c * k, m.d * k, m.e * k + 1, m.f * k + 1)
  s.fillStyle = css(TONE.ink)
  s.globalAlpha = 1
  return s
}

/**
 * The cast shadows of a whole drawing in one pass: the silhouettes `draw`
 * fills (each laid by the light) gathered on a small canvas, a pixel of it
 * so many units wide, where those that overlap make one, then stretched
 * over the pen's canvas once, so faint: the stretching softens their edge.
 */
export function cast(
  p: Pen,
  alpha: number,
  soft: number,
  draw: (g: CanvasRenderingContext2D) => void,
) {
  const g = p.g
  const m = g.getTransform()
  const k = Math.min(1, 1 / (soft * Math.hypot(m.a, m.b)))
  const s = scratchFor(g, k)
  if (!s || !scratch) return
  draw(s)
  g.save()
  g.setTransform(1, 0, 0, 1, 0, 0)
  g.globalAlpha = alpha
  g.imageSmoothingEnabled = true
  g.drawImage(scratch, -1 / k, -1 / k, scratch.width / k, scratch.height / k)
  g.restore()
}

/** The darker ground right under a thing's foot, where no light reaches. */
export function contact(
  p: Pen,
  [x, y, rx, ry]: readonly [number, number, number, number],
  alpha: number,
  color: number = TONE.ink,
) {
  ellipse(p, x + rx * 0.18, y + ry * 0.2, rx, ry)
  p.g.fillStyle = css(color, alpha)
  p.g.fill()
}

/**
 * The shade on a round mass, a crown or a dome: a crescent on its lower
 * right, between its edge and a curve across it, in so much ink.
 */
export function crescent(
  p: Pen,
  [cx, cy, r]: readonly [number, number, number],
  color: number,
  alpha: number,
) {
  const g = p.g
  const d = Math.SQRT1_2 * r
  g.beginPath()
  g.arc(cx, cy, r, -Math.PI / 4, (3 * Math.PI) / 4)
  g.quadraticCurveTo(cx + 0.25 * r, cy + 0.25 * r, cx + d, cy - d)
  g.closePath()
  g.fillStyle = css(color, alpha)
  g.fill()
}
