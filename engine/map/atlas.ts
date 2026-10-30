import { isqrt } from '../numbers'
import { MAP_SIZES } from '../rules'
import { raisePeaks } from './peaks'
import {
  deadOf,
  framed,
  openStraits,
  rangesOf,
  reviveCrumbs,
  spacingOf,
} from './landmarks'
import { keepLands } from './seas'
import { ATLAS } from './earth'
import type { Atlas } from './earth'
import type { Cells } from './cells'
import type { Point } from './points'
import type { Ground, Plan } from './types'

// The atlas: lands of the real Earth (« faire des maps de la vrai terre »),
// their ground baked from the world's heights (atlas/, scripts/atlas.ts).
// Each has its own size, no small, standard or large of it (« chaque carte
// a sa propre taille »), and the lords it suits, so that the book can rank
// them by size and say which suits a game. The generator lays its cells on
// it as on an invented land and reads each cell's height there instead of
// raising one: the sea and the great lakes where the Earth has them, its
// islands apart, the high mountains on the real ranges, its main rivers
// along their courses. A map more is an entry in earth.ts and its baked
// file.

export type { Atlas } from './earth'
export { ATLAS } from './earth'

/** The maps of the atlas, the smallest first. */
export const ATLAS_MAPS: ReadonlyArray<Atlas> = (
  Object.keys(ATLAS) as Array<Atlas>
).sort((a, b) => MAP_SIZES[ATLAS[a].size] - MAP_SIZES[ATLAS[b].size])

/** The islets under so many cells go under; the islands above stay islands, joined to nothing until the ships come. */
const ISLET = 4

const decoded = new Map<Atlas, Uint8Array>()

/** A map's bytes, read once: 0 the sea, else 1 to 254 up to its highest. */
function bytesOf(atlas: Atlas): Uint8Array {
  const known = decoded.get(atlas)
  if (known) return known
  const text = atob(ATLAS[atlas].sheet.data)
  const bytes = Uint8Array.from(text, (ch) => ch.charCodeAt(0))
  decoded.set(atlas, bytes)
  return bytes
}

/** Of its frame, how many in a thousand are sea. */
function seaShareOf(atlas: Atlas): number {
  const bytes = bytesOf(atlas)
  const sea = bytes.reduce((n, b) => n + (b === 0 ? 1 : 0), 0)
  return Math.floor((sea * 1000) / bytes.length)
}

/** Its frame's width for an area, in the Earth's proportions. */
export const widthOf = (atlas: Atlas, area: number) =>
  isqrt(Math.floor((area * ATLAS[atlas].sheet.aspect) / 100))

/** The plan of a map of the atlas: its sea as the Earth has it, its share of high mountains. */
export function planOf(atlas: Atlas): Plan {
  return {
    kind: 'continent',
    seaShare: seaShareOf(atlas),
    // Its high mountains are its ranges' (rangesOf), not a share.
    peakShare: 0,
  }
}

/** The ground of a map of the atlas on these cells: each cell's height read where it stands on the Earth. */
export function atlasLand(atlas: Atlas) {
  return (
    _seed: string,
    _plan: Plan,
    cells: Cells,
    width: number,
    height: number,
    scale: number,
  ): Ground => {
    const { cols, rows } = ATLAS[atlas].sheet
    const bytes = bytesOf(atlas)
    const at = (c: number, r: number) =>
      bytes[Math.min(rows - 1, r) * cols + Math.min(cols - 1, c)]
    const n = cells.sites.length
    const raw = new Float64Array(n)
    const wet = cells.sites.map(([x, y], i) => {
      // The four points round the cell's site, weighed by their nearness.
      const u = (x / width) * (cols - 1)
      const v = (y / height) * (rows - 1)
      const [c, r] = [Math.floor(u), Math.floor(v)]
      const [fu, fv] = [u - c, v - r]
      const b =
        at(c, r) * (1 - fu) * (1 - fv) +
        at(c + 1, r) * fu * (1 - fv) +
        at(c, r + 1) * (1 - fu) * fv +
        at(c + 1, r + 1) * fu * fv
      const level = Math.max(0, (b - 1) / 253)
      raw[i] = level * level
      return b < 0.5
    })
    const { sheet, straits, ranges } = ATLAS[atlas]
    const frame = framed(sheet, width, height)
    const spacing = spacingOf(cells, width, height)
    openStraits(frame, straits, cells, spacing, wet)
    const dead = deadOf(ATLAS[atlas].sheet, cells, width, height)
    // The Earth's lands as they are, its islands apart: Great Britain,
    // Ireland, Sicily, Corsica, the Danish isles.
    const sea = keepLands(cells, wet, ISLET)
    if (dead) reviveCrumbs(cells, dead, sea)
    const highest = raw.reduce((m, h, c) => (sea[c] ? m : Math.max(m, h)), 1e-9)
    const ground = [...raw].map((h, c) =>
      sea[c] ? -1 : Math.max(0.002, h / highest),
    )
    const side = isqrt(scale * 10000) / 100
    const crest = rangesOf(frame, ranges, cells, spacing, ground)
    const land = ground.filter((h) => h >= 0).length
    const share = Math.ceil(
      (crest.filter((r) => r > 0).length * 1000) / Math.max(1, land),
    )
    const { peaks, passes } = raisePeaks(
      cells,
      ground,
      crest,
      sea,
      share,
      side,
      false,
    )
    return { water: sea, peaks, heights: ground, passes, dead }
  }
}

/** A map's main rivers on its frame, in map units, and the cells along their banks (the woods lie by them, ground.ts). */
export function riversOf(
  atlas: Atlas,
  cells: Cells,
  width: number,
  height: number,
): { courses: Array<Array<Point>>; banks: Set<number> } {
  const { sheet } = ATLAS[atlas]
  // Its rivers in tenths of a degree.
  const at = framed(sheet, width, height)
  const courses = sheet.rivers.map((r) =>
    Array.from({ length: r.length / 2 }, (_, i) =>
      at(r[2 * i] / 10, r[2 * i + 1] / 10),
    ),
  )
  const nearest = nearestSite(cells, width)
  const banks = new Set<number>()
  for (const course of courses)
    for (const [x, y] of course) banks.add(nearest(x, y))
  return { courses, banks }
}

/** The cell whose site is nearest a point, found among buckets of the frame. */
function nearestSite(cells: Cells, width: number) {
  const SIDE = 40
  const across = Math.ceil(width / SIDE) + 1
  const buckets = new Map<number, Array<number>>()
  cells.sites.forEach(([x, y], c) => {
    const key = Math.floor(y / SIDE) * across + Math.floor(x / SIDE)
    const list = buckets.get(key)
    if (list) list.push(c)
    else buckets.set(key, [c])
  })
  return (x: number, y: number) => {
    const [bx, by] = [Math.floor(x / SIDE), Math.floor(y / SIDE)]
    let [best, near] = [0, Infinity]
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        for (const c of buckets.get((by + dy) * across + bx + dx) ?? []) {
          const [sx, sy] = cells.sites[c]
          const d = (sx - x) * (sx - x) + (sy - y) * (sy - y)
          if (d < near) [best, near] = [c, d]
        }
    return best
  }
}
