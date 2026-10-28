// The projective map of a w by h rectangle onto four points on screen
// (top left, top right, bottom right, bottom left), as a CSS matrix3d: the
// words laid on a thing follow its perspective and stay text.

export type Point = [number, number]

export function quadMatrix(
  w: number,
  h: number,
  [[x0, y0], [x1, y1], [x2, y2], [x3, y3]]: [Point, Point, Point, Point],
): string {
  const dx1 = x1 - x2
  const dx2 = x3 - x2
  const dy1 = y1 - y2
  const dy2 = y3 - y2
  const sx = x0 - x1 + x2 - x3
  const sy = y0 - y1 + y2 - y3
  const det = dx1 * dy2 - dx2 * dy1
  const g = (sx * dy2 - dx2 * sy) / det
  const h2 = (dx1 * sy - sx * dy1) / det
  const a = x1 - x0 + g * x1
  const b = x3 - x0 + h2 * x3
  const d = y1 - y0 + g * y1
  const e = y3 - y0 + h2 * y3
  const f = (v: number) => v.toFixed(6)
  return `matrix3d(${f(a / w)},${f(d / w)},0,${f(g / w)},${f(b / h)},${f(e / h)},0,${f(h2 / h)},0,0,1,0,${f(x0)},${f(y0)},0,1)`
}
