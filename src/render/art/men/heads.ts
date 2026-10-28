import { INK, hair, oval, part, shape } from './kit'
import { HEAD } from './body'
import type { Pt, Sketch, Tone } from './kit'

// What a man wears on his head, over his face, the face turned right: the
// iron of the men-at-arms, the straw, felt and cloth of the peasants. What
// a man wears on his head is what tells him first at a glance.

export const IRON = 0x9097a0
const IRON_DARK = 0x5d636b
export const STRAW = 0xd9b55c
const HAIR = 0x5a3b22

export type Headwear =
  | { kind: 'nasal' }
  | { kind: 'barrel' }
  | { kind: 'coif' }
  | { kind: 'kettle' }
  | { kind: 'straw' }
  | { kind: 'hood'; tone: Tone }
  | { kind: 'cap'; tone: Tone }
  | { kind: 'bare'; hair?: number }

type Draw = (sk: Sketch, h: Pt, w: Headwear) => void

const R = HEAD

/** A conical helm with its nasal, a mail aventail at the neck. */
const nasal: Draw = (sk, [x, y]) => {
  part(
    sk,
    shape([
      [x - 1.3, y + 0.5],
      [x - 1.5, y + 1.6],
      [x + 0.2, y + 1.7],
      [x - 0.2, y + 0.4],
    ]),
    IRON_DARK,
  )
  const cone = new Path2D()
  cone.moveTo(x - R - 0.12, y + 0.05)
  cone.quadraticCurveTo(x - 1.1, y - 1.5, x + 0.1, y - 2.35)
  cone.quadraticCurveTo(x + 1.2, y - 1.5, x + R + 0.12, y + 0.05)
  cone.closePath()
  part(sk, cone, IRON)
  part(
    sk,
    shape([
      [x + 1.1, y - 0.1],
      [x + 1.6, y - 0.1],
      [x + 1.55, y + 1],
      [x + 1.2, y + 1],
    ]),
    IRON,
    INK * 0.7,
  )
}

/** A flat-topped helm closed over the face, its eye slit dark. */
const barrel: Draw = (sk, [x, y]) => {
  const helm = new Path2D()
  helm.moveTo(x - R - 0.1, y + 1.25)
  helm.lineTo(x - R - 0.15, y - 1.2)
  helm.quadraticCurveTo(x, y - 1.9, x + R + 0.25, y - 1.25)
  helm.lineTo(x + R + 0.35, y + 1.2)
  helm.closePath()
  part(sk, helm, IRON)
  const slit = new Path2D()
  slit.moveTo(x + 0.2, y - 0.2)
  slit.lineTo(x + R + 0.3, y - 0.25)
  hair(sk, slit, 0.32)
  const cross = new Path2D()
  cross.moveTo(x + 1.1, y + 0.15)
  cross.lineTo(x + 1.1, y + 1)
  hair(sk, cross, 0.18, IRON_DARK)
}

/** A mail hood round the face, the face showing in its opening. */
const coif: Draw = (sk, [x, y]) => {
  const hood = new Path2D()
  hood.moveTo(x + 0.7, y + 1.8)
  hood.lineTo(x - 1.6, y + 1.9)
  hood.quadraticCurveTo(x - 2, y - 1.6, x + 0.1, y - 1.75)
  hood.quadraticCurveTo(x + 1.6, y - 1.6, x + 1.55, y - 0.3)
  hood.lineTo(x + 0.5, y - 0.6)
  hood.quadraticCurveTo(x + 0.1, y + 0.6, x + 0.7, y + 1.8)
  hood.closePath()
  part(sk, hood, IRON)
  for (const k of [-0.9, -0.1, 0.7])
    hair(sk, oval(x - 0.6, y + k, 0.3, 0.12), 0.12, IRON_DARK, 0.8)
}

/** A round iron cap with a broad brim. */
const kettle: Draw = (sk, [x, y]) => {
  const crown = new Path2D()
  crown.moveTo(x - 1.3, y - 0.3)
  crown.quadraticCurveTo(x, y - 2.6, x + 1.3, y - 0.3)
  crown.closePath()
  part(sk, crown, IRON)
  part(sk, oval(x, y - 0.3, 2.3, 0.45), IRON)
}

/** A wide straw hat, its crown low. */
const straw: Draw = (sk, [x, y]) => {
  part(sk, oval(x + 0.1, y - 0.6, 2.7, 0.62), STRAW)
  const crown = new Path2D()
  crown.moveTo(x - 1.25, y - 0.75)
  crown.quadraticCurveTo(x - 0.9, y - 2.3, x + 0.1, y - 2.3)
  crown.quadraticCurveTo(x + 1.1, y - 2.3, x + 1.3, y - 0.75)
  crown.closePath()
  part(sk, crown, STRAW)
  const band = new Path2D()
  band.moveTo(x - 1.2, y - 1)
  band.lineTo(x + 1.25, y - 1)
  hair(sk, band, 0.3, 0x8a6a2c)
}

/** A cloth hood over the head and shoulders, the face bare in its opening, its tail hanging behind. */
const hood: Draw = (sk, [x, y], w) => {
  const tone = w.kind === 'hood' ? w.tone : 0
  const cloth = new Path2D()
  cloth.moveTo(x + 1.1, y + 2)
  cloth.lineTo(x - 1.5, y + 2.1)
  cloth.quadraticCurveTo(x - 2.1, y + 1.3, x - 2.6, y + 2.3)
  cloth.quadraticCurveTo(x - 2.5, y + 0.6, x - 1.6, y - 0.6)
  cloth.quadraticCurveTo(x - 1.3, y - 1.9, x + 0.2, y - 1.85)
  cloth.quadraticCurveTo(x + 1.5, y - 1.7, x + 1.55, y - 0.7)
  cloth.quadraticCurveTo(x + 0.2, y - 0.9, x + 0.15, y + 0.4)
  cloth.quadraticCurveTo(x + 0.3, y + 1.3, x + 1.1, y + 2)
  cloth.closePath()
  part(sk, cloth, tone)
}

/** A soft felt cap, rolled at its edge. */
const cap: Draw = (sk, [x, y], w) => {
  const tone = w.kind === 'cap' ? w.tone : 0
  const felt = new Path2D()
  felt.moveTo(x - 1.55, y - 0.2)
  felt.quadraticCurveTo(x - 1.6, y - 2.2, x + 0.3, y - 2)
  felt.quadraticCurveTo(x + 1.6, y - 1.7, x + 1.5, y - 0.4)
  felt.closePath()
  part(sk, felt, tone)
  part(sk, oval(x, y - 0.35, 1.65, 0.38), tone, INK * 0.8)
}

/** Bare-headed, his hair to the neck. */
const bare: Draw = (sk, [x, y], w) => {
  const tone = (w.kind === 'bare' && w.hair) || HAIR
  const locks = new Path2D()
  locks.moveTo(x + 0.9, y - 0.9)
  locks.quadraticCurveTo(x + 0.2, y - 1.9, x - 1, y - 1.2)
  locks.quadraticCurveTo(x - 1.8, y - 0.2, x - 1.2, y + 1)
  locks.lineTo(x - 0.3, y + 0.2)
  locks.closePath()
  part(sk, locks, tone, INK * 0.7)
}

const HEADWEAR: Record<Headwear['kind'], Draw> = {
  nasal,
  barrel,
  coif,
  kettle,
  straw,
  hood,
  cap,
  bare,
}

/** What he wears on his head, over his face. */
export function headwear(sk: Sketch, head: Pt, w: Headwear) {
  HEADWEAR[w.kind](sk, head, w)
}
