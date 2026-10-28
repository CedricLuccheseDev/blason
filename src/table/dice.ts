import { Quaternion, Vector3 } from 'three'
import { chance } from './chance'
import type { Stage } from './stage'

// The die thrown for a mode: two of its faces draw each mode (one or two,
// three or four, five or six); it lands on one of them, turned a little,
// after a tumble round an axis drawn by chance.

/** The faces by value, as the box lays them (+x, -x, +y, -y, +z, -z). */
const NORMALS: Record<number, [number, number, number]> = {
  3: [1, 0, 0],
  4: [-1, 0, 0],
  5: [0, 1, 0],
  2: [0, -1, 0],
  1: [0, 0, 1],
  6: [0, 0, -1],
}
const FACES = [
  [1, 2],
  [3, 4],
  [5, 6],
]
const UP = new Vector3(0, 1, 0)

/** Throws the die to land on mode `mode`; done when it lies still (at once under reduced motion). */
export function throwDie(
  S: Stage,
  mode: number,
  still: boolean,
): Promise<void> {
  const faces = FACES[mode] ?? FACES[0]
  const face = faces[Math.floor(chance() * faces.length)]
  const q1 = new Quaternion().setFromUnitVectors(
    new Vector3(...NORMALS[face]),
    UP,
  )
  q1.premultiply(new Quaternion().setFromAxisAngle(UP, (chance() - 0.5) * 1.2))
  if (still) {
    S.die.spin.quaternion.copy(q1)
    return Promise.resolve()
  }
  const axis = new Vector3(chance() - 0.5, 0.3, chance() - 0.5).normalize()
  return new Promise((done) => {
    S.die.roll = {
      t0: performance.now(),
      q0: S.die.spin.quaternion.clone(),
      q1,
      axis,
      done,
    }
  })
}
