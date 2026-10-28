import { TONE } from '../palette'
import {
  WOOD,
  WOOD_DARK,
  add,
  arch,
  css,
  fillInk,
  halo,
  line,
  lw,
  poly,
  shade,
  wob,
} from './ink'
import { banner, moat, pairs, tower, wallRun } from './ramparts'
import type { Detail } from './house'
import type { Pen, Pt } from './ink'

// A lord's castle: a moat, a curtain wall with four round towers under
// cones of slate, the keep flying the lord's banner, the gatehouse; up
// close the portcullis and the bridge over the moat. From afar, a
// crenellated wall between two towers, the keep above with its banner:
// grey stone, the crenels the tell. Local units, some 24 across.

const KEEP = { x: -0.6, y: 1.2, w: 4.6, h: 9.4 }

/** The keep: its two faces, its crenels, its windows, its banner. */
function keep(p: Pen, color: number, lod: Detail) {
  const { x: kx, y: ky, w: kw, h: kh } = KEEP
  const o: Pt = [1.8, -1.2]
  const ink = lod === 2 ? 0.9 : 1
  const right: Pt = [kx + kw / 2, ky]
  const rightTop: Pt = [kx + kw / 2, ky - kh]
  wob(p, [right, add(right, o), add(rightTop, o), rightTop], 0.04, 66)
  fillInk(p, shade(TONE.rampart, 0.2), ink)
  wob(p, [[kx - kw / 2, ky], right, rightTop, [kx - kw / 2, ky - kh]], 0.04, 67)
  fillInk(p, TONE.rampart, ink)
  const g = p.g
  g.beginPath()
  for (let k = 0; k < 4; k++)
    g.rect(kx - kw / 2 + k * (kw / 3.5), ky - kh - 0.9, kw / 7, 0.9)
  for (let k = 0; k < 2; k++) {
    const q = add(rightTop, o, (k * 2 + 0.5) / 4)
    g.moveTo(q[0], q[1])
    g.lineTo(q[0], q[1] - 0.9)
    g.lineTo(q[0] + 0.45, q[1] - 1.2)
    g.lineTo(q[0] + 0.45, q[1] - 0.3)
    g.closePath()
  }
  fillInk(p, TONE.rampart, lod === 2 ? 0.8 : 1)
  for (const [wx, wy] of [
    [kx - 0.9, ky - kh + 2.4],
    [kx + 0.9, ky - kh + 2.4],
    [kx, ky - kh + 5.4],
  ]) {
    arch(p, wx, wy + 0.9, 0.56, 1.18)
    fillInk(p, TONE.door, 0)
  }
  if (lod === 2) {
    g.beginPath()
    for (let r = 1; r < kh; r++)
      for (let s = (r % 2) * 0.6; s < kw - 0.6; s += 1.2) {
        g.moveTo(kx - kw / 2 + s + 0.15, ky - r)
        g.lineTo(kx - kw / 2 + s + 0.8, ky - r)
      }
    g.lineWidth = lw(p, 0.5)
    g.strokeStyle = css(TONE.ink, 0.2)
    g.stroke()
  }
  banner(p, kx + 0.2, ky - kh - 0.9, color, lod)
}

