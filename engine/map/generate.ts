import { isqrt } from '../numbers'
import { MAP_SIZES } from '../rules'
import { placeBiomes } from './biomes'
import { makeBorders } from './borders'
import { buildCells } from './cells'
import { classicLand, planClassic } from './classic'
import { wetness } from './ground'
import { relax, scatter } from './points'
import { planRelief, sculptLand } from './relief'
import { makeRivers } from './rivers'
import type { MapSize } from '../rules'
import type { Biome } from './biomes'
import type { GameMap, Ground, Plan } from './types'
import type { Cells } from './cells'
import type { Point } from './points'
import type { ShapeKind } from './shapes'

/** What the rendering draws of a cell of land; the simulation reads the GameMap. */
type WorldCell = {
  biome: Biome
  outline: Array<Point>
}

/**
 * The generators of lands: the first, the game's, warps a family's figure
 * (classic.ts); the second raises a relief (relief.ts).
 */
export type Generator = 'classic' | 'relief'

/** A land invented from a seed: the same on every machine. */
export type World = {
  seed: string
  generator: Generator
  shape: ShapeKind
  size: MapSize
  /** The frame of the map, which grows with the sea so a cell keeps its size. */
  width: number
  height: number
  map: GameMap
  land: Array<WorldCell>
  /** The shores of the sea and of the lakes. */
  coast: Array<Array<Point>>
  rivers: Array<Array<Point>>
}

/** About so many cells of land on the standard map; the sea takes its share on top. */
const CELLS = 2000
/** The area of a cell, in world units. */
const CELL_AREA = 430
/** Above so many cells, borders wiggle less: small cells need fewer levels of it. */
const FINE = 200
/** One lake, and one river, for so many cells of land. */
const LAKE_EVERY = 500
const RIVER_EVERY = 300

/** What sets a generator apart: its plan and its ground. */
const GENERATORS: Readonly<
  Record<
    Generator,
    {
      plan: (seed: string) => Plan
      ground: (
        seed: string,
        plan: Plan,
        cells: Cells,
        width: number,
        height: number,
        scale: number,
        lakes: number,
      ) => Ground
    }
  >
> = {
  classic: { plan: planClassic, ground: classicLand },
  relief: { plan: planRelief, ground: sculptLand },
}

/**
 * A land of the size asked for (rules.ts, MAP_SIZES), its cells the same
 * size whatever it is: a larger map has more of them, and more lakes,
 * rivers, woods and ranges, not larger ones. The first generator unless
 * another is asked for.
 */
export function generateWorld(
  seed: string,
  {
    size = 'standard',
    generator = 'classic',
  }: { size?: MapSize; generator?: Generator } = {},
): World {
  const scale = MAP_SIZES[size]
  const maker = GENERATORS[generator]
  const plan = maker.plan(seed)
  const count = CELLS * scale
  const area = Math.floor((count * 1000) / (1000 - plan.seaShare)) * CELL_AREA
  // A screen's proportions, 17 by 10.
  const width = isqrt(Math.floor((area * 17) / 10))
  const height = Math.floor(area / width)
  const spacing = (isqrt(CELL_AREA) * 86) / 100
  const sites = relax(
    relax(scatter(seed, width, height, spacing), width, height),
    width,
    height,
  )
  const cells = buildCells(sites, width, height)
  const lakes = Math.floor(count / LAKE_EVERY)
  const { water, heights } = maker.ground(
    seed,
    plan,
    cells,
    width,
    height,
    scale,
    lakes,
  )
  // Ten times as many cells are a tenth of the size: their borders wiggle less.
  const borders = makeBorders(seed, cells, water, count > FINE ? 2 : 0)
  const rivers = makeRivers(
    seed,
    cells,
    water,
    heights,
    borders,
    Math.floor(count / RIVER_EVERY),
  )
  const wet = wetness(seed, cells, water, heights, rivers.banks)
  const biomes = placeBiomes(cells, water, heights, wet)
  const map = gameMap(cells, water)
  const onLand = cells.sites.flatMap((_, c) => (water[c] ? [] : [c]))
  const land = onLand.map((c): WorldCell => ({
    biome: biomes[c],
    outline: borders.outline(c),
  }))
  const coast = onLand.flatMap((c) =>
    cells.polygons[c].flatMap((a, k) => {
      const j = cells.across[c][k]
      const b = cells.polygons[c][(k + 1) % cells.polygons[c].length]
      return j >= 0 && water[j] ? [borders.between(c, j, a, b)] : []
    }),
  )
  return {
    seed,
    generator,
    shape: plan.kind,
    size,
    width,
    height,
    map,
    land,
    coast,
    rivers: rivers.courses,
  }
}

/** What the simulation needs: whole positions, neighbours, the water for ports. */
function gameMap(cells: Cells, water: Array<boolean>): GameMap {
  const index = cells.sites.map(() => -1)
  let landCount = 0
  let seaCount = 0
  cells.sites.forEach((_, c) => {
    index[c] = water[c] ? seaCount++ : landCount++
  })
  const pick = (c: number, wantSea: boolean) =>
    cells.neighbors[c].filter((j) => water[j] === wantSea).map((j) => index[j])
  const at = (c: number) => ({
    x: Math.round(cells.sites[c][0]),
    y: Math.round(cells.sites[c][1]),
  })
  return {
    land: cells.sites.flatMap((_, c) =>
      water[c]
        ? []
        : [{ ...at(c), neighbors: pick(c, false), shore: pick(c, true) }],
    ),
    sea: cells.sites.flatMap((_, c) =>
      water[c]
        ? [{ ...at(c), neighbors: pick(c, true), coast: pick(c, false) }]
        : [],
    ),
  }
}
