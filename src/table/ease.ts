import { Quaternion, Vector3 } from 'three'

// The table's easings: how far a thing has come, and how fast it goes on.
// Under reduced motion, everything is where it goes at once.

export const DEG = Math.PI / 180
export const still = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const smooth = (e: number) => e * e * (3 - 2 * e)
export const cubic = (e: number) => 1 - (1 - e) ** 3
export const clamp = (e: number) => Math.min(1, Math.max(0, e))
/** The share of the way covered this frame, at this rate. */
export const near = (k: number, dt: number) =>
  still() ? 1 : 1 - Math.exp(-dt * k)
export const qAxis = (x: number, y: number, z: number, a: number) =>
  new Quaternion().setFromAxisAngle(new Vector3(x, y, z), a)
