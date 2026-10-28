import { TONE } from '../../palette'
import { shade } from '../ink'
import { INK, hair, oval, part, shape, stick, swing } from './kit'
import type { Leg } from './pose'
import type { Pt, Sketch } from './kit'

// A war horse going right, its hooves on the ground at (0, 0), under a
// caparison in its lord's colour: the cloth over its back and its neck,
// dagged at the hem, a light chevron on its flank, its legs and its head
// bare. The legs set how high it stands, as a man's; rearing, its fore
// rises over its hind legs.

const UPPER = 2.1
const LOWER = 2.35
/** From the hind legs to the fore, along the body. */
const LENGTH = 5.6
const HOOF = 0x2e241c
const LIGHT = TONE.parchment

/** The horse's four legs, near and far, fore and hind; how high it rears. */
export type Gait = {
  fore: readonly [Leg, Leg]
  hind: readonly [Leg, Leg]
  rear: number
}

/** Where the horse's body is: its hind and its fore, the angle of its back, and how to place a point given along its body. */
export type Back = {
  hind: Pt
  fore: Pt
  pitch: number
  on: (x: number, y: number) => Pt
}

const reach = (l: Leg) =>
  UPPER * Math.cos(l.hip) + LOWER * Math.cos(l.hip - l.knee)

export function backOf(g: Gait): Back {
  const hy = -Math.max(reach(g.hind[0]), reach(g.hind[1]))
  const fy =
    g.rear > 0 ? hy - g.rear : -Math.max(reach(g.fore[0]), reach(g.fore[1]))
  const pitch = Math.atan2(fy - hy, LENGTH)
  const [c, s] = [Math.cos(pitch), Math.sin(pitch)]
  const hind: Pt = [-2.8, hy]
  const on = (x: number, y: number): Pt => [
    hind[0] + x * c - y * s,
    hind[1] + x * s + y * c,
  ]
  return { hind, fore: on(LENGTH, 0), pitch, on }
}

function leg(sk: Sketch, from: Pt, l: Leg, coat: number, width: number) {
  const knee = swing(from, UPPER, l.hip)
  const hoof = swing(knee, LOWER, l.hip - l.knee)
  stick(sk, [from, knee, hoof], width, coat)
  stick(
    sk,
    [swing(hoof, -0.35, l.hip - l.knee), hoof],
    width + 0.12,
    HOOF,
    INK * 0.6,
  )
}

/** The far legs, darker, behind the body. */
export function farLegs(sk: Sketch, b: Back, g: Gait, coat: number) {
  const dark = shade(coat, 0.35)
  leg(sk, b.on(0.3, 0), g.hind[1], dark, 0.78)
  leg(sk, b.on(LENGTH - 0.3, 0), g.fore[1], dark, 0.7)
}

export function nearLegs(sk: Sketch, b: Back, g: Gait, coat: number) {
  leg(sk, b.on(-0.1, 0), g.hind[0], coat, 0.85)
  leg(sk, b.on(LENGTH + 0.1, 0), g.fore[0], coat, 0.76)
}

/** The tail, the barrel and the neck, under the caparison. */
export function horseBody(sk: Sketch, b: Back, coat: number, mane: number) {
  const { on } = b
  const tail = new Path2D()
  tail.moveTo(...on(-1.2, -1.9))
  tail.quadraticCurveTo(...on(-2.9, -1.2), ...on(-2.5, 2.4))
  tail.quadraticCurveTo(...on(-1.9, 0.4), ...on(-0.8, -1))
  tail.closePath()
  part(sk, tail, mane, INK * 0.8)
  part(sk, oval(...on(2.8, -1), 4.2, 1.85, b.pitch), coat)
  part(
    sk,
    shape([on(5, -1.8), on(7.6, -5), on(8.6, -4.1), on(6.6, -0.2)]),
    coat,
  )
}

/** The head out of the cloth, its ear, its eye and its rein. */
export function horseHead(sk: Sketch, b: Back, coat: number) {
  const { on } = b
  const head = shape([
    on(7.4, -5.1),
    on(8.1, -5.4),
    on(10.6, -3.4),
    on(10.3, -2.5),
    on(9.5, -2.5),
    on(7.9, -3.4),
  ])
  part(sk, head, coat)
  part(sk, shape([on(7.6, -5), on(7.8, -6), on(8.3, -5.2)]), coat, INK * 0.7)
  part(sk, oval(...on(8.6, -4.4), 0.24, 0.24), HOOF, 0)
  const rein = new Path2D()
  rein.moveTo(...on(9.6, -2.9))
  rein.lineTo(...on(4.4, -3.9))
  hair(sk, rein, 0.2, 0x3b2a1c)
}

/** The caparison over the back and up the neck, its hem dagged, its chevron light on the flank. */
export function caparison(sk: Sketch, b: Back) {
  const { on } = b
  const cloth = new Path2D()
  cloth.moveTo(...on(-1.6, -2.4))
  cloth.quadraticCurveTo(...on(2.4, -3.4), ...on(5.2, -2.6))
  cloth.lineTo(...on(7.3, -5.2))
  cloth.lineTo(...on(8.3, -4.4))
  cloth.lineTo(...on(7.1, -0.4))
  cloth.lineTo(...on(7.1, 1.6))
  for (let k = 0; k < 6; k++) {
    const x = 7.1 - (k + 0.5) * 1.55
    cloth.quadraticCurveTo(...on(x, 2.5), ...on(x - 0.78, 1.7))
  }
  cloth.lineTo(...on(-1.95, 1.6))
  cloth.closePath()
  part(sk, cloth, 'dye')
  const chevron = new Path2D()
  chevron.moveTo(...on(0.4, 1))
  chevron.lineTo(...on(2.8, -1.4))
  chevron.lineTo(...on(5.2, 1))
  hair(sk, chevron, 0.6, LIGHT)
  const trim = new Path2D()
  trim.moveTo(...on(-1.7, 1.25))
  trim.lineTo(...on(6.9, 1.25))
  hair(sk, trim, 0.25, LIGHT, 0.9)
}
