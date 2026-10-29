import { hash } from '../pen'
import { TONE } from '../palette'
import { css, lw } from './ink'
import { laid } from './light'
import type { Pen } from './ink'
import type { Detail } from './house'

// A hill as the old maps draw one, standing in the map's one light
// (art/light.ts): a contour rising to its crest, thicker there, its flank
// on the lower right shaded and hatched, its shadow cast apart. In map
// units: its foot's middle at (x, y), so wide each side and so high.

type Mound = readonly [number, number, number, number]

/** The crest of a hill, a little off its middle by its own number `h`. */
const crestOf = ([x, y, bw, hh]: Mound, h: number) =>
  [x - bw * 0.12 + h * bw * 0.2, y - hh] as const

/** The contour from the left foot over the crest to the right foot. */
function contour(g: CanvasRenderingContext2D, m: Mound, h: number) {
  const [x, y, bw, hh] = m
  const [px, py] = crestOf(m, h)
  g.moveTo(x - bw, y)
  g.bezierCurveTo(x - bw * 0.65, y - hh * 0.35, px - bw * 0.35, py, px, py)
  g.bezierCurveTo(px + bw * 0.35, py, x + bw * 0.6, y - hh * 0.3, x + bw, y)
}

/** The flank turned from the light, from the crest down to the right foot, washed darker outwards. */
function flank(p: Pen, m: Mound, h: number, alpha: number) {
  const [x, y, bw, hh] = m
  const [px, py] = crestOf(m, h)
  const g = p.g
  g.beginPath()
  g.moveTo(px, py)
  g.bezierCurveTo(px + bw * 0.35, py, x + bw * 0.6, y - hh * 0.3, x + bw, y)
  g.lineTo(px + bw * 0.12, y)
  g.quadraticCurveTo(px + bw * 0.16, y - hh * 0.5, px, py)
  g.closePath()
  const wash = g.createLinearGradient(px + bw * 0.12, 0, x + bw * 0.75, 0)
  wash.addColorStop(0, css(TONE.ink, 0))
  wash.addColorStop(1, css(TONE.ink, alpha))
  g.fillStyle = wash
  g.fill()
}

/** A hill, its foot's middle at (x, y); `h` a number of its own. */
export function hill(
  p: Pen,
  m: Mound,
  fill: number,
  ink: number,
  detail: Detail,
  h: number,
) {
  const [x, y, bw, hh] = m
  const [px, py] = crestOf(m, h)
  const g = p.g
  g.beginPath()
  contour(g, m, h)
  g.closePath()
  g.fillStyle = css(fill)
  g.fill()
  flank(p, m, h, detail === 2 ? 0.17 : 0.12)
  g.beginPath()
  contour(g, m, h)
  g.lineWidth = lw(p, detail === 2 ? 1 : 0.8)
  g.strokeStyle = css(ink, 0.7)
  g.lineCap = 'round'
  g.stroke()
  g.beginPath()
  g.moveTo(px - bw * 0.3, py + hh * 0.12)
  g.quadraticCurveTo(px, py - hh * 0.02, px + bw * 0.3, py + hh * 0.12)
  g.lineWidth = lw(p, detail === 2 ? 1.6 : 1.2)
  g.stroke()
  const n = detail === 2 ? 7 : 4
  g.beginPath()
  for (let k = 0; k < n; k++) {
    const u = (k + 0.6) / (n + 0.4)
    const sx = px + (x + bw - px) * u * 0.92
    const sy = py + (y - py) * (u * u * 0.85 + 0.04)
    const len = hh * (0.62 - u * 0.42) * (0.8 + 0.4 * hash(sx, sy, 2))
    g.moveTo(sx, sy + 0.15)
    g.lineTo(sx - len * 0.18, sy + len)
  }
  for (let k = 0; detail === 2 && k < 2; k++) {
    const u = 0.35 + k * 0.3
    const sx = px - (px - x + bw) * u * 0.8
    const sy = py + (y - py) * u * u * 0.8 + 0.2
    g.moveTo(sx, sy)
    g.lineTo(sx + 0.1, sy + hh * 0.22)
  }
  g.lineWidth = lw(p, detail === 2 ? 0.75 : 0.65)
  g.strokeStyle = css(ink, 0.5)
  g.stroke()
}

/** A hill's silhouette laid on the ground by the light, for its cast shadow. */
export function hillShadow(g: CanvasRenderingContext2D, m: Mound, h: number) {
  laid(g, m[1], () => {
    g.beginPath()
    contour(g, m, h)
    g.closePath()
    g.fill()
  })
}
