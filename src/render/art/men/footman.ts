import { shade } from '../ink'
import { arm, coat, face, frameOf, legs } from './body'
import { kite, otherHand, round, weapon } from './gear'
import { headwear } from './heads'
import { footPose } from './pose'
import type { Garb } from './body'
import type { Weapon } from './gear'
import type { Headwear } from './heads'
import type { Pt, Sketch } from './kit'
import type { Blow, Carry, Pose } from './pose'

// A man on foot, all of him: what he wears, what he carries, how he walks
// and how he fights, drawn at one of his frames. His weapon arm is his far
// one: a spear held in one hand passes behind him, his shield before him on
// his near arm; a weapon held in both hands crosses before his body.

export type FootKit = {
  garb: Garb
  head: Headwear
  /** None for the standard-bearer, whose hands hold the pole. */
  weapon: Weapon | null
  blow: Blow
  carry: Carry
  shield?: 'kite' | 'round'
}

/** Where the standard-bearer's hands hold the pole, from his shoulder. */
export const POLE_HANDS: readonly [Pt, Pt] = [
  [2.2, 1.6],
  [2.1, 3.2],
]

const plus = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]]

/** The near arm: on the other hand of a weapon held in both, or bearing the shield, or swinging free. */
function nearArm(sk: Sketch, kit: FootKit, pose: Pose, near: Pt, hand: Pt) {
  const sleeve = kit.garb.sleeves
  const both =
    kit.weapon && !kit.shield ? otherHand(kit.weapon, hand, pose.angle) : null
  if (both) return arm(sk, near, both, sleeve)
  const lift = kit.shield ? pose.guard : pose.guard * 0.6
  const free: Pt = [
    near[0] + Math.sin(lift) * 2.6,
    near[1] + Math.cos(lift) * 2.6,
  ]
  arm(sk, near, free, sleeve)
  if (kit.shield === 'kite') kite(sk, free, -lift * 0.35)
  if (kit.shield === 'round') round(sk, free)
}

/** The standard-bearer: both hands up on the pole before him. */
function bearer(sk: Sketch, kit: FootKit, near: Pt, far: Pt) {
  arm(sk, far, plus(far, POLE_HANDS[1]), shade(kit.garb.sleeves, 0.25))
  arm(sk, near, plus(near, POLE_HANDS[0]), kit.garb.sleeves)
}

export function drawFootman(sk: Sketch, kit: FootKit, frame: number) {
  const pose = footPose(frame, kit.carry, kit.blow)
  const f = frameOf(pose)
  const far = plus(f.shoulder, [-0.4, 0.15])
  const near = plus(f.shoulder, [0.25, 0.2])
  const hand = plus(far, pose.grip)
  // A spear, a weapon held in one hand or one raised over the head passes behind him.
  const behind =
    kit.weapon !== null &&
    (kit.weapon === 'spear' || kit.shield !== undefined || pose.angle < -0.4)
  legs(sk, f, pose, kit.garb.hose)
  if (kit.weapon) {
    arm(sk, far, hand, shade(kit.garb.sleeves, 0.25))
    if (behind) weapon(sk, kit.weapon, hand, pose.angle)
  }
  coat(sk, f, kit.garb)
  face(sk, f)
  headwear(sk, f.head, kit.head)
  if (!kit.weapon) return bearer(sk, kit, near, far)
  if (!behind) weapon(sk, kit.weapon, hand, pose.angle)
  nearArm(sk, kit, pose, near, hand)
}
