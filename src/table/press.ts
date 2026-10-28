import { Quaternion } from 'three'
import { SEAL_R } from './sizes'
import { cubic, near, qAxis, smooth, still } from './ease'
import type { Pick, Stage } from './stage'

// The seal pressed and the die thrown, frame by frame.

const q2 = new Quaternion()
const is = (h: Pick | null, kind: Pick['kind']) => h !== null && h.kind === kind

/** The wax's height through a press (0 to 1): crushed, swelling back, settling. */
function squash(e: number) {
  if (e < 0.22) return 1 - 0.38 * smooth(e / 0.22)
  if (e < 0.5) return 0.62 + 0.46 * smooth((e - 0.22) / 0.28)
  return 1.08 - 0.08 * smooth((e - 0.5) / 0.5)
}

/** The die's height through a throw (0 to 1): a leap, a little bounce, still. */
function bounce(e: number) {
  if (e < 0.55) return Math.sin((e / 0.55) * Math.PI) * 7
  if (e < 0.8) return Math.sin(((e - 0.55) / 0.25) * Math.PI) * 1.6
  return 0
}

type Feel = { hover: Pick | null }

/** The seal: lifted under the pointer; pressed, its wax squashed, its print lit, a ring rippling out. */
export function moveSeal(S: Stage, feel: Feel, now: number, dt: number) {
  const sl = S.seal
  sl.hoverE += ((is(feel.hover, 'seal') ? 1 : 0) - sl.hoverE) * near(12, dt)
  let sy = 1
  let sxz = 1 + 0.03 * sl.hoverE
  let ring = 0
  let glow = 0.25 * sl.hoverE
  const e = sl.pressT > 0 ? (now - sl.pressT) / 900 : 1
  if (e >= 1) sl.pressT = -1
  else if (still()) glow = 1
  else {
    sy = squash(e)
    sxz *= 1 + (1 - sy) * 0.35
    ring = e
    glow = e < 0.25 ? (e / 0.25) * 1.6 : 1.6 * (1 - (e - 0.25) / 0.75) + 0.25
  }
  sl.press.scale.set(sxz, sy, sxz)
  sl.press.position.y = 0.5 * sl.hoverE
  sl.wax.emissiveIntensity = glow
  sl.ring.material.opacity = ring > 0 ? (1 - ring) * 0.9 : 0
  sl.ring.scale.setScalar(SEAL_R * (1.05 + ring * 1.6))
}

export function moveDie(S: Stage, feel: Feel, now: number, dt: number) {
  const dd = S.die
  dd.hoverE +=
    ((is(feel.hover, 'die') && !dd.roll ? 1 : 0) - dd.hoverE) * near(12, dt)
  const roll = dd.roll
  if (!roll) {
    dd.spin.position.y = 1.7 + 0.6 * dd.hoverE
    return
  }
  const e = Math.min(1, (now - roll.t0) / 1100)
  const ee = cubic(e)
  q2.slerpQuaternions(roll.q0, roll.q1, ee)
  dd.spin.quaternion
    .copy(qAxis(roll.axis.x, roll.axis.y, roll.axis.z, Math.PI * 4 * (1 - ee)))
    .multiply(q2)
  const hop = bounce(e)
  dd.spin.position.set(
    Math.sin(e * Math.PI) * -3,
    1.7 + hop,
    Math.sin(e * Math.PI) * -2,
  )
  if (e >= 1) {
    dd.roll = null
    dd.spin.position.set(0, 1.7, 0)
    roll.done()
  }
}
