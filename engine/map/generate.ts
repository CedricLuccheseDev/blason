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
import { ATLAS, atlasLand, planOf, riversOf, widthOf } from './atlas'
import type { MapSize } from '../rules'
import type { Biome, Shares } from './biomes'
import type { GameMap, Ground, Plan } from './types'
import type { Cells } from './cells'
import type { Point } from './points'
import type { ShapeKind } from './shapes'
import type { Atlas } from './atlas'

/** What the rendering draws of a cell of land; the simulation reads the GameMap. */
type WorldCell = {
  biome: Biome
  outline: Array<Point>
}

/**
 * The generators of lands: the first, the game's, warps a family's figure
 * (classic.ts); the second raises a relief, its high mountains closed to
 * the armies (relief.ts).
 */
export type Generator = 'classic' | 'relief'

/** A land invented from a seed: the same on every machine. */
export type World = {
  seed: string
  generator: Generator
  /** A map of the real Earth (atlas.ts); none for an invented land. */
  atlas?: Atlas
  shape: ShapeKind
  size: MapSize
  /** The frame of the map, which grows with the sea so a cell keeps its size. */
  width: number
  height: number
  map: GameMap
  land: Array<WorldCell>
  /** The high mountains, a cell each, as map.peaks: dry, but no one's. */
  peaks: Array<{ outline: Array<Point> }>
  /** The middle of each pass over them. */
  passes: Array<Point>
  /** The dead land, a cell each, as map.dead: drawn, but no one's (atlas.ts). */
  dead: Array<{ outline: Array<Point> }>
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

/** What sets a generator apart: its plan, its ground, the grounds it draws. */
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
      /** Of the land's cells, how many in a thousand are drawn as mountains, hills, woods. */
      biomes?: Shares
    }
  >
> = {
  classic: { plan: planClassic, ground: classicLand },
  // Its mountains are the high ones, apart: the land below them has hills.
  relief: {
    plan: planRelief,
    ground: sculptLand,
    biomes: { mountains: 0, hills: 160, forest: 400 },
  },
}

/**
 * A land of the size asked for (rules.ts, MAP_SIZES), its cells the same
 * size whatever it is: a larger map has more of them, and more lakes,
 * rivers, woods and ranges, not larger ones. The relief unless another is
 * asked for (« pourquoi pas rajouter les montagnes aussi sur les maps, qui
 * obstrue le terrain ? »).
 */
export function generateWorld(
  seed: string,
  {
    size: asked = 'standard',
    generator = 'relief',
    atlas,
  }: { size?: MapSize; generator?: Generator; atlas?: Atlas } = {},
): World {
  // A map of the real Earth has its own size, and reads its ground there.
  const size = atlas ? ATLAS[atlas].size : asked
  const scale = MAP_SIZES[size]
  const maker = atlas
    ? {
        plan: () => planOf(atlas),
        ground: atlasLand(atlas),
        biomes: GENERATORS.relief.biomes,
      }
    : GENERATORS[generator]
  // Each size its own family of shape from one seed, so that the book's
  // small, middling and great lands differ (« Pourquoi les lands a gauche
  // c'est que des terres centrals ? »); the middling one's as it always was.
  const plan = maker.plan(size === 'standard' ? seed : `${seed}:${size}`)
  // The land open to the armies keeps its count: the high mountains come on top.
  const count = Math.floor((CELLS * scale * 1000) / (1000 - plan.peakShare))
  const area = Math.floor((count * 1000) / (1000 - plan.seaShare)) * CELL_AREA
  // A screen's proportions, 17 by 10; the Earth's own for a map of it.
  const width = atlas
    ? widthOf(atlas, area)
    : isqrt(Math.floor((area * 17) / 10))
  const height = Math.floor(area / width)
  const spacing = (isqrt(CELL_AREA) * 86) / 100
  const sites = relax(
    relax(scatter(seed, width, height, spacing), width, height),
    width,
    height,
  )
  const cells = buildCells(sites, width, height)
  const lakes = Math.floor(count / LAKE_EVERY)
  const ground = maker.ground(seed, plan, cells, width, height, scale, lakes)
  const { water, peaks, heights, passes } = ground
  // The dead land is what is neither water nor high mountain there.
  const dead = cells.sites.map(
    (_, c) => (ground.dead?.[c] ?? false) && !water[c] && !peaks[c],
  )
  // Ten times as many cells are a tenth of the size: their borders wiggle less.
  const borders = makeBorders(seed, cells, water, count > FINE ? 2 : 0)
  // A map of the Earth has its own rivers; an invented land, its own.
  const rivers = atlas
    ? riversOf(atlas, cells, width, height)
    : makeRivers(
        seed,
        cells,
        water,
        heights,
        borders,
        Math.floor(count / RIVER_EVERY),
      )
  const wet = wetness(seed, cells, water, heights, rivers.banks)
  const closed = water.map((w, c) => w || peaks[c] || dead[c])
  const biomes = placeBiomes(cells, closed, heights, wet, maker.biomes)
  const map = gameMap(cells, water, peaks, dead)
  const outline = (c: number) => borders.outline(c)
  const onLand = cells.sites.flatMap((_, c) => (closed[c] ? [] : [c]))
  const land = onLand.map((c): WorldCell => ({
    biome: biomes[c],
    outline: outline(c),
  }))
  const dry = cells.sites.flatMap((_, c) => (water[c] ? [] : [c]))
  const coast = dry.flatMap((c) =>
    cells.polygons[c].flatMap((a, k) => {
      const j = cells.across[c][k]
      const b = cells.polygons[c][(k + 1) % cells.polygons[c].length]
      return j >= 0 && water[j] ? [borders.between(c, j, a, b)] : []
    }),
  )
  return {
    seed,
    generator,
    ...(atlas ? { atlas } : {}),
    shape: plan.kind,
    size,
    width,
    height,
    map,
    land,
    peaks: cells.sites.flatMap((_, c) =>
      peaks[c] ? [{ outline: outline(c) }] : [],
    ),
    passes,
    dead: cells.sites.flatMap((_, c) =>
      dead[c] ? [{ outline: outline(c) }] : [],
    ),
    coast,
    rivers: rivers.courses,
  }
}

/** What the simulation needs: whole positions, neighbours, the water for ports, the high mountains apart. */
function gameMap(
  cells: Cells,
  water: Array<boolean>,
  peaks: Array<boolean>,
  dead: Array<boolean>,
): GameMap {
  const index = cells.sites.map(() => -1)
  let landCount = 0
  let seaCount = 0
  const open = (c: number) => !water[c] && !peaks[c] && !dead[c]
  cells.sites.forEach((_, c) => {
    if (water[c]) index[c] = seaCount++
    else if (open(c)) index[c] = landCount++
  })
  const pick = (c: number, wanted: (j: number) => boolean) =>
    cells.neighbors[c].filter(wanted).map((j) => index[j])
  const isWater = (j: number) => water[j]
  const at = (c: number) => ({
    x: Math.round(cells.sites[c][0]),
    y: Math.round(cells.sites[c][1]),
  })
  return {
    land: cells.sites.flatMap((_, c) =>
      open(c)
        ? [{ ...at(c), neighbors: pick(c, open), shore: pick(c, isWater) }]
        : [],
    ),
    sea: cells.sites.flatMap((_, c) =>
      water[c]
        ? [{ ...at(c), neighbors: pick(c, isWater), coast: pick(c, open) }]
        : [],
    ),
    peaks: cells.sites.flatMap((_, c) => (peaks[c] ? [at(c)] : [])),
    dead: cells.sites.flatMap((_, c) => (dead[c] ? [at(c)] : [])),
  }
}
