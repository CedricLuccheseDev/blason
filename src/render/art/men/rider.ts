import { shade } from '../ink'
import { arm, at, coat, face } from './body'
import { along } from './gear'
import { IRON, headwear } from './heads'
import {
  backOf,
  caparison,
  farLegs,
  horseBody,
  horseHead,
  nearLegs,
} from './horse'
import { INK, part, shape, stick } from './kit'
import { FIGHT, WALK, phaseOf, stride } from './pose'
import type { Garb } from './body'
import type { Headwear } from './heads'
import type { Gait } from './horse'
import type { Pt, Sketch } from './kit'

// A rider of the raid on his horse: the horse trots on the march, its legs
// paired across, and rears at the front as he drives his couched lance, its
// pennon in his lord's colour flying back. The standard-bearer of a raid
// rides as well, the pole in his hands instead of a lance.

export type RiderKit = {
  horse: number
  mane: number
  head: Headwear
  /** The standard-bearer: no lance. */
  bearer?: boolean
}

type Seat = { gait: Gait; grip: Pt; angle: number; lean: number; wave: number }

const STILL: Gait = {
  fore: [
    { hip: 0.1, knee: 0.04 },
    { hip: -0.06, knee: 0 },
  ],
  hind: [
    { hip: -0.08, knee: 0.04 },
    { hip: 0.08, knee: 0 },
  ],
  rear: 0,
}

/** The fight's six beats: how far the fore rises, the fore legs folding, the lance drawn back and driven. */
const BEATS = {
  rear: [0.3, 0.8, 1.3, 1, 0.5, 0.2],
  fold: [0.3, 0.7, 1.1, 1, 0.6, 0.35],
  x: [0.4, -0.4, -0.9, 1.9, 1.5, 0.8],
  angle: [1.3, 1.26, 1.22, 1.5, 1.47, 1.4],
  lean: [0, -0.1, -0.16, 0.22, 0.16, 0.06],
}

/** The trot: near fore with far hind, far fore with near hind. */
function trot(phase: number): Gait {
  const [a, b] = stride(phase, 0.4)
  const bend = (l: { hip: number; knee: number }) => ({
    hip: l.hip,
    knee: l.knee * 1.3,
  })
  return { fore: [bend(a), bend(b)], hind: [bend(b), bend(a)], rear: 0 }
}

export function seatAt(frame: number): Seat {
  if (frame === 0)
    return { gait: STILL, grip: [1, 2.3], angle: 0.42, lean: 0, wave: 0 }
  if (frame <= WALK) {
    const phase = phaseOf(frame - 1)
    return {
      gait: trot(phase),
      grip: [1, 2.3 + 0.2 * Math.abs(Math.sin(phase))],
      angle: 0.42 + 0.06 * Math.sin(phase * 2),
      lean: 0.06,
      wave: Math.sin(phase),
    }
  }
  const k = frame - 1 - WALK
  const fold = BEATS.fold[k]
  return {
    gait: {
      fore: [
        { hip: 0.3 + fold * 0.6, knee: fold * 1.6 },
        { hip: 0.2 + fold * 0.5, knee: fold * 1.4 },
      ],
      hind: [
        { hip: -0.35, knee: 0.2 },
        { hip: -0.15, knee: 0.1 },
      ],
      rear: BEATS.rear[k],
    },
    grip: [BEATS.x[k], 1.2],
    angle: BEATS.angle[k],
    lean: BEATS.lean[k],
    wave: Math.sin((k / FIGHT) * Math.PI * 2),
  }
}

/** The lance, its iron, and its pennon flying back, dagged in two tails. */
function lance(sk: Sketch, hand: Pt, angle: number, wave: number) {
  const tip = along(hand, angle, 11.5)
  stick(sk, [along(hand, angle, -3), tip], 0.4, 0x7a5634, INK * 0.6)
  const base = along(tip, angle, -1.1)
  const across = (p: Pt, k: number): Pt => [
    p[0] + Math.cos(angle) * k,
    p[1] + Math.sin(angle) * k,
  ]
  part(
    sk,
    shape([across(base, 0.4), along(tip, angle, 0.25), across(base, -0.4)]),
    IRON,
    INK * 0.7,
  )
  const a = along(hand, angle, 10.1)
  const b = along(hand, angle, 8.5)
  const fly = (p: Pt, back: number, drop: number): Pt => [
    p[0] - back,
    p[1] + drop + wave * 0.35,
  ]
  part(
    sk,
    shape([a, fly(a, 3.2, 0.2), fly(a, 2.2, 0.9), fly(b, 3.2, 0.9), b]),
    'dye',
    INK * 0.8,
  )
}

const RIDER: Garb = {
  hose: IRON,
  coat: 'dye',
  sleeves: IRON,
  hem: 0.7,
  flare: 1.55,
  belt: 0x5b3d22,
}

export function drawRider(sk: Sketch, kit: RiderKit, frame: number) {
  const seat = seatAt(frame)
  const back = backOf(seat.gait)
  const hip = back.on(2.3, -2.9)
  const shoulder = at(hip, [0, -3], seat.lean)
  const f = {
    hip,
    shoulder,
    head: at(shoulder, [0.2, -1.55], seat.lean * 0.6),
    lean: seat.lean,
  }
  const far: Pt = [shoulder[0] - 0.4, shoulder[1] + 0.15]
  const near: Pt = [shoulder[0] + 0.25, shoulder[1] + 0.2]
  farLegs(sk, back, seat.gait, kit.horse)
  nearLegs(sk, back, seat.gait, kit.horse)
  horseBody(sk, back, kit.horse, kit.mane)
  caparison(sk, back)
  horseHead(sk, back, kit.horse)
  const hand: Pt = kit.bearer
    ? [far[0] + 2.55, far[1] + 0.6]
    : [far[0] + seat.grip[0], far[1] + seat.grip[1]]
  arm(sk, far, hand, shade(IRON, 0.25))
  if (!kit.bearer) lance(sk, hand, seat.angle, seat.wave)
  coat(sk, f, RIDER)
  const knee: Pt = [hip[0] + 1.4, hip[1] + 1.1]
  const foot: Pt = [hip[0] + 1.1, hip[1] + 3.3]
  stick(sk, [hip, knee, foot], 1.05, IRON)
  stick(sk, [foot, [foot[0] + 0.7, foot[1] + 0.1]], 0.75, 0x3b2a1c)
  face(sk, f)
  headwear(sk, f.head, kit.head)
  arm(
    sk,
    near,
    kit.bearer
      ? [near[0] + 1.9, near[1] - 0.8]
      : [near[0] + 1.8, near[1] + 1.9],
    IRON,
  )
}

/** Where a riding standard-bearer's hands hold the pole, from his feet, standing still. */
export function riderPoleHand(): Pt {
  const seat = seatAt(0)
  const hip = backOf(seat.gait).on(2.3, -2.9)
  const shoulder = at(hip, [0, -3], 0)
  return [shoulder[0] + 0.25 + 1.9, shoulder[1] + 0.2 - 0.8]
}
