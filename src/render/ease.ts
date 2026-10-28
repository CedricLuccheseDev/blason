// The easing of what changes on the map, so that nothing jumps: a colour
// that slides into another. Figures do not run: they step once a second.

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
