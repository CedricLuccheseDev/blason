import { hash } from '../pen'
import { TONE } from '../palette'
import {
  WOOD_DARK,
  add,
  arch,
  css,
  fillInk,
  lerp,
  line,
  lw,
  shade,
  wob,
} from './ink'
import type { Pen, Pt } from './ink'

// A house and a church as an engraver draws a village in three-quarter
// view: the gable to the front in the light, the long side going back to
// the right in the shade. At mid distance a door; up close the roof's tile
// courses, a window, the timber frame. In local units, a house some three
// wide.

/** 1 the drawing at mid distance, 2 the illustration up close. */
export type Detail = 1 | 2

type HouseLook = {
  chimney?: boolean
  wall?: number
  timber?: boolean
  doorLeft?: boolean
}

/** The roof's tiles: courses along the slope, a shadow under the ridge. */
function tiles(
  p: Pen,
  roof: ReadonlyArray<Pt>,
  color: number,
  amt: number,
  seed: number,
) {
  const [r0, r1, r2, r3] = roof
  const g = p.g
  g.save()
  wob(p, roof, amt, seed)
  g.clip()
  g.beginPath()
  for (let k = 1; k < 5; k++) {
    const a = lerp(r0, r3, k / 5)
    const b = lerp(r1, r2, k / 5)
    g.moveTo(a[0], a[1])
    g.lineTo(b[0], b[1])
  }
  g.lineWidth = lw(p, 0.6)
  g.strokeStyle = css(shade(color, 0.4), 0.7)
  g.stroke()
  g.beginPath()
  for (let k = 1; k < 9; k++) {
    const a = lerp(r0, r1, k / 9)
    const b = lerp(a, lerp(r3, r2, k / 9), 0.25)
    g.moveTo(a[0], a[1])
    g.lineTo(b[0], b[1])
  }
  g.lineWidth = lw(p, 0.5)
  g.strokeStyle = css(shade(color, 0.35), 0.5)
  g.stroke()
  g.restore()
}

/** The door, and up close a window and the timber frame. */
function front(
  p: Pen,
  [x, y, w, h]: readonly [number, number, number, number],
  apexY: number,
  lod: Detail,
  look: HouseLook,
) {
  const dw = Math.min(1.1, w * 0.28)
  const dh = Math.min(h * 0.62, 1.8)
  arch(p, x + (look.doorLeft ? -w * 0.18 : w * 0.12), y, dw, dh)
  fillInk(p, TONE.door, lod === 2 ? 0.6 : 0)
  if (lod < 2) return
  if (w > 2.6) {
    const wx = x - w * 0.27
    p.g.beginPath()
    p.g.rect(wx - 0.35, y - h * 0.72, 0.7, 0.7)
    fillInk(p, shade(TONE.door, 0.2), 0.5)
  }
  if (look.timber === false) return
  const g = p.g
  g.beginPath()
  g.moveTo(x - w / 2, y - h + 0.05)
  g.lineTo(x + w / 2, y - h + 0.05)
  g.moveTo(x, apexY + 0.5)
  g.lineTo(x, y - h)
  g.moveTo(x - w / 2 + 0.15, y - h * 0.15)
  g.lineTo(x - w * 0.42 + h * 0.5, y - h + 0.1)
  g.lineWidth = lw(p, 0.8)
  g.strokeStyle = css(WOOD_DARK, 0.75)
  g.stroke()
}

