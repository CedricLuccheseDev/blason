import { isqrt } from '../numbers'
import { makeBorders } from './borders'
import { buildCells } from './cells'
import { lakeFor } from './lakes'
import { relax, scatter } from './points'
import { makeRivers } from './rivers'
import { pickShape } from './shapes'
import { biomeAt, findSea, makeTerrain } from './terrain'
import type { GameMap } from './types'
import type { Cells } from './cells'
import type { Point } from './points'
import type { ShapeKind } from './shapes'
import type { Biome } from './terrain'

/** What the rendering draws of a cell of land; the simulation reads the GameMap. */
type WorldCell = {
  biome: Biome
  outline: Array<Point>
  lake: Array<Point> | null
}

/** A land invented from a seed: the same on every machine. */
export type World = {
  seed: string
  shape: ShapeKind
  /** The frame of the map, which grows with the sea so a cell keeps its size. */
  width: number
  height: number
  map: GameMap
  land: Array<WorldCell>
  coast: Array<Array<Point>>
  rivers: Array<Array<Point>>
}

/** About so many cells of land by default; the sea takes its share on top. */
const CELLS = 2000
/** The area of a cell at that count, in world units: fewer cells are bigger, the land the same size. */
const CELL_AREA = 430
/** Above so many cells, borders wiggle less: small cells need fewer levels of it. */
const FINE = 200

/**
 * A land of so many cells, the same size whatever their number: the finer
 * the cells, the closer the land's coast and borders follow its tiles.
 */
export function generateWorld(
  seed: string,
  { cells: count = CELLS }: { cells?: number } = {},
): World {
  const shape = pickShape(seed)
  const cellArea = Math.floor((CELL_AREA * CELLS) / count)
  const area = Math.floor((count * 1000) / (1000 - shape.seaShare)) * cellArea
  // A screen's proportions, 17 by 10.
  const width = isqrt(Math.floor((area * 17) / 10))
  const height = Math.floor(area / width)
  const spacing = (isqrt(cellArea) * 86) / 100
  const sites = relax(
    relax(scatter(seed, width, height, spacing), width, height),
    width,
    height,
  )
  const cells = buildCells(sites, width, height)
  const terrain = makeTerrain(seed, shape, cells, width, height)
  const sea = findSea(cells, terrain)
  // Ten times as many cells are a tenth of the size: their borders wiggle less.
  const borders = makeBorders(seed, cells, sea, count > FINE ? 2 : 0)
  const map = gameMap(cells, sea)
  const onLand = cells.sites.flatMap((_, c) => (sea[c] ? [] : [c]))
  const land = onLand.map((c, id): WorldCell => {
    const outline = borders.outline(c)
    const biome = biomeAt(terrain, sites[c][0], sites[c][1])
    const coastal = map.land[id].shore.length > 0
    const lake = lakeFor(seed, id, sites[c], outline, biome, coastal)
    return { biome, outline, lake }
  })
  const coast = onLand.flatMap((c) =>
    cells.polygons[c].flatMap((a, k) => {
      const j = cells.across[c][k]
      const b = cells.polygons[c][(k + 1) % cells.polygons[c].length]
      return j >= 0 && sea[j] ? [borders.between(c, j, a, b)] : []
    }),
  )
  const rivers = makeRivers(seed, cells, sea, terrain, borders)
  return { seed, shape: shape.kind, width, height, map, land, coast, rivers }
}

/** What the simulation needs: whole positions, neighbours, the sea for ports. */
function gameMap(cells: Cells, sea: Array<boolean>): GameMap {
  const index = cells.sites.map(() => -1)
  let landCount = 0
  let seaCount = 0
  cells.sites.forEach((_, c) => {
    index[c] = sea[c] ? seaCount++ : landCount++
  })
  const pick = (c: number, wantSea: boolean) =>
    cells.neighbors[c].filter((j) => sea[j] === wantSea).map((j) => index[j])
  const at = (c: number) => ({
    x: Math.round(cells.sites[c][0]),
    y: Math.round(cells.sites[c][1]),
  })
  return {
    land: cells.sites.flatMap((_, c) =>
      sea[c]
        ? []
        : [{ ...at(c), neighbors: pick(c, false), shore: pick(c, true) }],
    ),
    sea: cells.sites.flatMap((_, c) =>
      sea[c]
        ? [{ ...at(c), neighbors: pick(c, true), coast: pick(c, false) }]
        : [],
    ),
  }
}
