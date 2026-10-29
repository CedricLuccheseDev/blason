import { TONE } from '../palette'
import {
  WOOD,
  WOOD_DARK,
  add,
  css,
  ellipse,
  fillInk,
  lerp,
  light,
  line,
  poly,
  shade,
  wob,
} from './ink'
import { STALL } from './plans'
import type { Detail } from './house'
import type { Pen, Pt } from './ink'

// The market's pieces: a stall under an awning striped in its lord's
// colour, a heap of gold with its stacks of coins, crates and a sack. Up
// close the goods on the counter and the coins in the heap. Local units.

/** The awning over a stall, striped in the lord's colour, its valance scalloped. */
function awning(
  p: Pen,
  aw: ReadonlyArray<Pt>,
  w: number,
  color: number,
  lod: Detail,
  seed: number,
) {
  const g = p.g
  wob(p, aw, 0.03, seed)
  g.fillStyle = css(TONE.parchment)
  g.fill()
  g.save()
  wob(p, aw, 0.03, seed)
  g.clip()
  for (let k = 0; k < 6; k += 2) {
    poly(p, [
      lerp(aw[0], aw[1], k / 6),
      lerp(aw[0], aw[1], (k + 1) / 6),
      lerp(aw[3], aw[2], (k + 1) / 6),
      lerp(aw[3], aw[2], k / 6),
    ])
    g.fillStyle = css(color)
    g.fill()
  }
  g.restore()
  wob(p, aw, 0.03, seed)
  fillInk(p, null, lod === 2 ? 0.8 : 1)
  const n = Math.round(w + 1.2)
  const scallops = (close: boolean) => {
    for (let k = 0; k < n; k++) {
      const a = lerp(aw[0], aw[1], k / n)
      const b = lerp(aw[0], aw[1], (k + 1) / n)
      if (close) g.moveTo(a[0], a[1])
      g.quadraticCurveTo((a[0] + b[0]) / 2, a[1] + 0.9, b[0], b[1])
      if (close) g.closePath()
    }
  }
  g.beginPath()
  g.moveTo(aw[0][0], aw[0][1])
  scallops(false)
  g.closePath()
  fillInk(p, null, lod === 2 ? 0.7 : 0.9)
  g.beginPath()
  scallops(true)
  g.fillStyle = css(shade(color, 0.15))
  g.fill()
}

/** A stall, its counter's front foot centred at (x, y), so wide; its counter's side in shade, the awning shading the counter's top. */
export function stall(
  p: Pen,
  [x, y, w]: readonly [number, number, number],
  color: number,
  lod: Detail,
  seed: number,
) {
  const o = STALL.back
  const ink = lod === 2 ? 0.8 : 1
  const R: Pt = [x + w / 2, y]
  const Rt: Pt = [x + w / 2, y - 1.5]
  wob(p, [R, add(R, o), add(Rt, o), Rt], 0.03, seed)
  fillInk(p, WOOD_DARK, ink)
  wob(
    p,
    [[x - w / 2, y - 1.5], Rt, add(Rt, o), add([x - w / 2, y - 1.5], o)],
    0.03,
    seed + 1,
  )
  fillInk(p, light(WOOD, 0.25), ink)
  // In the awning's shade.
  p.g.fillStyle = css(TONE.ink, 0.16)
  p.g.fill()
  if (lod === 2)
    for (let k = 0; k < 5; k++) {
      ellipse(
        p,
        x - w / 2 + 0.7 + (k * (w - 1.2)) / 4,
        y - 1.75 + (k % 2) * 0.2,
        0.32,
        0.28,
      )
      fillInk(p, k % 2 ? 0xb0532d : 0xc9a85a, 0.4)
    }
  wob(p, [[x - w / 2, y], R, Rt, [x - w / 2, y - 1.5]], 0.03, seed + 2)
  fillInk(p, WOOD, ink)
  if (lod === 2)
    line(
      p,
      [
        [x - w / 2, y - 0.75],
        [x + w / 2, y - 0.75],
      ],
      0.5,
      WOOD_DARK,
      0.8,
    )
  line(
    p,
    [
      [x - w / 2 + 0.2, y - 1.5],
      [x - w / 2 + 0.2, y - 4.3],
    ],
    1,
    WOOD_DARK,
  )
  line(
    p,
    [
      [x + w / 2 - 0.2, y - 1.5],
      [x + w / 2 - 0.2, y - 4.3],
    ],
    1,
    WOOD_DARK,
  )
  const [ox, oy] = [o[0] * 1.2, -5.6 + o[1]]
  const aw: ReadonlyArray<Pt> = [
    [x - w / 2 - 0.6, y - 3.8],
    [x + w / 2 + 0.6, y - 3.8],
    [x + w / 2 + 0.6 + ox, y + oy],
    [x - w / 2 - 0.6 + ox, y + oy],
  ]
  awning(p, aw, w, color, lod, seed + 3)
}
