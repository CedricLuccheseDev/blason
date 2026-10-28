import { TONE } from '../../palette'
import { IRON } from './heads'
import { INK, hair, oval, part, shape, stick } from './kit'
import type { Pt, Sketch } from './kit'

// What a man carries: his weapon, a shaft held at a hand and turned to an
// angle, its iron at the far end; his shield on his near arm, in his lord's
// colour. The spear of the men-at-arms; the bill, the fork, the axe and the
// club of the levy.

const SHAFT = 0x7a5634
const WOOD = 0x9a7046
const LIGHT = TONE.parchment

export type Weapon = 'spear' | 'bill' | 'fork' | 'axe' | 'club'

/** Along a weapon: the point so far along it from the hand. */
export const along = (hand: Pt, angle: number, k: number): Pt => [
  hand[0] + Math.sin(angle) * k,
  hand[1] - Math.cos(angle) * k,
]
/** Across a weapon, to its fore side. */
const aside = (p: Pt, angle: number, k: number): Pt => [
  p[0] + Math.cos(angle) * k,
  p[1] + Math.sin(angle) * k,
]

/** How far each weapon runs behind the hand and before it, and where the other hand holds it. */
const HAFT: Record<Weapon, { back: number; front: number; other: number }> = {
  spear: { back: 3.6, front: 8.6, other: 0 },
  bill: { back: 2.6, front: 6, other: 2 },
  fork: { back: 2.8, front: 5.8, other: 2 },
  axe: { back: 0.8, front: 3.8, other: 0.8 },
  club: { back: 0.6, front: 3.4, other: 0.7 },
}

/** Where the other hand holds the weapon: none for a spear held in one hand. */
export function otherHand(w: Weapon, hand: Pt, angle: number): Pt | null {
  const k = HAFT[w].other
  return k > 0 ? along(hand, angle, k) : null
}

type Head = (sk: Sketch, tip: Pt, a: number) => void

const HEADS: Record<Weapon, Head> = {
  spear: (sk, tip, a) => {
    const base = along(tip, a, -1.2)
    part(
      sk,
      shape([aside(base, a, 0.42), along(tip, a, 0.3), aside(base, a, -0.42)]),
      IRON,
      INK * 0.7,
    )
  },
  bill: (sk, tip, a) => {
    const blade = shape([
      along(tip, a, -2.2),
      aside(along(tip, a, -1.6), a, 0.9),
      aside(along(tip, a, -0.2), a, 0.75),
      along(tip, a, 0.6),
      aside(along(tip, a, -0.5), a, -0.25),
      aside(along(tip, a, -1.3), a, -0.7),
      aside(along(tip, a, -1.8), a, -0.2),
    ])
    part(sk, blade, IRON, INK * 0.7)
  },
  fork: (sk, tip, a) => {
    const root = along(tip, a, -1.6)
    for (const k of [-0.55, 0, 0.55]) {
      const from = aside(root, a, k)
      stick(sk, [from, aside(tip, a, k * 1.25)], 0.22, IRON, 0.12)
    }
    stick(sk, [aside(root, a, -0.6), aside(root, a, 0.6)], 0.3, IRON, 0.12)
  },
  axe: (sk, tip, a) => {
    const neck = along(tip, a, -0.7)
    const blade = shape([
      aside(neck, a, 0.2),
      aside(along(tip, a, -1.7), a, 1.7),
      aside(along(tip, a, 0.5), a, 1.6),
      aside(tip, a, 0.2),
    ])
    part(sk, blade, IRON, INK * 0.7)
  },
  club: (sk, tip, a) => {
    const knob = along(tip, a, -0.6)
    part(sk, oval(knob[0], knob[1], 0.75, 1.15, a), WOOD, INK * 0.8)
  },
}

/** The weapon held at a hand, turned to an angle from straight up. */
export function weapon(sk: Sketch, w: Weapon, hand: Pt, angle: number) {
  const { back, front } = HAFT[w]
  const tip = along(hand, angle, front)
  const width = w === 'club' ? 0.55 : 0.36
  stick(sk, [along(hand, angle, -back), tip], width, SHAFT, INK * 0.6)
  HEADS[w](sk, tip, angle)
}

/** A kite shield on the near arm, in the lord's colour, a light chevron across it; tilted as the arm rises. */
export function kite(sk: Sketch, hand: Pt, tilt: number, size = 1) {
  const [x, y] = [hand[0] + 0.5 * size, hand[1] - 0.2]
  const pt = (dx: number, dy: number): Pt => {
    const [c, s] = [Math.cos(tilt), Math.sin(tilt)]
    return [x + (dx * c - dy * s) * size, y + (dx * s + dy * c) * size]
  }
  const body = new Path2D()
  body.moveTo(...pt(-1.35, -1.8))
  body.quadraticCurveTo(...pt(0, -2.5), ...pt(1.35, -1.8))
  body.quadraticCurveTo(...pt(1.4, 0.9), ...pt(0, 2.9))
  body.quadraticCurveTo(...pt(-1.4, 0.9), ...pt(-1.35, -1.8))
  body.closePath()
  part(sk, body, 'dye')
  const chevron = new Path2D()
  chevron.moveTo(...pt(-1.05, 0.2))
  chevron.lineTo(...pt(0, -1.1))
  chevron.lineTo(...pt(1.05, 0.2))
  hair(sk, chevron, 0.5 * size, LIGHT)
}

/** A round shield of boards, faced in the lord's colour, an iron boss. */
export function round(sk: Sketch, hand: Pt) {
  const [x, y] = [hand[0] + 0.45, hand[1] - 0.3]
  part(sk, oval(x, y, 1.55, 1.75), 'dye')
  part(sk, oval(x + 0.05, y, 0.45, 0.5), IRON, INK * 0.6)
}
