import { drawInt, isqrt } from '../numbers'
import { erode } from './erosion'
import { stepsFromWater } from './ground'
import { digLakes } from './lakes'
import { DIRECTIONS, makeNoise } from './noise'
import { stream } from './points'
import { recipeOf } from './recipes'
import { levelOf, oneLand, shoreOf } from './seas'
import { pickShape } from './shapes'
import type { Cells } from './cells'
import type { Ground, Plan } from './types'
import type { Bench } from './bench'

// The second generator: a land raised as a land is. The family's recipe
// lays its masses, its ranges, its gulfs and peninsulas (recipes.ts), a
// noise roughens them, the sea comes up to its share, the water digs its
// valleys down to it (erosion.ts). Its coasts are the outline of a relief,
// smooth where the land falls gently, ragged where a range meets the sea,
// and there is one land, no islet left.

/** Map units across one turn of the noise that roughens the relief. */
const ROUGH = 230
/** How deep the water digs its valleys, in heights of the highest ground. */
const DIG = 0.14

/** The family, as the first generator draws it, and the sea this one gives it. */
export function planRelief(seed: string): Plan {
  const { kind } = pickShape(seed)
  const [low, high] = recipeOf(kind).sea
  const seaShare = low + drawInt(seed, high - low + 1, 'relief sea')
  return { kind, seaShare }
}

/** The ground of a land raised from a seed, on these cells. */
export function sculptLand(
  seed: string,
  plan: Plan,
  cells: Cells,
  width: number,
  height: number,
  scale: number,
  lakes: number,
): Ground {
  const n = cells.sites.length
  const heights = new Float64Array(n)
  const draw = stream(seed, 'relief')
  const clay = { cells, heights, ridges: new Float64Array(n), draw }
  const cell = isqrt(Math.floor((width * height) / n))
  const bench: Bench = {
    clay,
    aspect: width / height,
    across: height / cell,
    side: isqrt(scale * 10000) / 100,
    at: (u, v) => [width / 2 + u * height, height / 2 + v * height],
    rand: (low, high) => low + (high - low) * draw(),
    heading: () => DIRECTIONS[Math.floor(draw() * DIRECTIONS.length)],
    lay: (lift) =>
      cells.sites.forEach(([x, y], c) => {
        heights[c] += lift((x - width / 2) / height, (y - height / 2) / height)
      }),
    shore: () => shoreOf(cells, heights, plan.seaShare, width, height),
  }
  recipeOf(plan.kind).raise(bench)
  // A noise of every size, stronger in some places than in others, so that
  // a coast runs smooth here and ragged there.
  const noise = makeNoise(`${seed}|rough`, scale >= 4 ? 5 : 4)
  const temper = makeNoise(`${seed}|temper`, 2)
  cells.sites.forEach(([x, y], c) => {
    const temperate = 0.55 + 2 * temper(x / 700, y / 700)
    const rough = Math.min(1, Math.max(0.15, temperate))
    heights[c] += 0.45 * rough * noise(x / ROUGH, y / ROUGH)
  })
  const level = levelOf(heights, plan.seaShare)
  for (let c = 0; c < n; c++) heights[c] -= level
  const sea = oneLand(
    cells,
    [...heights].map((h) => h < 0),
  )
  const top = heights.reduce((m, h) => Math.max(m, h), 1e-9)
  // The water digs the land but never below the sea: the coast stays.
  erode(cells, heights, sea, DIG * top)
  sea.forEach((wet, c) => {
    if (!wet) heights[c] = Math.max(heights[c], top * 0.002)
  })
  const highest = heights.reduce(
    (m, h, c) => (sea[c] ? m : Math.max(m, h)),
    1e-9,
  )
  const ground = [...heights].map((h, c) =>
    sea[c] ? -1 : Math.max(0, h) / highest,
  )
  const steps = stepsFromWater(cells.neighbors, sea)
  const water = digLakes(seed, cells, sea, ground, steps, lakes)
  return { water, heights: ground.map((h, c) => (water[c] ? -1 : h)) }
}