/** A house, its gable's foot centred at (x, y); returns its chimney's top, if it has one. */
export function house(
  p: Pen,
  [x, y, w, h, d]: readonly [number, number, number, number, number],
  roof: number,
  lod: Detail,
  seed: number,
  look: HouseLook = {},
): Pt | null {
  const o: Pt = [d * 0.62, -d * 0.42]
  const A: Pt = [x - w / 2, y]
  const B: Pt = [x + w / 2, y]
  const Bt: Pt = [x + w / 2, y - h]
  const At: Pt = [x - w / 2, y - h]
  const apex: Pt = [x, y - h - w * 0.62]
  const ink = lod === 2 ? 0.9 : 1
  const amt = lod === 2 ? 0.07 : 0.04
  wob(p, [B, add(B, o), add(Bt, o), Bt], amt, seed)
  fillInk(p, shade(TONE.wall, 0.16), ink)
  const r: ReadonlyArray<Pt> = [
    add(apex, [0, -0.1]),
    add(add(apex, o), [0.1, -0.1]),
    add(add(Bt, o), [0.25, 0.15]),
    add(Bt, [0.25, 0.15]),
  ]
  wob(p, r, amt, seed + 1)
  fillInk(p, roof, ink)
  if (lod === 2) tiles(p, r, roof, amt, seed + 1)
  let chimney: Pt | null = null
  if (look.chimney !== false) {
    const base = lerp(lerp(r[0], r[1], 0.62), lerp(r[3], r[2], 0.62), 0.3)
    const cw = Math.max(0.5, w * 0.16)
    const [bx, by] = base
    wob(
      p,
      [
        [bx - cw / 2, by + 0.4],
        [bx - cw / 2, by - 1.1],
        [bx + cw / 2, by - 1.1],
        [bx + cw / 2, by + 0.4],
      ],
      0.03,
      seed + 2,
    )
    fillInk(p, TONE.stoneDark, ink * 0.9)
    chimney = [bx, by - 1.2]
  }
  wob(p, [A, B, Bt, apex, At], amt, seed + 3)
  fillInk(p, look.wall ?? TONE.wall, ink)
  front(p, [x, y, w, h], apex[1], lod, look)
  return chimney
}

/** The church: a nave going back, a square tower at its front with a spire of slate, a cross on it. */
export function church(
  p: Pen,
  x: number,
  y: number,
  lod: Detail,
  seed: number,
) {
  house(p, [x + 1.6, y - 0.4, 3.4, 2.6, 6.5], TONE.slate, lod, seed, {
    chimney: false,
    wall: TONE.stone,
    timber: false,
  })
  const [tw, th] = [2.4, 6.2]
  const o: Pt = [1.3, -0.85]
  const A: Pt = [x - tw / 2, y]
  const B: Pt = [x + tw / 2, y]
  const Bt: Pt = [x + tw / 2, y - th]
  const At: Pt = [x - tw / 2, y - th]
  const ink = lod === 2 ? 0.9 : 1
  wob(p, [B, add(B, o), add(Bt, o), Bt], 0.04, seed + 5)
  fillInk(p, shade(TONE.stone, 0.18), ink)
  wob(p, [A, B, Bt, At], 0.04, seed + 6)
  fillInk(p, TONE.stone, ink)
  const top: Pt = [x + o[0] * 0.5, y - th - 4.6]
  wob(p, [Bt, add(Bt, o), top], 0.03, seed + 7)
  fillInk(p, shade(TONE.slate, 0.25), ink)
  wob(p, [At, Bt, top], 0.03, seed + 8)
  fillInk(p, TONE.slate, ink)
  // The bell's opening, and the cross.
  arch(p, x, y - th + 2, 0.8, 1.2)
  fillInk(p, TONE.door, 0)
  line(p, [top, [top[0], top[1] - 1.5]], 1, TONE.ink)
  line(
    p,
    [
      [top[0] - 0.5, top[1] - 1],
      [top[0] + 0.5, top[1] - 1],
    ],
    1,
    TONE.ink,
  )
  if (lod < 2) return
  const g = p.g
  g.beginPath()
  for (let r = 1; r < 6; r++) {
    const yy = y - (th * r) / 6
    g.moveTo(A[0] + 0.2, yy)
    g.lineTo(A[0] + 0.2 + tw * (0.3 + 0.3 * hash(r, seed, 2)), yy)
  }
  g.lineWidth = lw(p, 0.5)
  g.strokeStyle = css(TONE.ink, 0.25)
  g.stroke()
  arch(p, x, y, 0.9, 1.75)
  fillInk(p, TONE.door, 0.5)
}
