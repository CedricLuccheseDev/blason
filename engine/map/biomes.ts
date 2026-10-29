import type { Cells } from './cells'

// The ground each cell of land is drawn with, from its height and its
// wetness (ground.ts): the highest the mountains, then the hills round
// them; of the lowland, the wettest the woods, the rest the open plain.
// Shares, not thresholds, so every land has as much of each; then each
// cell takes the ground most of its neighbours have, twice over, so the
// biomes lie in broad regions with no salt and pepper. Drawn only: the
// simulation knows nothing of them.

export type Biome = 'plain' | 'forest' | 'hills' | 'mountains'

/** Of the land's cells, the highest so many in a thousand are mountains, the next hills; of the lowland, the wettest so many in a thousand woods. */
export type Shares = { mountains: number; hills: number; forest: number }

const SHARE: Shares = { mountains: 60, hills: 150, forest: 400 }

/** Passes of the neighbours' vote. */
const PASSES = 2

/** The cells in order of a value, the greatest first, ties by index. */
const ranked = (cells: Array<number>, value: Array<number>) =>
  [...cells].sort((a, b) => value[b] - value[a] || a - b)

export function placeBiomes(
  cells: Cells,
  water: Array<boolean>,
  height: Array<number>,
  wet: Array<number>,
  share: Shares = SHARE,
): Array<Biome> {
  const land = cells.sites.flatMap((_, c) => (water[c] ? [] : [c]))
  let biome: Array<Biome> = cells.sites.map(() => 'plain')
  const high = ranked(land, height)
  const peaks = Math.floor((land.length * share.mountains) / 1000)
  const hills = Math.floor((land.length * share.hills) / 1000)
  high.forEach((c, n) => {
    if (n < peaks) biome[c] = 'mountains'
    else if (n < peaks + hills) biome[c] = 'hills'
  })
  const low = ranked(high.slice(peaks + hills), wet)
  const woods = Math.floor((low.length * share.forest) / 1000)
  low.slice(0, woods).forEach((c) => (biome[c] = 'forest'))
  for (let pass = 0; pass < PASSES; pass++) biome = vote(cells, water, biome)
  return biome
}

/** Each cell takes the ground more than half its neighbours on land have. */
function vote(
  cells: Cells,
  water: Array<boolean>,
  biome: Array<Biome>,
): Array<Biome> {
  return biome.map((own, c) => {
    if (water[c]) return own
    const around = cells.neighbors[c].filter((n) => !water[n])
    const counts = new Map<Biome, number>()
    for (const n of around)
      counts.set(biome[n], (counts.get(biome[n]) ?? 0) + 1)
    for (const [b, k] of counts) if (k * 2 > around.length) return b
    return own
  })
}
