import { shade } from '../ink'
import { INK, oval, part, shape, stick, swing } from './kit'
import type { Leg, Pose } from './pose'
import type { Pt, Sketch, Tone } from './kit'

// A man's body, facing right, his feet on the ground at (0, 0): two legs in
// hose, a coat from the shoulders down to the hips or the knees, two arms, a
// head. His near side, the left, is towards the viewer; his far side is
// drawn darker, behind him. The legs set his height: the foot on the
// ground carries him, so that he rises and sinks as he walks.

export const SKIN = 0xe3c9a4
export const THIGH = 2.4
export const SHIN = 2.5
/** From the hips to the shoulders, and to the middle of the head. */
const TORSO = 3.3
const NECK = 1.55
export const HEAD = 1.45

/** What a man wears, all he needs to be drawn but his head and his gear. */
export type Garb = {
  hose: number
  coat: Tone
  sleeves: number
  /** Where the coat's hem falls, below the hips; how wide it flares. */
  hem: number
  flare: number
  belt?: number
  /** A trim across the coat in a light colour: a man-at-arms' chevron. */
  chevron?: number
}

/** The joints of a man as he stands in a pose. */
export type Frame = {
  hip: Pt
  shoulder: Pt
  head: Pt
  lean: number
}

const turn = ([x, y]: Pt, a: number): Pt => [
  x * Math.cos(a) - y * Math.sin(a),
  x * Math.sin(a) + y * Math.cos(a),
]
export const at = (o: Pt, v: Pt, a = 0): Pt => {
  const [x, y] = turn(v, a)
  return [o[0] + x, o[1] + y]
}

const reach = (l: Leg) =>
  THIGH * Math.cos(l.hip) + SHIN * Math.cos(l.hip - l.knee)

/** His joints: the hips as high as his longest leg, the torso leaning from them. */
export function frameOf(pose: Pose): Frame {
  const hip: Pt = [0, -Math.max(reach(pose.legs[0]), reach(pose.legs[1]))]
  const shoulder = at(hip, [0, -TORSO], pose.lean)
  const head = at(shoulder, [0.2, -NECK], pose.lean * 0.6)
  return { hip, shoulder, head, lean: pose.lean }
}

/** A leg from the hip, its shoe forward. */
export function leg(sk: Sketch, hip: Pt, l: Leg, hose: number) {
  const knee = swing(hip, THIGH, l.hip)
  const foot = swing(knee, SHIN, l.hip - l.knee)
  stick(sk, [hip, knee, foot], 1.2, hose)
  stick(sk, [foot, [foot[0] + 0.8, foot[1] + 0.05]], 0.85, 0x3b2a1c)
}

/** Both legs: the far one darker, behind. */
export function legs(sk: Sketch, f: Frame, pose: Pose, hose: number) {
  leg(sk, [f.hip[0] - 0.35, f.hip[1]], pose.legs[1], shade(hose, 0.3))
  leg(sk, [f.hip[0] + 0.3, f.hip[1]], pose.legs[0], hose)
}

/** The coat from the shoulders to its hem, flaring, belted, and the light chevron across it if he bears one. */
export function coat(sk: Sketch, f: Frame, garb: Garb) {
  const { hip, lean } = f
  const w = garb.flare
  const pts: Array<Pt> = [
    [-1.35, -TORSO],
    [1.45, -TORSO],
    [1.3, -1],
    [w + 0.15, garb.hem],
    [-w, garb.hem],
    [-1.25, -1],
  ]
  part(sk, shape(pts.map((p) => at(hip, p, lean))), garb.coat)
  if (garb.chevron !== undefined)
    stick(
      sk,
      [
        at(hip, [-1.05, -0.6], lean),
        at(hip, [0.1, -2.1], lean),
        at(hip, [1.15, -0.6], lean),
      ],
      0.55,
      garb.chevron,
      0,
    )
  if (garb.belt !== undefined)
    stick(
      sk,
      [at(hip, [-1.1, -0.5], lean), at(hip, [1.2, -0.5], lean)],
      0.4,
      garb.belt,
      0,
    )
}

/** An arm from the shoulder to a hand, the elbow bent below; the hand bare. */
export function arm(sk: Sketch, shoulder: Pt, hand: Pt, sleeve: number) {
  const len = Math.hypot(hand[0] - shoulder[0], hand[1] - shoulder[1])
  const sag = len < 2.8 ? 0.8 : 0.45
  const elbow: Pt = [
    (shoulder[0] + hand[0]) / 2 - sag * 0.8,
    (shoulder[1] + hand[1]) / 2 + sag,
  ]
  stick(sk, [shoulder, elbow, hand], 1.05, sleeve)
  part(sk, oval(hand[0], hand[1], 0.5, 0.5), SKIN, INK * 0.7)
}

/** The head: a face turned forward, its nose, the colour of the skin. */
export function face(sk: Sketch, f: Frame, skin = SKIN) {
  const [x, y] = f.head
  part(
    sk,
    shape([
      [x + 1.25, y - 0.2],
      [x + 1.95, y + 0.35],
      [x + 1.25, y + 0.55],
    ]),
    skin,
    INK * 0.7,
  )
  part(sk, oval(x, y, HEAD, HEAD * 1.04), skin)
}
