import { TONE } from '../palette'
import {
  WOOD_DARK,
  add,
  css,
  ellipse,
  fillInk,
  lerp,
  line,
  lw,
  poly,
} from './ink'
import type { Detail } from './house'
import type { Pen, Pt } from './ink'

// What lives on the land, drawn apart from it so that it may move: a
// windmill's sails round their hub, a puff of chimney smoke, a glint on
// gold, a peasant hoeing his field. Each centred on (0, 0) in local units.

const SKIN = 0xe8d9c0
/** A tunic's colour, the field's people's. */
const TUNIC = 0x8a6a48

/** The four sails round their hub at (0, 0), turned by `angle`; up close their lattice. */
export function sails(p: Pen, angle: number, lod: Detail) {
  const g = p.g
  const L = 5.2
  for (let k = 0; k < 4; k++) {
    const a = angle + (k * Math.PI) / 2
    const u: Pt = [Math.cos(a), Math.sin(a)]
    const v: Pt = [-Math.sin(a), Math.cos(a)]
    const p0: Pt = [u[0] * 0.9, u[1] * 0.9]
    const p1: Pt = [u[0] * L, u[1] * L]
    const q0 = add(p0, v, 0.95)
    const q1 = add(p1, v, 1.05)
    poly(p, [p0, p1, q1, q0])
    g.fillStyle = css(TONE.parchment, 0.9)
    g.fill()
    if (lod === 2) {
      g.beginPath()
      for (let s = 1; s < 5; s++) {
        const [a0, b0] = [lerp(p0, p1, s / 5), lerp(q0, q1, s / 5)]
        g.moveTo(a0[0], a0[1])
        g.lineTo(b0[0], b0[1])
      }
      const [m0, m1] = [lerp(p0, q0, 0.5), lerp(p1, q1, 0.5)]
      g.moveTo(m0[0], m0[1])
      g.lineTo(m1[0], m1[1])
      g.lineWidth = lw(p, 0.5)
      g.strokeStyle = css(TONE.ink, 0.45)
      g.stroke()
    }
    poly(p, [p0, p1, q1, q0])
    g.lineWidth = lw(p, 0.7)
    g.strokeStyle = css(TONE.ink, 0.8)
    g.stroke()
    line(p, [[0, 0], p1], 1.1, WOOD_DARK)
  }
  ellipse(p, 0, 0, 0.45, 0.45)
  fillInk(p, WOOD_DARK, 0.6)
}

/** A puff of smoke, one unit across: a pale ball ringed in faint ink. */
export function puff(p: Pen) {
  ellipse(p, 0, 0, 0.5, 0.43)
  p.g.fillStyle = css(0xcfc3a6)
  p.g.fill()
  p.g.lineWidth = lw(p, 0.6)
  p.g.strokeStyle = css(TONE.ink, 0.5)
  p.g.stroke()
}

/** A glint, a cross of light one unit across each way. */
export function glint(p: Pen) {
  line(
    p,
    [
      [-0.5, 0],
      [0.5, 0],
    ],
    1.2,
    TONE.glint,
  )
  line(
    p,
    [
      [0, -0.5],
      [0, 0.5],
    ],
    1.2,
    TONE.glint,
  )
}

/** A peasant bending to his hoe, `bend` from 0 (up) to 1 (down); his feet at (0, 0). */
export function hoer(p: Pen, bend: number) {
  const g = p.g
  const hip: Pt = [0, -1.5]
  const head: Pt = [0.35 + bend * 0.55, -2.75 + bend * 0.45]
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.beginPath()
  g.moveTo(-0.35, 0)
  g.lineTo(hip[0], hip[1])
  g.lineTo(0.4, 0)
  g.lineWidth = lw(p, 1)
  g.strokeStyle = css(TONE.ink, 0.85)
  g.stroke()
  line(p, [hip, [head[0] - 0.1, head[1] + 0.35]], 2.2, TUNIC, 0.95)
  ellipse(p, head[0], head[1], 0.32, 0.32)
  g.fillStyle = css(SKIN)
  g.fill()
  g.lineWidth = lw(p, 0.6)
  g.strokeStyle = css(TONE.ink, 0.8)
  g.stroke()
  const hand: Pt = [head[0] + 0.1, head[1] + 0.7]
  const blade: Pt = [hand[0] + 0.6 + bend * 0.4, 0.05 - (1 - bend) * 0.6]
  line(
    p,
    [[hand[0] - 0.8 + bend * 0.3, hand[1] - 0.9 + bend * 0.5], blade],
    0.7,
    WOOD_DARK,
  )
}
