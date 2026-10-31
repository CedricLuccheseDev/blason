import type { Point } from './points'

// The rivers as water (« Les fleuves doivent être des vrais points d'eaux
// pour ajouter des ports traverser tout ça », 31/10, crossed by boat from
// any bank, no ford): every tile of land under a river's course, as wide
// as the river is there, a tile at its spring and three at its mouth, is
// water the boats sail, the ships trade on and the ports stand by. Its
// course runs from its spring to its mouth (rivers.ts, the atlas). The
// drawing gives the river the same width (render/ground/rivers.ts).

/** A river's half width at its spring and at its mouth, in tiles: a tile wide, then three; at least so much that a diagonal stays one water. */
const SPRING = 0.75
const MOUTH = 1.5

/** A river's half width so far down its course, `i` of its `n` points, in tiles. */
export const halfWidthAt = (i: number, n: number) =>
  SPRING + ((MOUTH - SPRING) * i) / Math.max(1, n - 1)

/** The square of a point's distance to a segment. */
function apart2(
  px: number,
  py: number,
  [ax, ay]: Point,
  [bx, by]: Point,
): number {
  const [dx, dy] = [bx - ax, by - ay]
  const length = dx * dx + dy * dy
  const t =
    length === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length))
  const [ex, ey] = [ax + t * dx - px, ay + t * dy - py]
  return ex * ex + ey * ey
}

/** The tiles of a grid `cols` by `rows`, tiles `size` units a side, that the rivers' courses cover. */
export function riverTiles(
  rivers: ReadonlyArray<ReadonlyArray<Point>>,
  cols: number,
  rows: number,
  size: number,
): Set<number> {
  const wet = new Set<number>()
  for (const river of rivers) {
    const n = river.length
    for (let i = 0; i < n - 1; i++) {
      // The segment in tiles, as wide as the river at its middle.
      const a: Point = [river[i][0] / size, river[i][1] / size]
      const b: Point = [river[i + 1][0] / size, river[i + 1][1] / size]
      const r = halfWidthAt(i + 0.5, n)
      const [left, right] = [Math.min(a[0], b[0]) - r, Math.max(a[0], b[0]) + r]
      const [top, bottom] = [Math.min(a[1], b[1]) - r, Math.max(a[1], b[1]) + r]
      for (
        let y = Math.max(0, Math.floor(top));
        y <= Math.min(rows - 1, Math.floor(bottom));
        y++
      )
        for (
          let x = Math.max(0, Math.floor(left));
          x <= Math.min(cols - 1, Math.floor(right));
          x++
        )
          if (apart2(x + 0.5, y + 0.5, a, b) <= r * r) wet.add(y * cols + x)
    }
  }
  return wet
}
