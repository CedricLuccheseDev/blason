import { TONE } from '../palette'
import { WOOD_DARK, add, arch, css, fillInk, lerp, lw, shade, wob } from './ink'
import { RIDGE, back } from './plans'
import type { Pen, Pt } from './ink'
import type { HousePlan } from './plans'

// A house as an engraver draws a village in three-quarter view, standing
// in the map's one light (art/light.ts): the gable to the front in the
// light, the long side going back to the right in shade, a line of shade
// under the eaves and under the verge where the roof overhangs, the roof
// darkening down to its eaves under a lit ridge. At mid distance a door; up
// close the roof's tile courses, a window, the timber frame. In local
// units, a house some three wide.

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
  [x, y, w, h, d]: HousePlan,
  roof: number,
  lod: Detail,
  seed: number,
  look: HouseLook = {},
): Pt | null {
  const o = back(d)
  const A: Pt = [x - w / 2, y]
  const B: Pt = [x + w / 2, y]
  const Bt: Pt = [x + w / 2, y - h]
  const At: Pt = [x - w / 2, y - h]
  const apex: Pt = [x, y - h - w * RIDGE]
  const ink = lod === 2 ? 0.9 : 1
  const amt = lod === 2 ? 0.07 : 0.04
  wob(p, [B, add(B, o), add(Bt, o), Bt], amt, seed)
  fillInk(p, shade(TONE.wall, 0.3), ink)
  // The eaves' shade on the side wall.
  wob(p, [Bt, add(Bt, o), add(add(Bt, o), [0, 0.55]), add(Bt, [0, 0.55])], 0)
  p.g.fillStyle = css(TONE.ink, 0.2)
  p.g.fill()
  const r: ReadonlyArray<Pt> = [
    add(apex, [0, -0.1]),
    add(add(apex, o), [0.1, -0.1]),
    add(add(Bt, o), [0.25, 0.15]),
    add(Bt, [0.25, 0.15]),
  ]
  wob(p, r, amt, seed + 1)
  fillInk(p, roof, ink)
  slope(p, r, amt, seed + 1)
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
  verge(p, [At, apex, Bt], roof, ink)
  return chimney
}

/** The roof's slope in the light: darker down to its eaves, its ridge lit. */
function slope(p: Pen, r: ReadonlyArray<Pt>, amt: number, seed: number) {
  const g = p.g
  const [top, eave] = [lerp(r[0], r[1], 0.5), lerp(r[3], r[2], 0.5)]
  const wash = g.createLinearGradient(top[0], top[1], eave[0], eave[1])
  wash.addColorStop(0, css(TONE.ink, 0))
  wash.addColorStop(1, css(TONE.ink, 0.22))
  wob(p, r, amt, seed)
  g.fillStyle = wash
  g.fill()
  g.beginPath()
  g.moveTo(r[0][0] + 0.15, r[0][1] + 0.12)
  g.lineTo(r[1][0] - 0.1, r[1][1] + 0.12)
  g.lineWidth = lw(p, 1.1)
  g.strokeStyle = css(TONE.white, 0.35)
  g.stroke()
}

/** The roof's edge over the gable, overhanging it, a line of shade under it. */
function verge(
  p: Pen,
  [At, apex, Bt]: readonly [Pt, Pt, Pt],
  roof: number,
  ink: number,
) {
  const g = p.g
  const edge = (dy: number, out: number) => {
    g.beginPath()
    g.moveTo(At[0] - out, At[1] + dy + out * 0.6)
    g.lineTo(apex[0], apex[1] + dy - out * 0.4)
    g.lineTo(Bt[0] + out, Bt[1] + dy + out * 0.6)
  }
  edge(0.42, 0)
  g.lineWidth = 0.5
  g.strokeStyle = css(TONE.ink, 0.2)
  g.lineJoin = 'round'
  g.stroke()
  edge(0, 0.3)
  g.lineWidth = 0.32 + lw(p, 1.6 * ink)
  g.strokeStyle = css(TONE.ink, 0.85)
  g.lineCap = 'round'
  g.stroke()
  g.lineWidth = 0.32
  g.strokeStyle = css(shade(roof, 0.08))
  g.stroke()
}
