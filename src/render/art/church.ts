import { hash } from '../pen'
import { TONE } from '../palette'
import { house } from './house'
import { add, arch, css, fillInk, light, line, lw, shade, wob } from './ink'
import { CHURCH } from './plans'
import type { Detail } from './house'
import type { Pen, Pt } from './ink'

// The village's church as an engraver draws it in three-quarter view, in
// the map's one light: a nave going back, a square tower at its front, its
// face in the light and its side in shade, under a spire of slate, a cross
// on it. Up close its stones are coursed. Local units.

/** The church, its tower's foot centred at (x, y). */
export function church(
  p: Pen,
  x: number,
  y: number,
  lod: Detail,
  seed: number,
) {
  house(p, CHURCH.nave(x, y), TONE.slate, lod, seed, {
    chimney: false,
    wall: TONE.stone,
    timber: false,
  })
  const { w: tw, h: th, back: o, spire } = CHURCH.tower
  const A: Pt = [x - tw / 2, y]
  const B: Pt = [x + tw / 2, y]
  const Bt: Pt = [x + tw / 2, y - th]
  const At: Pt = [x - tw / 2, y - th]
  const ink = lod === 2 ? 0.9 : 1
  wob(p, [B, add(B, o), add(Bt, o), Bt], 0.04, seed + 5)
  fillInk(p, shade(TONE.stone, 0.32), ink)
  wob(p, [A, B, Bt, At], 0.04, seed + 6)
  fillInk(p, light(TONE.stone, 0.15), ink)
  const top: Pt = [x + o[0] * 0.5, y - th - spire]
  wob(p, [Bt, add(Bt, o), top], 0.03, seed + 7)
  fillInk(p, shade(TONE.slate, 0.38), ink)
  wob(p, [At, Bt, top], 0.03, seed + 8)
  fillInk(p, TONE.slate, ink)
  // Under the spire's eaves, a line of shade on the tower's face.
  line(p, [add(At, [0.15, 0.3]), add(Bt, [-0.1, 0.3])], 1.2, TONE.ink, 0.22)
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
