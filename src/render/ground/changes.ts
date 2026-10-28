import { FIELDS_REACH, fieldsOf } from './fields'
import { weigh } from './weights'
import type { Field } from './fields'
import type { Ground } from './paint'
import type { Terrain } from './terrain'
import type { Weights } from './weights'
import type { Grid } from '../../../engine'

// What the ground's decoration is painted from, kept up to date with the
// game: the lands as last traced, the works and free villages, the roads;
// and, chunk by chunk, a version that moves when any of it changed there,
// so that only those chunks are painted again.

/** The lands, the works and the roads, as the map draws them now. */
export type Layout = {
  keys: Int32Array
  /** The tiles of the works and of the free villages: a clearing round each. */
  sites: Array<number>
  /** The lords' villages, whose fields lie round them. */
  villages: Array<{ tile: number; owner: number }>
  roads: Uint8Array
}

/** Tiles round a change whose chunks are painted again: what leans in from the next tiles, and a village's fields. */
const MARGIN = 4

export function makeChanges(grid: Grid, terrain: Terrain, side: number) {
  const n = grid.land.length
  const [cols, rows] = [
    Math.ceil(grid.width / side),
    Math.ceil(grid.height / side),
  ]
  const versions = new Int32Array(cols * rows)
  const landed = new Uint8Array(cols * rows)
  for (let t = 0; t < n; t++)
    if (grid.land[t])
      landed[
        Math.floor(Math.floor(t / grid.width) / side) * cols +
          Math.floor((t % grid.width) / side)
      ] = 1
  let keys = new Int32Array(n)
  let weights: Weights = {
    deco: new Float32Array(n),
    border: new Uint8Array(n),
  }
  let villages: Layout['villages'] = []
  let roads: Uint8Array = new Uint8Array(n)
  let fields = new Map<number, Array<Field>>()

  /** The chunks within so many tiles of a tile, painted again. */
  function touch(t: number, margin: number) {
    const [c, r] = [t % grid.width, Math.floor(t / grid.width)]
    const [c0, c1] = [
      Math.max(0, Math.floor((c - margin) / side)),
      Math.min(cols - 1, Math.floor((c + margin) / side)),
    ]
    const [r0, r1] = [
      Math.max(0, Math.floor((r - margin) / side)),
      Math.min(rows - 1, Math.floor((r + margin) / side)),
    ]
    for (let y = r0; y <= r1; y++)
      for (let x = c0; x <= c1; x++) versions[y * cols + x]++
  }

  const ground = (): Ground => ({
    grid,
    terrain,
    weights,
    fieldsNear(x0, y0, x1, y1) {
      const reach = FIELDS_REACH * grid.size
      return villages.flatMap(({ tile, owner }) => {
        const [x, y] = [
          ((tile % grid.width) + 0.5) * grid.size,
          (Math.floor(tile / grid.width) + 0.5) * grid.size,
        ]
        if (
          x < x0 - reach ||
          x > x1 + reach ||
          y < y0 - reach ||
          y > y1 + reach
        )
          return []
        let list = fields.get(tile)
        if (!list) {
          list = fieldsOf(tile, owner, { grid, keys, terrain, weights, roads })
          fields.set(tile, list)
        }
        return list
      })
    },
  })

  return {
    ground,
    version: (chunk: number) => versions[chunk],
    /** Whether a chunk has anything to paint: land, or up close the open sea's ripples. */
    worth: (chunk: number, near: boolean) => near || landed[chunk] === 1,
    relayout(next: Layout) {
      const fresh = weigh(grid, next.keys, terrain, next.sites, next.roads)
      for (let t = 0; t < n; t++) {
        const moved =
          next.keys[t] !== keys[t] ||
          Math.abs(fresh.deco[t] - weights.deco[t]) > 0.01
        if (moved || next.roads[t] !== roads[t]) touch(t, MARGIN)
      }
      const before = new Map(villages.map((v) => [v.tile, v.owner]))
      const after = new Map(next.villages.map((v) => [v.tile, v.owner]))
      for (const [tile, owner] of [...before, ...after])
        if (before.get(tile) !== after.get(tile) || owner !== after.get(tile))
          touch(tile, FIELDS_REACH + MARGIN)
      keys = next.keys.slice()
      weights = fresh
      villages = next.villages
      roads = next.roads
      fields = new Map()
    },
  }
}
