import { TONE } from '../palette'
import type { Graphics } from 'pixi.js'

// The coups drawn on the land in ink, as the soldiers are: the
// troublemaker, a small man in his lord's colour walking with a torch held
// high; an arrow of a volley; the pot of Greek fire, its neck aflame; a
// tongue of flame, and a rebels' pitchfork with its pennon. Each drawn
// into a Graphics at a point, `h` map units tall, cleared by its layer.

const STICK = 0x6b4a2b

/** A tongue of flame standing at (x, y), `h` tall, flickering by `flicker` (0 to 1). */
export function drawFlame(
  g: Graphics,
  x: number,
  y: number,
  h: number,
  flicker = 0.5,
) {
  const t = h * (0.85 + 0.3 * flicker)
  const w = h * 0.42
  const lean = (flicker - 0.5) * w * 0.6
  g.moveTo(x - w / 2, y)
    .quadraticCurveTo(x - w * 0.7, y - t * 0.55, x + lean, y - t)
    .quadraticCurveTo(x + w * 0.7, y - t * 0.55, x + w / 2, y)
    .closePath()
    .fill(TONE.ember)
    .stroke({ width: h * 0.08, color: TONE.fightDark, join: 'round' })
  g.moveTo(x - w * 0.22, y)
    .quadraticCurveTo(x - w * 0.3, y - t * 0.35, x + lean * 0.6, y - t * 0.6)
    .quadraticCurveTo(x + w * 0.3, y - t * 0.35, x + w * 0.22, y)
    .closePath()
    .fill(TONE.goldLight)
}

/** The troublemaker, his feet at (x, y), facing `dir`, his stride at `step` (radians, it turns as he walks). */
export function drawTroublemaker(
  g: Graphics,
  x: number,
  y: number,
  h: number,
  color: number,
  dir: 1 | -1,
  step: number,
  flicker: number,
) {
  const line = { width: h * 0.07, color: TONE.ink, cap: 'round' } as const
  const swing = Math.sin(step) * h * 0.16
  const hip = { x, y: y - h * 0.42 }
  const shoulder = { x, y: y - h * 0.74 }
  g.ellipse(x, y, h * 0.22, h * 0.06).fill({ color: TONE.ink, alpha: 0.2 })
  g.moveTo(hip.x, hip.y).lineTo(x + swing, y)
  g.moveTo(hip.x, hip.y).lineTo(x - swing, y)
  g.stroke(line)
  // His tunic, in his lord's colour.
  g.poly([
    shoulder.x - h * 0.11,
    shoulder.y,
    shoulder.x + h * 0.11,
    shoulder.y,
    hip.x + h * 0.15,
    hip.y + h * 0.04,
    hip.x - h * 0.15,
    hip.y + h * 0.04,
  ])
    .fill(color)
    .stroke({ ...line, join: 'round' })
  g.circle(x, y - h * 0.86, h * 0.1)
    .fill(TONE.parchment)
    .stroke(line)
  // The arm up, the torch in his hand, its flame over his head.
  const hand = { x: x + dir * h * 0.26, y: y - h * 0.98 }
  const top = { x: hand.x + dir * h * 0.05, y: hand.y - h * 0.22 }
  g.moveTo(shoulder.x + dir * h * 0.06, shoulder.y + h * 0.03)
    .lineTo(hand.x, hand.y)
    .stroke(line)
  g.moveTo(hand.x - dir * h * 0.02, hand.y + h * 0.08)
    .lineTo(top.x, top.y)
    .stroke({ width: h * 0.08, color: STICK, cap: 'round' })
  g.circle(top.x, top.y - h * 0.08, h * 0.32).fill({
    color: TONE.ember,
    alpha: 0.18 + 0.08 * flicker,
  })
  drawFlame(g, top.x, top.y, h * 0.3, flicker)
}

/** An arrow, its point at (x, y), heading at `angle`, `long` map units. */
export function drawArrow(
  g: Graphics,
  x: number,
  y: number,
  angle: number,
  long: number,
  alpha = 1,
) {
  const [cx, cy] = [Math.cos(angle), Math.sin(angle)]
  const tail = { x: x - cx * long, y: y - cy * long }
  const fletch = long * 0.22
  g.moveTo(tail.x, tail.y).lineTo(x, y)
  for (const side of [1, -1]) {
    g.moveTo(tail.x, tail.y).lineTo(
      tail.x - cx * fletch - side * cy * fletch * 0.7,
      tail.y - cy * fletch + side * cx * fletch * 0.7,
    )
  }
  g.stroke({ width: long * 0.09, color: TONE.ink, alpha, cap: 'round' })
}

/** The pot of Greek fire at (x, y), `r` round, its neck aflame. */
export function drawPot(
  g: Graphics,
  x: number,
  y: number,
  r: number,
  flicker: number,
) {
  g.circle(x, y, r)
    .fill(TONE.char)
    .stroke({ width: r * 0.22, color: TONE.ink })
  g.moveTo(x - r * 0.75, y + r * 0.1)
    .lineTo(x + r * 0.75, y + r * 0.1)
    .stroke({ width: r * 0.16, color: TONE.amber })
  drawFlame(g, x, y - r * 0.85, r * 1.5, flicker)
}

/** A rebels' pitchfork planted at (x, y), `h` tall, a pennon of sanguine at its top. */
export function drawRebels(g: Graphics, x: number, y: number, h: number) {
  const top = y - h
  const w = h * 0.2
  const line = { width: h * 0.07, color: TONE.ink, cap: 'round' } as const
  g.poly([x, top + h * 0.08, x + h * 0.42, top + h * 0.17, x, top + h * 0.3])
    .fill(TONE.fightDark)
    .stroke({ ...line, join: 'round' })
  g.moveTo(x, y).lineTo(x, top - h * 0.1)
  g.moveTo(x - w, top - h * 0.3)
    .lineTo(x - w, top - h * 0.12)
    .quadraticCurveTo(x - w, top - h * 0.04, x, top - h * 0.04)
    .quadraticCurveTo(x + w, top - h * 0.04, x + w, top - h * 0.12)
    .lineTo(x + w, top - h * 0.3)
  g.moveTo(x, top - h * 0.04).lineTo(x, top - h * 0.32)
  g.stroke(line)
}