/** The gatehouse, its arch, and up close its portcullis and the bridge. */
function gate(p: Pen, lod: Detail) {
  const g = p.g
  wob(
    p,
    [
      [-2.2, 5],
      [2.2, 5],
      [2.2, 0.4],
      [-2.2, 0.4],
    ],
    0.04,
    70,
  )
  fillInk(p, TONE.rampart, lod === 2 ? 0.9 : 1)
  g.beginPath()
  for (let k = 0; k < 3; k++) g.rect(-2.2 + k * 1.75, -0.4, 0.8, 0.8)
  fillInk(p, TONE.rampart, 0.8)
  arch(p, 0, 5, 2, 3.2)
  fillInk(p, TONE.door, 0.8)
  if (lod < 2) return
  g.beginPath()
  for (let k = -0.6; k <= 0.61; k += 0.4) {
    g.moveTo(k, 2.2)
    g.lineTo(k, 4.4)
  }
  for (let r = 2.6; r < 4.5; r += 0.55) {
    g.moveTo(-0.9, r)
    g.lineTo(0.9, r)
  }
  g.lineWidth = lw(p, 0.6)
  g.strokeStyle = css(TONE.lead, 0.9)
  g.stroke()
  wob(
    p,
    [
      [-1.1, 5.1],
      [1.1, 5.1],
      [1.4, 9],
      [-1.4, 9],
    ],
    0.04,
    71,
  )
  fillInk(p, WOOD, 0.7)
  g.beginPath()
  for (let r = 5.8; r < 9; r += 0.65) {
    g.moveTo(-1.2, r)
    g.lineTo(1.2, r)
  }
  g.lineWidth = lw(p, 0.5)
  g.strokeStyle = css(WOOD_DARK, 0.7)
  g.stroke()
}

/** The castle drawn, at mid distance (1) or up close (2). */
export function castleNear(p: Pen, color: number, lod: Detail) {
  moat(p, lod)
  const BL: Pt = [-7, -1.2]
  const BR: Pt = [7, -1.2]
  const FL: Pt = [-8, 4.6]
  const FR: Pt = [8, 4.6]
  const wh = 3.2
  wallRun(p, BL, BR, wh, lod, 61)
  tower(p, [BL[0], BL[1], 1.4, 4.6], lod, 62, color)
  tower(p, [BR[0], BR[1], 1.4, 4.6], lod, 63, color)
  wallRun(p, BL, FL, wh, lod, 64)
  wallRun(p, FR, BR, wh, lod, 65)
  keep(p, color, lod)
  wallRun(p, FL, [-2, 4.6], wh, lod, 68)
  wallRun(p, [2, 4.6], FR, wh, lod, 69)
  gate(p, lod)
  tower(p, [FL[0], FL[1], 1.75, 5.4], lod, 72, color)
  tower(p, [FR[0], FR[1], 1.75, 5.4], lod, 73, color)
}

const OUTLINE: ReadonlyArray<Pt> = pairs([
  -8, 4, -8, -3.4, -9.4, -3.4, -9.4, -5, -7.9, -5, -7.9, -4.2, -6.6, -4.2, -6.6,
  -5, -5.2, -5, -5.2, -3.4, -6.4, -3.4, -6.4, -1, -3, -1, -3, -8.6, -3.4, -8.6,
  -3.4, -10, -2, -10, -2, -9.2, -0.6, -9.2, -0.6, -10, 0.8, -10, 0.8, -9.2, 2.2,
  -9.2, 2.2, -10, 3.4, -10, 3.4, -8.6, 3, -8.6, 3, -1, 6.4, -1, 6.4, -3.4, 5.2,
  -3.4, 5.2, -5, 6.6, -5, 6.6, -4.2, 7.9, -4.2, 7.9, -5, 9.4, -5, 9.4, -3.4, 8,
  -3.4, 8, 4,
])

/** From afar: a crenellated wall between two towers, the keep above with its banner. */
export function castleFar(p: Pen, color: number) {
  const g = p.g
  poly(p, OUTLINE)
  halo(p)
  poly(p, OUTLINE)
  fillInk(p, TONE.rampart, 1.4)
  poly(p, [
    [-1.3, 4],
    [-1.3, 1.6],
    [0, 0.4],
    [1.3, 1.6],
    [1.3, 4],
  ])
  fillInk(p, TONE.door, 0)
  g.save()
  poly(p, OUTLINE)
  g.clip()
  g.beginPath()
  g.rect(3, -11, 7, 16)
  g.fillStyle = css(TONE.ink, 0.12)
  g.fill()
  g.restore()
  line(
    p,
    [
      [0.2, -10],
      [0.2, -15.4],
    ],
    1.4,
    TONE.ink,
  )
  poly(p, [
    [0.2, -15.4],
    [5, -14.6],
    [4, -13.4],
    [5, -12.2],
    [0.2, -12.6],
  ])
  fillInk(p, color, 1.2)
}
