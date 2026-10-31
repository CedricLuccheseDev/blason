import { isqrt } from '../numbers'
import type { Cells } from './cells'
import type { Point } from './points'

// What a map of the atlas lays on its frame from the Earth's degrees
// (atlas.ts): the straits kept open between shores that must not touch, and
// the high ranges the mountains stand along, each cell judged by how near
// its site lies to their lines; and the dead land, others' than its own.

/** A map's frame on the Earth, in degrees, and its baked ground. */
export type Sheet = {
  west: number
  east: number
  north: number
  south: number
  cols: number
  rows: number
  aspect: number
  rivers: ReadonlyArray<ReadonlyArray<number>>
  data: string
  /** Its dead points, a bit each, eight to a byte, in base 64: the land of others than its own lands (scripts/atlas.ts); none on a map whose land is all its own. */
  dead?: string
}

/** A strait, a segment along its water from one end to the other, in degrees: longitude, latitude, then the other end's. */
export type Strait = readonly [number, number, number, number]

/** A point of the Earth, in degrees, on a frame so wide and high in map units. */
export function framed(sheet: Sheet, width: number, height: number) {
  return (lon: number, lat: number): Point => [
    ((lon - sheet.west) / (sheet.east - sheet.west)) * width,
    ((sheet.north - lat) / (sheet.north - sheet.south)) * height,
  ]
}

/** How near a range's crest a cell's site lies to stand on it, in cells' spacings; how high its ground must be. */
const CREST = 1.1
const HIGH = 0.08

/** How near a strait a cell's site lies to be its water, in cells' spacings. */
const STRAIT = 0.8

/** The cells' spacing on a frame so wide and high, in map units. */
export const spacingOf = (cells: Cells, width: number, height: number) =>
  isqrt(Math.floor((width * height) / cells.sites.length))

/** Each cell's rise on a range: its height on a crest of the map's ranges where it is high enough, below naught off them. */
export function rangesOf(
  at: (lon: number, lat: number) => Point,
  ranges: ReadonlyArray<ReadonlyArray<number>>,
  cells: Cells,
  spacing: number,
  ground: Array<number>,
): Array<number> {
  const reach = CREST * spacing
  const rise = ground.map(() => -1)
  for (const line of ranges)
    for (let k = 0; k + 3 < line.length; k += 2) {
      const [a, b] = [at(line[k], line[k + 1]), at(line[k + 2], line[k + 3])]
      cells.sites.forEach((site, c) => {
        if (ground[c] < HIGH || apartSq(site, a, b) > reach * reach) return
        rise[c] = 1 + ground[c]
      })
    }
  return rise
}

/** The straits' cells made water, so that the shores either side never touch. */
export function openStraits(
  at: (lon: number, lat: number) => Point,
  straits: ReadonlyArray<Strait>,
  cells: Cells,
  spacing: number,
  wet: Array<boolean>,
) {
  const reach = STRAIT * spacing
  for (const [lon1, lat1, lon2, lat2] of straits) {
    const [a, b] = [at(lon1, lat1), at(lon2, lat2)]
    cells.sites.forEach((site, c) => {
      if (apartSq(site, a, b) <= reach * reach) wet[c] = true
    })
  }
}

/** The square of how far a point lies from a segment. */
function apartSq([x, y]: Point, a: Point, b: Point): number {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
  const long = dx * dx + dy * dy || 1
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / long))
  const [px, py] = [a[0] + t * dx - x, a[1] + t * dy - y]
  return px * px + py * py
}

/** Each cell's death: whether the point nearest its site is dead, the land of another than the map's own (« Il faut instaurer des dead space »); none on a map all its own. */
export function deadOf(
  sheet: Sheet,
  cells: Cells,
  width: number,
  height: number,
): Array<boolean> | undefined {
  const { cols, rows, dead, data } = sheet
  if (!dead) return undefined
  const bits = Uint8Array.from(atob(dead), (ch) => ch.charCodeAt(0))
  const ground = Uint8Array.from(atob(data), (ch) => ch.charCodeAt(0))
  // Of the four points round its site, the land ones vote: a cell on the
  // coast, its nearest point in the sea, dies with the land beside it.
  return cells.sites.map(([x, y]) => {
    const u = (x / width) * (cols - 1)
    const v = (y / height) * (rows - 1)
    let vote = 0
    for (const r of [Math.floor(v), Math.ceil(v)])
      for (const c of [Math.floor(u), Math.ceil(u)]) {
        const i = Math.min(rows - 1, r) * cols + Math.min(cols - 1, c)
        if (ground[i] === 0) continue
        vote += (bits[i >> 3] & (1 << (i & 7))) !== 0 ? 1 : -1
      }
    return vote > 0
  })
}

/** The fewest cells a piece of dead land keeps against the land in play: under them, it is a crumb its outline missed, and lives. */
const CRUMB = 8

/**
 * The crumbs of dead land on the coast of the land in play, a cape or a
 * bay the countries' outline drew as sea, given back to it (« y'a des zones
 * dead sur france »): a piece of dead cells touching land in play, under so
 * many cells. A neighbour's land is far wider; an island of another's apart
 * touches none, and stays dead.
 */
export function reviveCrumbs(
  cells: Cells,
  dead: Array<boolean>,
  sea: Array<boolean>,
) {
  const seen = new Uint8Array(dead.length)
  dead.forEach((d, start) => {
    if (!d || seen[start] || sea[start]) return
    const { piece, touches } = crumbOf(cells, dead, sea, seen, start)
    if (touches && piece.length < CRUMB) for (const c of piece) dead[c] = false
  })
}

/** The piece of dead cells from one, searched no further than a crumb, and whether it touches land in play. */
function crumbOf(
  cells: Cells,
  dead: Array<boolean>,
  sea: Array<boolean>,
  seen: Uint8Array,
  start: number,
) {
  const piece = [start]
  let touches = false
  seen[start] = 1
  for (let k = 0; k < piece.length && piece.length < CRUMB; k++)
    for (const n of cells.neighbors[piece[k]]) {
      if (sea[n]) continue
      if (!dead[n]) touches = true
      else if (!seen[n]) {
        seen[n] = 1
        piece.push(n)
      }
    }
  return { piece, touches }
}
