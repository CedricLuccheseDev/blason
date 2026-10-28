import type { Pt } from './kit'

// How a man stands in each of his frames: still; six steps of a walk, the
// legs and arms swinging; six beats of a fight, a thrust or a blow. Every
// angle in radians, measured from straight down and turning forward for a
// limb, from straight up and turning forward for a weapon.

/** Frames a man has: one still, then the walk, then the fight. */
export const WALK = 6
export const FIGHT = 6
export const FRAMES = 1 + WALK + FIGHT

export type Leg = { hip: number; knee: number }

export type Pose = {
  /** The near leg and the far one. */
  legs: readonly [Leg, Leg]
  /** The torso leaning forward. */
  lean: number
  /** The weapon hand from the shoulder; the weapon's angle; the free or shield arm's angle. */
  grip: Pt
  angle: number
  guard: number
}

/** How a man fights: thrusting a spear or a fork, or bringing a blade down over his head. */
export type Blow = 'thrust' | 'chop' | 'spear'

/** The phase of a step of the walk, 0 to 2π. */
export const phaseOf = (frame: number) => (frame / WALK) * Math.PI * 2

/** The legs at a phase of the walk: one forward as the other goes back, the knee bent as it swings through. */
export function stride(phase: number, amp = 0.42): readonly [Leg, Leg] {
  const s = Math.sin(phase)
  const c = Math.cos(phase)
  return [
    { hip: amp * s, knee: 0.7 * Math.max(0, c) },
    { hip: -amp * s, knee: 0.7 * Math.max(0, -c) },
  ]
}

const STILL: readonly [Leg, Leg] = [
  { hip: 0.12, knee: 0.04 },
  { hip: -0.1, knee: 0.02 },
]

/** The feet set apart for the fight, the weight shifting on the beat. */
const stance = (t: number): readonly [Leg, Leg] => [
  { hip: 0.42 + 0.08 * Math.sin(t), knee: 0.3 },
  { hip: -0.34, knee: 0.16 + 0.06 * Math.cos(t) },
]

/** The six beats of each blow: the hand's place (x, y), the weapon's angle, the lean, the shield arm. */
const BLOWS: Record<
  Blow,
  {
    x: Array<number>
    y: Array<number>
    angle: Array<number>
    lean: Array<number>
    guard: Array<number>
  }
> = {
  // A spear levelled over the shield, drawn back, then driven forward.
  spear: {
    x: [0.4, -0.5, -1, 2.1, 1.7, 0.9],
    y: [1, 0.9, 0.8, 0.7, 0.8, 0.9],
    angle: [1.36, 1.34, 1.3, 1.46, 1.44, 1.4],
    lean: [0.04, -0.04, -0.08, 0.24, 0.18, 0.08],
    guard: [0.95, 1.05, 1.15, 1.25, 1.15, 1],
  },
  // A fork or a bill held low in both hands and jabbed.
  thrust: {
    x: [0.2, -0.6, -1.1, 1.7, 1.3, 0.6],
    y: [2.3, 2.1, 2, 1.6, 1.7, 2],
    angle: [1.2, 1.12, 1.06, 1.38, 1.32, 1.24],
    lean: [0.02, -0.08, -0.12, 0.26, 0.2, 0.1],
    guard: [0.6, 0.5, 0.4, 0.8, 0.7, 0.6],
  },
  // An axe or a flail raised behind the head and brought down.
  chop: {
    x: [0.9, 0.1, -0.5, 1.1, 2, 1.5],
    y: [1.4, -0.9, -2.1, -1.4, 1.5, 2],
    angle: [-0.2, -1.1, -1.6, 0.5, 1.9, 1.2],
    lean: [0, -0.12, -0.18, 0.1, 0.28, 0.14],
    guard: [0.5, 1.3, 1.6, 1.1, 0.3, 0.4],
  },
}

/** How a man carries his weapon on the march: the hand's place, the weapon's angle. */
export type Carry = { grip: Pt; angle: number }

/** The pose of a man on foot at a frame: still, walking or fighting. */
export function footPose(frame: number, carry: Carry, blow: Blow): Pose {
  if (frame === 0)
    return {
      legs: STILL,
      lean: 0,
      grip: carry.grip,
      angle: carry.angle,
      guard: 0.15,
    }
  if (frame <= WALK) {
    const phase = phaseOf(frame - 1)
    const sway = Math.sin(phase)
    return {
      legs: stride(phase),
      lean: 0.06,
      grip: [
        carry.grip[0] - sway * 0.25,
        carry.grip[1] + Math.abs(sway) * 0.15,
      ],
      angle: carry.angle + sway * 0.05,
      guard: -0.4 * sway,
    }
  }
  const beat = frame - 1 - WALK
  const b = BLOWS[blow]
  return {
    legs: stance((beat / FIGHT) * Math.PI * 2),
    lean: b.lean[beat],
    grip: [b.x[beat], b.y[beat]],
    angle: b.angle[beat],
    guard: b.guard[beat],
  }
}
