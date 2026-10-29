import { hash } from '../pen'
import { TONE } from '../palette'
import { css, ellipse, line, lw } from './ink'
import { contact, crescent, laid } from './light'
import type { Pen } from './ink'
import type { Detail } from './house'

// The ground's trees as an engraver draws them, in map units: a broadleaf
// tree and a fir standing in the map's one light (art/light.ts), a darker
// contact at their foot, their lower right in shade, their shadows cast
// apart, and a tuft of grass. Each in the fill and the ink it is given: the
// ground's layer picks them from the land they stand on.

/** A tree's place: its foot at (x, y), its crown so wide. */
type Stand = readonly [number, number, number]

/** The crown of a broadleaf: its middle, over the foot. */
const crownOf = ([x, y, r]: Stand) => [x, y - r * 1.45] as const

/** A broadleaf's crown, its edge billowing; `h` and the foot its own numbers. */
function crownEdge(
  cx: number,
  cy: number,
  r: number,
  h: number,
  [x, y]: readonly [number, number],
): Path2D {
  const edge = new Path2D()
  const n = 7 + Math.floor(h * 3)
  for (let k = 0; k <= n; k++) {
    const ang = (k / n) * Math.PI * 2 + h * 6
    const rr = r * (0.82 + 0.22 * hash(x + k, y, 3))
    const px = cx + Math.cos(ang) * rr
    const py = cy + Math.sin(ang) * rr * 0.92
    if (k === 0) edge.moveTo(px, py)
    else {
      const mid = ang - Math.PI / n
      const bulge = rr * 1.22
      edge.quadraticCurveTo(
        cx + Math.cos(mid) * bulge,
        cy + Math.sin(mid) * bulge * 0.92,
        px,
        py,
      )
    }
  }
  edge.closePath()
  return edge
}

/** A broadleaf tree, its foot at (x, y), its crown so wide; `h` a number of its own. */
export function tree(
  p: Pen,
  at: Stand,
  fill: number,
  ink: number,
  detail: Detail,
  h: number,
) {
  const [x, y, r] = at
  const g = p.g
  contact(p, [x, y, r * 0.42, r * 0.13], 0.2)
  line(
    p,
    [
      [x, y + 0.1],
      [x + 0.05, y - r * 0.9],
    ],
    1.1,
    ink,
    0.8,
  )
  const [cx, cy] = crownOf(at)
  const edge = crownEdge(cx, cy, r, h, [x, y])
  g.fillStyle = css(fill)
  g.fill(edge)
  g.save()
  g.clip(edge)
  crescent(p, [cx, cy, r * 1.05], TONE.ink, detail === 2 ? 0.1 : 0.07)
  g.restore()
  g.lineWidth = lw(p, detail === 2 ? 0.9 : 0.75)
  g.strokeStyle = css(ink, 0.7)
  g.stroke(edge)
  if (detail === 2) crown(p, cx, cy, r, ink)
}

/** Up close, the light on the crown's upper left, the shade hatched on its lower right. */
function crown(p: Pen, cx: number, cy: number, r: number, ink: number) {
  const g = p.g
  ellipse(p, cx - r * 0.3, cy - r * 0.32, r * 0.42, r * 0.3)
  g.fillStyle = css(TONE.white, 0.22)
  g.fill()
  g.beginPath()
  for (let k = 0; k < 4; k++) {
    const ang = 0.15 + k * 0.42
    g.moveTo(cx + Math.cos(ang) * r * 0.42, cy + Math.sin(ang) * r * 0.42)
    g.lineTo(cx + Math.cos(ang) * r * 0.82, cy + Math.sin(ang) * r * 0.78)
  }
  g.lineWidth = lw(p, 0.55)
  g.strokeStyle = css(ink, 0.35)
  g.stroke()
}

/** A broadleaf's silhouette laid on the ground by the light, for its cast shadow. */
export function treeShadow(g: CanvasRenderingContext2D, at: Stand) {
  const [x, y, r] = at
  const [cx, cy] = crownOf(at)
  laid(g, y, () => {
    g.beginPath()
    g.rect(x - r * 0.1, y - r * 0.9, r * 0.2, r * 0.9)
    g.ellipse(cx, cy, r * 0.98, r * 0.9, 0, 0, Math.PI * 2)
    g.fill()
  })
}

/** A fir's height over its foot. */
const firHeight = (r: number) => r * 3.1

/** A fir, its foot at (x, y). */
export function fir(
  p: Pen,
  [x, y, r]: Stand,
  fill: number,
  ink: number,
  detail: Detail,
) {
  const g = p.g
  contact(p, [x, y, r * 0.5, r * 0.15], 0.2)
  line(
    p,
    [
      [x, y + 0.1],
      [x, y - r * 0.6],
    ],
    1,
    ink,
    0.8,
  )
  const h = firHeight(r)
  g.beginPath()
  g.moveTo(x, y - h)
  g.lineTo(x + r * 0.55, y - h * 0.55)
  g.lineTo(x + r * 0.32, y - h * 0.55)
  g.lineTo(x + r * 0.85, y - h * 0.2)
  g.lineTo(x - r * 0.85, y - h * 0.2)
  g.lineTo(x - r * 0.32, y - h * 0.55)
  g.lineTo(x - r * 0.55, y - h * 0.55)
  g.closePath()
  g.fillStyle = css(fill)
  g.fill()
  g.lineWidth = lw(p, detail === 2 ? 0.9 : 0.75)
  g.strokeStyle = css(ink, 0.7)
  g.lineJoin = 'round'
  g.stroke()
  // Its right side turned from the light.
  g.beginPath()
  g.moveTo(x + 0.05, y - h + 0.3)
  g.lineTo(x + r * 0.5, y - h * 0.56)
  g.lineTo(x + r * 0.27, y - h * 0.56)
  g.lineTo(x + r * 0.78, y - h * 0.22)
  g.lineTo(x + 0.05, y - h * 0.22)
  g.closePath()
  g.fillStyle = css(TONE.ink, detail === 2 ? 0.1 : 0.07)
  g.fill()
  if (detail < 2) return
  g.beginPath()
  for (let k = 0; k < 3; k++) {
    const yy = y - h * (0.28 + k * 0.17)
    g.moveTo(x + 0.1, yy)
    g.lineTo(x + r * (0.55 - k * 0.12), yy + r * 0.25)
  }
  g.lineWidth = lw(p, 0.55)
  g.strokeStyle = css(ink, 0.35)
  g.stroke()
}

/** A fir's silhouette laid on the ground by the light, for its cast shadow. */
export function firShadow(g: CanvasRenderingContext2D, [x, y, r]: Stand) {
  const h = firHeight(r)
  laid(g, y, () => {
    g.beginPath()
    g.moveTo(x - r * 0.1, y)
    g.lineTo(x - r * 0.85, y - h * 0.2)
    g.lineTo(x, y - h)
    g.lineTo(x + r * 0.85, y - h * 0.2)
    g.lineTo(x + r * 0.1, y)
    g.closePath()
    g.fill()
  })
}

/** A tuft of grass, three blades. */
export function tuft(p: Pen, x: number, y: number, ink: number, alpha: number) {
  const g = p.g
  g.beginPath()
  g.moveTo(x - 0.35, y)
  g.lineTo(x - 0.6, y - 0.55)
  g.moveTo(x, y)
  g.lineTo(x + 0.02, y - 0.75)
  g.moveTo(x + 0.35, y)
  g.lineTo(x + 0.6, y - 0.55)
  g.lineWidth = lw(p, 0.6)
  g.strokeStyle = css(ink, alpha)
  g.lineCap = 'round'
  g.stroke()
}
