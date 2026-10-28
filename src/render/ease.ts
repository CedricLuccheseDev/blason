// The easing of what changes on the map, so that nothing jumps: a colour
// that slides into another, writing that fades as the land grows small.
// Figures do not run: they step once a second.

/**
 * How much of the small writing on the map shows, from 1 to 0, as the land
 * shrinks under the whole land's size (`far`, 1 at the whole land and
 * closer): all of it down to 85%, none under 70%, where it would no longer
 * read.
 */
export function legible(far: number): number {
  return Math.max(0, Math.min(1, (far - 0.7) / 0.15))
}

/** A colour on its way from one to another, `t` from 0 to 1. */
export function mixColor(from: number, to: number, t: number): number {
  const k = Math.max(0, Math.min(1, t))
  const part = (shift: number) => {
    const a = (from >> shift) & 0xff
    const b = (to >> shift) & 0xff
    return Math.round(a + (b - a) * k) << shift
  }
  return part(16) | part(8) | part(0)
}
