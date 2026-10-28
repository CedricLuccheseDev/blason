import { hash } from '../pen'
import { TONE } from '../palette'
import { css, ellipse, line, lw } from './ink'
import type { Pen } from './ink'
import type { Detail } from './house'

// The ground's ornaments as an engraver draws them, in map units: a
// broadleaf tree, a fir, a hill rising to its crest with hachures down its
// shaded flank, a tuft of grass. Each in the fill and the ink it is given:
// the ground's layer picks them from the land they stand on.

/** A broadleaf tree, its foot at (x, y), its crown so wide; `h` a number of its own. */
export function tree(
  p: Pen,
  [x, y, r]: readonly [number, number, number],
  fill: number,
  ink: number,
  detail: Detail,
  h: number,
) {
  const g = p.g
  ellipse(p, x + r * 0.55, y + r * 0.08, r * 0.95, r * 0.3)
  g.fillStyle = css(TONE.ink, 0.07)
  g.fill()
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
  const [cx, cy] = [x, y - r * 1.45]
  const n = 7 + Math.floor(h * 3)
  g.beginPath()
  for (let k = 0; k <= n; k++) {
    const ang = (k / n) * Math.PI * 2 + h * 6
    const rr = r * (0.82 + 0.22 * hash(x + k, y, 3))
    const px = cx + Math.cos(ang) * rr
    const py = cy + Math.sin(ang) * rr * 0.92
    if (k === 0) g.moveTo(px, py)
    else {
      const mid = ang - Math.PI / n
      const bulge = rr * 1.22
      g.quadraticCurveTo(
        cx + Math.cos(mid) * bulge,
        cy + Math.sin(mid) * bulge * 0.92,
        px,
        py,
      )
    }
  }
  g.closePath()
  g.fillStyle = css(fill)
  g.fill()
  g.lineWidth = lw(p, detail === 2 ? 0.9 : 0.75)
  g.strokeStyle = css(ink, 0.7)
  g.stroke()
  if (detail === 2) crown(p, cx, cy, r, ink)
}

/** Up close, the light on the crown's upper left, the shade hatched on its lower right. */
function crown(p: Pen, cx: number, cy: number, r: number, ink: number) {
  const g = p.g
  ellipse(p, cx - r * 0.3, cy - r * 0.32, r * 0.42, r * 0.3)
  g.fillStyle = css(TONE.white, 0.16)
  g.fill()
  g.beginPath()
  for (let k = 0; k < 4; k++) {
    const ang = 0.15 + k * 0.42
    g.moveTo(cx + Math.cos(ang) * r * 0.35, cy + Math.sin(ang) * r * 0.35)
    g.lineTo(cx + Math.cos(ang) * r * 0.82, cy + Math.sin(ang) * r * 0.78)
  }
  g.lineWidth = lw(p, 0.6)
  g.strokeStyle = css(ink, 0.45)
  g.stroke()
  g.beginPath()
  g.arc(cx + r * 0.1, cy + r * 0.05, r * 0.45, 0.3, 1.9)
  g.strokeStyle = css(ink, 0.4)
  g.stroke()
}

/** A fir, its foot at (x, y). */
export function fir(
  p: Pen,
  [x, y, r]: readonly [number, number, number],
  fill: number,
  ink: number,
  detail: Detail,
) {
  const g = p.g
  ellipse(p, x + r * 0.5, y + 0.05, r * 0.8, r * 0.25)
  g.fillStyle = css(TONE.ink, 0.07)
  g.fill()
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
  const h = r * 3.1
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
  if (detail < 2) return
  g.beginPath()
  for (let k = 0; k < 3; k++) {
    const yy = y - h * (0.28 + k * 0.17)
    g.moveTo(x + 0.1, yy)
    g.lineTo(x + r * (0.55 - k * 0.12), yy + r * 0.25)
  }
  g.lineWidth = lw(p, 0.6)
  g.strokeStyle = css(ink, 0.45)
  g.stroke()
}

/** A hill as the old maps draw one: a contour rising to its crest, thicker there, hachures down its shaded flank. */
export function hill(
  p: Pen,
  [x, y, bw, hh]: readonly [number, number, number, number],
  fill: number,
  ink: number,
  detail: Detail,
  h: number,
) {
  const g = p.g
  const [px, py] = [x - bw * 0.12 + h * bw * 0.2, y - hh]
  const contour = () => {
    g.beginPath()
    g.moveTo(x - bw, y)
    g.bezierCurveTo(x - bw * 0.65, y - hh * 0.35, px - bw * 0.35, py, px, py)
    g.bezierCurveTo(px + bw * 0.35, py, x + bw * 0.6, y - hh * 0.3, x + bw, y)
  }
  contour()
  g.closePath()
  g.fillStyle = css(fill)
  g.fill()
  contour()
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
  g.strokeStyle = css(ink, 0.55)
  g.stroke()
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
