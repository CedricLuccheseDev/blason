// The Earth's features the atlas's maps are baked from (scripts/atlas.ts,
// scripts/rivers.ts): Natural Earth (public domain), its lines and rings,
// and the rivers within a frame.

export type Coords = Array<[number, number]>
export type Feature = {
  properties: { scalerank?: number }
  geometry: { type: string; coordinates: unknown } | null
}

/** The rivers and lakes kept, by Natural Earth's rank: the greater, the lower. */
const RANK = 7
/** How far a river may stray from its drawn line once simplified, in degrees. */
const STRAY = 0.06
export const EARTH =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/'

/** The lines or rings of a feature, whatever its geometry. */
export function partsOf(f: Feature): Array<Coords> {
  const g = f.geometry
  if (!g) return []
  const c = g.coordinates as never
  if (g.type === 'LineString') return [c]
  if (g.type === 'MultiLineString' || g.type === 'Polygon') return c
  if (g.type === 'MultiPolygon') return (c as Array<Array<Coords>>).flat()
  return []
}

/** A line with its points fewer, none more than STRAY off it (Douglas and Peucker). */
function simplify(line: Coords): Coords {
  if (line.length < 3) return line
  const [a, b] = [line[0], line[line.length - 1]]
  let [far, at] = [0, 0]
  for (let i = 1; i < line.length - 1; i++) {
    const [x, y] = line[i]
    const d =
      Math.abs((b[0] - a[0]) * (a[1] - y) - (a[0] - x) * (b[1] - a[1])) /
      (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1)
    if (d > far) [far, at] = [d, i]
  }
  if (far <= STRAY) return [a, b]
  return [
    ...simplify(line.slice(0, at + 1)).slice(0, -1),
    ...simplify(line.slice(at)),
  ]
}

/** A layer's features of Natural Earth at 1:10m, of a rank so great at least. */
export const features = async (
  layer: string,
  rank = RANK,
): Promise<Array<Feature>> =>
  (
    (await (await fetch(`${EARTH}ne_10m_${layer}.geojson`)).json()) as {
      features: Array<Feature>
    }
  ).features.filter((f) => (f.properties.scalerank ?? 99) <= rank)

/**
 * The rivers within a frame (west, east, south, north), cut where they leave
 * it, simplified, in tenths of a degree: the world's main ones of so great a
 * rank, and for a small map of Europe, its own of so great a rank too
 * (`rivers_europe`, finer: « il faut faire les fleuves dans les cartes
 * France, britannique, Europe »).
 */
export async function riversWithin(
  [w, e, s, n]: [number, number, number, number],
  rank = RANK,
  europe = 0,
): Promise<Array<Array<number>>> {
  const inside = ([x, y]: [number, number]) =>
    x >= w && x <= e && y >= s && y <= n
  const layers = [await features('rivers_lake_centerlines', rank)]
  if (europe > 0) layers.push(await features('rivers_europe', europe))
  return layers
    .flat()
    .flatMap(partsOf)
    .flatMap((line) => {
      const runs: Array<Coords> = [[]]
      for (const p of line)
        if (inside(p)) runs[runs.length - 1].push([p[0], p[1]])
        else if (runs[runs.length - 1].length) runs.push([])
      return runs.filter((r) => r.length > 1).map(simplify)
    })
    .map((line) =>
      line.flatMap(([x, y]) => [Math.round(x * 10), Math.round(y * 10)]),
    )
}
