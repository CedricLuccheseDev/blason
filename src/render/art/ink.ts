import { mixColor } from '../ease'
import { tremble } from '../pen'
import { TONE } from '../palette'

// The engraver's kit for what is drawn once on a canvas and laid on the map
// as a texture (the works, the ground's trees and hills): a pen that knows
// how many screen pixels a unit of what it draws covers, so that its lines
// are given in pixels and stay fine at every size; shapes drawn as a hand
// draws them, their sides pushed aside a little.

export type Pen = {
  g: CanvasRenderingContext2D
  /** Screen pixels per local unit of what is being drawn now. */
  px: number
}
export type Pt = readonly [number, number]

/** A width of so many screen pixels, in the pen's units. */
export const lw = (p: Pen, px: number) => px / p.px

export function css(color: number, alpha = 1): string {
  const [r, g, b] = [(color >> 16) & 255, (color >> 8) & 255, color & 255]
  return alpha >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`
}

export const shade = (c: number, k: number) => mixColor(c, TONE.ink, k)
export const light = (c: number, k: number) => mixColor(c, TONE.white, k)
export const lerp = (a: Pt, b: Pt, t: number): Pt => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
]
export const add = (a: Pt, b: Pt, k = 1): Pt => [
  a[0] + b[0] * k,
  a[1] + b[1] * k,
]

/** The pen scaled by `k` round where it stands: the same pixels, larger units. */
export function scaled(p: Pen, k: number): Pen {
  p.g.scale(k, k)
  return { g: p.g, px: p.px * k }
}

export function ellipse(p: Pen, x: number, y: number, rx: number, ry: number) {
  p.g.beginPath()
  p.g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, Math.PI * 2)
}

export function poly(p: Pen, pts: ReadonlyArray<Pt>, close = true) {
  p.g.beginPath()
  p.g.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) p.g.lineTo(pts[i][0], pts[i][1])
  if (close) p.g.closePath()
}

/** A shape as a pen draws it: its sides cut short and pushed aside a little. */
export function wob(
  p: Pen,
  pts: ReadonlyArray<Pt>,
  amt = 0.1,
  seed = 0,
  close = true,
) {
  const g = p.g
  g.beginPath()
  const n = pts.length
  const push = (x: number, y: number): Pt => [
    x + tremble(x * 3 + seed, y * 3, 0) * amt,
    y + tremble(x * 3, y * 3 + seed, 1.7) * amt,
  ]
  for (let i = 0; i < (close ? n : n - 1); i++) {
    const [ax, ay] = pts[i]
    const [bx, by] = pts[(i + 1) % n]
    const k = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 1.4))
    for (let s = 0; s < k; s++) {
      const [x, y] = push(ax + ((bx - ax) * s) / k, ay + ((by - ay) * s) / k)
      if (i === 0 && s === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
  }
  if (close) g.closePath()
  else g.lineTo(...push(pts[n - 1][0], pts[n - 1][1]))
}

/** The path filled, then inked so many pixels wide. */
export function fillInk(
  p: Pen,
  fill: number | null,
  px = 1,
  alpha = 1,
  edge: number = TONE.ink,
) {
  const g = p.g
  if (fill !== null) {
    g.fillStyle = css(fill)
    g.fill()
  }
  if (px > 0) {
    g.lineWidth = lw(p, px)
    g.strokeStyle = css(edge, alpha)
    g.lineJoin = 'round'
    g.lineCap = 'round'
    g.stroke()
  }
}

/** The path inked so many pixels wide. */
function stroke(p: Pen, px: number, color: number, alpha = 1) {
  const g = p.g
  g.lineWidth = lw(p, px)
  g.strokeStyle = css(color, alpha)
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.stroke()
}

export function line(
  p: Pen,
  pts: ReadonlyArray<Pt>,
  px: number,
  color: number,
  alpha = 1,
) {
  poly(p, pts, false)
  stroke(p, px, color, alpha)
}

/** An arched opening, a door or a window, its foot at y. */
export function arch(p: Pen, x: number, y: number, w: number, h: number) {
  const g = p.g
  g.beginPath()
  g.moveTo(x - w / 2, y)
  g.lineTo(x - w / 2, y - h + w / 2)
  g.arc(x, y - h + w / 2, w / 2, Math.PI, 0)
  g.lineTo(x + w / 2, y)
  g.closePath()
}

/** The parchment halo that cuts a silhouette out of the wash under it. */
export function halo(p: Pen, alpha = 0.92) {
  p.g.lineWidth = lw(p, 4.2)
  p.g.strokeStyle = css(TONE.parchment, alpha)
  p.g.lineJoin = 'round'
  p.g.stroke()
}

/** What the ground's ornaments and the works share: wood and earth. */
export const WOOD = 0x8a6440
export const WOOD_DARK = 0x5e4630
export const THATCH = 0xb8955a
export const EARTH = 0xcdb68a
