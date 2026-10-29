import { TONE } from '../palette'
import { pointOn } from '../cord'
import { drawRibbon } from './cords'
import type { Cord } from '../cord'
import type { Graphics } from 'pixi.js'

// An alliance broken, as all see it (layers/pacts.ts): its ribbon or its
// cord snaps at the middle, the two ends falling slack, a ring of gules
// bursting from its seal, which cracks in two and stays so a moment, then
// all of it fades. `age` in seconds since the break, `k` map units to a
// pixel on screen.

/** Seconds the ends take to fall slack and the ring to burst; seconds before it all fades, and the fading. */
const [FALL, BURST, STAY, FADE] = [0.6, 0.9, 2.4, 0.8]
/** Pixels the ends fall, the halves of the seal part, the ring grows to. */
const [SAG, PART, RING] = [16, 7, 64]

export type Snap = {
  cord: Cord
  mine: boolean
  colors: [number, number]
  born: number
}

/** Whether a snap is over: faded out. */
export const snapped = (age: number) => age > STAY + FADE

/** One end of the cord, from its capital to the cut, falling slack. */
function end(cord: Cord, from: number, cut: number, sag: number): Cord {
  const a = pointOn(cord, from)
  const b = pointOn(cord, cut)
  const to = { x: b.x, y: b.y + sag }
  const control = { x: (a.x + to.x) / 2, y: (a.y + to.y) / 2 + sag * 0.6 }
  return { from: a, control, to, middle: control }
}

export function drawSnap(g: Graphics, snap: Snap, age: number, k: number) {
  const fall = Math.min(1, age / FALL)
  const alpha = 1 - Math.max(0, (age - STAY) / FADE)
  const sag = SAG * k * fall
  const ends = [end(snap.cord, 0, 0.44, sag), end(snap.cord, 1, 0.56, sag)]
  for (const piece of ends) {
    if (snap.mine) drawRibbon(g, piece, k, alpha)
    else
      g.moveTo(piece.from.x, piece.from.y)
        .quadraticCurveTo(
          piece.control.x,
          piece.control.y,
          piece.to.x,
          piece.to.y,
        )
        .stroke({ width: 2 * k, color: TONE.ink, alpha: 0.55 * alpha })
  }
  const { x, y } = snap.cord.middle
  const burst = Math.min(1, age / BURST)
  if (burst < 1)
    g.circle(x, y, RING * k * (0.15 + 0.85 * burst)).stroke({
      width: 5 * k * (1 - burst),
      color: TONE.gules,
      alpha: 0.9 * (1 - burst),
    })
  const r = (snap.mine ? 18 : 8) * k
  const part = PART * k * fall
  drawHalf(g, x - part, y + part * 0.4, r, snap.colors[0], 'left', alpha)
  drawHalf(g, x + part, y + part * 0.6, r, snap.colors[1], 'right', alpha)
}

/** Half a seal, tipped away from the crack as it falls. */
function drawHalf(
  g: Graphics,
  x: number,
  y: number,
  r: number,
  color: number,
  side: 'left' | 'right',
  alpha: number,
) {
  const tip = side === 'left' ? -0.2 : 0.2
  const [from, to] = [-Math.PI / 2 + tip, Math.PI / 2 + tip]
  g.moveTo(x + Math.cos(from) * r, y + Math.sin(from) * r)
    .arc(x, y, r, from, to, side === 'left')
    .closePath()
    .fill({ color, alpha })
    .stroke({ width: (r / 10) * 1.2, color: TONE.ink, alpha: 0.8 * alpha })
}
