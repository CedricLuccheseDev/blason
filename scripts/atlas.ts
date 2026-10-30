import { writeFileSync } from 'node:fs'

// The atlas's grounds baked from the world's heights: ETOPO 2022 (NOAA,
// public domain), read through NOAA's ERDDAP server, one point every 0.2
// degrees, written as an engine module of bytes (engine/map/atlas/); its
// great lakes poured in as water and its main rivers laid on it, from
// Natural Earth (public domain), « Les fleuves rivières et lac sont de la
// vrai eau ». Run once per map, or again to change its frame, the last
// figure the minutes between two points (12 unless said; the whole world
// at 30, lest its file weigh megabytes):
// npm run atlas -- europe -12 45 35 60
// npm run atlas -- world -180 180 -56 72 30
// A map of some lands only names them last, by their codes in Natural
// Earth's countries (public domain): the land of others is drawn, and dead,
// no one's to take (« Il faut instaurer des dead space … Sinon la France y'a
// pas que la France »):
// npm run atlas -- france -5.5 9.8 41.3 51.5 6 FRA

const [
  name = 'europe',
  west = '-12',
  east = '45',
  south = '35',
  north = '60',
  minutes = '12',
  only = '',
] = process.argv.slice(2)
/** The heights' grid is one arc-minute: so many minutes a point. */
const STRIDE = Number(minutes)
/** The height the bytes reach, in metres: higher is as high. */
const TOP = 4000
/** The rivers and lakes kept, by Natural Earth's rank: the greater, the lower. */
const RANK = 7
/** The fewest points a piece of the lands named keeps to live. */
const CRUMB = 8
/** How far a river may stray from its drawn line once simplified, in degrees. */
const STRAY = 0.06
const EARTH =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/'

type Coords = Array<[number, number]>
type Feature = {
  properties: { scalerank?: number }
  geometry: { type: string; coordinates: unknown } | null
}

/** The lines or rings of a feature, whatever its geometry. */
function partsOf(f: Feature): Array<Coords> {
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

const features = async (layer: string): Promise<Array<Feature>> =>
  (
    (await (await fetch(`${EARTH}ne_10m_${layer}.geojson`)).json()) as {
      features: Array<Feature>
    }
  ).features.filter((f) => (f.properties.scalerank ?? 99) <= RANK)

const url =
  'https://coastwatch.pfeg.noaa.gov/erddap/griddap/etopo180.csv?altitude' +
  `%5B(${south}):${STRIDE}:(${north})%5D%5B(${west}):${STRIDE}:(${east})%5D`
const text = await (await fetch(url)).text()
const rows = text
  .trim()
  .split('\n')
  .slice(2)
  .map((line) => line.split(',').map(Number))
const lats = [...new Set(rows.map(([la]) => la.toFixed(1)))].sort(
  (a, b) => Number(b) - Number(a),
)
const lons = [...new Set(rows.map(([, lo]) => lo.toFixed(1)))].sort(
  (a, b) => Number(a) - Number(b),
)
const height = new Map(
  rows.map(([la, lo, h]) => [`${la.toFixed(1)}:${lo.toFixed(1)}`, h]),
)
const [w, e, s, n] = [west, east, south, north].map(Number)
const inside = ([x, y]: [number, number]) =>
  x >= w && x <= e && y >= s && y <= n
/** Whether a point lies within a ring (even-odd). */
function within([x, y]: [number, number], ring: Coords) {
  let odd = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      odd = !odd
  }
  return odd
}
const lakes = (await features('lakes'))
  .flatMap(partsOf)
  .filter((ring) => ring.some(inside))
const bytes = lats.flatMap((la) =>
  lons.map((lo) => {
    const h = height.get(`${la}:${lo}`) ?? 0
    const point: [number, number] = [Number(lo), Number(la)]
    if (h <= 0 || lakes.some((ring) => within(point, ring))) return 0
    return (
      1 + Math.min(253, Math.round(Math.sqrt(Math.min(h, TOP) / TOP) * 253))
    )
  }),
)
// The land of the lands named alive, a point beyond their outline along it
// too (their coasts drawn coarser than the heights); the rest of the land
// dead. None named, all of it alive.
const named = only.split(',').filter(Boolean)
const countries = named.length
  ? (
      (await (
        await fetch(`${EARTH}ne_10m_admin_0_countries.geojson`)
      ).json()) as {
        features: Array<Feature & { properties: { ADM0_A3: string } }>
      }
    ).features
      .filter((f) => named.includes(f.properties.ADM0_A3))
      .flatMap(partsOf)
  : []
const [cols, rows_] = [lons.length, lats.length]
const alive = lats.flatMap((la) =>
  lons.map((lo) =>
    countries.some((ring) => within([Number(lo), Number(la)], ring)),
  ),
)
const dead = named.length
  ? bytes.map((b, i) => {
      if (b === 0) return false
      const [c, r] = [i % cols, Math.floor(i / cols)]
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const [cc, rr] = [c + dc, r + dr]
          if (
            cc >= 0 &&
            cc < cols &&
            rr >= 0 &&
            rr < rows_ &&
            alive[rr * cols + cc]
          )
            return false
        }
      return true
    })
  : null
// A crumb of the lands named, a few points along their outline cut off in
// the land of others (their outline coarser than the heights), dies with it.
if (dead) {
  const seen = new Uint8Array(dead.length)
  dead.forEach((d, start) => {
    if (d || bytes[start] === 0 || seen[start]) return
    const piece = [start]
    seen[start] = 1
    for (let k = 0; k < piece.length; k++) {
      const i = piece[k]
      const [c, r] = [i % cols, Math.floor(i / cols)]
      for (const [cc, rr] of [
        [c - 1, r],
        [c + 1, r],
        [c, r - 1],
        [c, r + 1],
      ]) {
        const j = rr * cols + cc
        if (cc < 0 || cc >= cols || rr < 0 || rr >= rows_) continue
        if (seen[j] || dead[j] || bytes[j] === 0) continue
        seen[j] = 1
        piece.push(j)
      }
    }
    // An island of the lands named lives, however small: its points lie within them.
    if (piece.length < CRUMB && !piece.some((i) => alive[i]))
      for (const i of piece) dead[i] = true
  })
}
// And a crumb of dead land against the lands named, a bay their outline
// drew as sea, lives with them (« pourquoi y'a une zone morte ? en corse »):
// a neighbour's land is far wider, an island apart touches nothing of theirs.
if (dead) {
  const seen = new Uint8Array(dead.length)
  dead.forEach((d, start) => {
    if (!d || seen[start]) return
    const piece = [start]
    let touches = false
    seen[start] = 1
    for (let k = 0; k < piece.length; k++) {
      const i = piece[k]
      const [c, r] = [i % cols, Math.floor(i / cols)]
      for (const [cc, rr] of [
        [c - 1, r],
        [c + 1, r],
        [c, r - 1],
        [c, r + 1],
      ]) {
        if (cc < 0 || cc >= cols || rr < 0 || rr >= rows_) continue
        const j = rr * cols + cc
        if (bytes[j] === 0) continue
        if (!dead[j]) touches = true
        else if (!seen[j]) {
          seen[j] = 1
          piece.push(j)
        }
      }
    }
    if (touches && piece.length < 3 * CRUMB)
      for (const i of piece) dead[i] = false
  })
}
/** The dead points, a bit each, eight to a byte, in the bytes' order. */
const deadBits = dead
  ? Buffer.from(
      Array.from({ length: Math.ceil(dead.length / 8) }, (_, k) =>
        dead
          .slice(k * 8, k * 8 + 8)
          .reduce((byte, on, j) => byte | (on ? 1 << j : 0), 0),
      ),
    ).toString('base64')
  : null
// The main rivers within the frame, cut where they leave it, in tenths of a degree.
const rivers = (await features('rivers_lake_centerlines'))
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
const b64 = Buffer.from(bytes).toString('base64')
const lines = b64.match(/.{1,76}/g) ?? []
const Name = name.toUpperCase()
writeFileSync(
  `engine/map/atlas/${name}.ts`,
  `// ${name}'s ground: ETOPO 2022 (NOAA, public domain), one point every ${STRIDE / 60}
// degrees, its great lakes and main rivers from Natural Earth (public
// domain), baked by scripts/atlas.ts. A byte a point, west to east, north to
// south: 0 the sea or a lake, else 1 + 253 times the square root of the
// height over ${TOP} metres, so that the lowlands keep their shades. Read by
// map/atlas.ts.

export const ${Name} = {
  west: ${lons[0]},
  east: ${lons.at(-1)},
  north: ${lats[0]},
  south: ${lats.at(-1)},
  cols: ${lons.length},
  rows: ${lats.length},
  /** Its frame, width over height, in hundredths: the longitudes shrunk by the cosine of the middle latitude, worked out here as the engine may not. */
  aspect: ${Math.round(((e - w) * Math.cos((((n + s) / 2) * Math.PI) / 180) * 100) / (n - s))},
  /** The main rivers, each its points in tenths of a degree, longitude then latitude, from its source down. */
  rivers: [
${rivers.map((r) => `    [${r.join(', ')}],`).join('\n')}
  ],
  data:
${lines.map((l) => `  '${l}'`).join(' +\n')},${
    deadBits
      ? `
  /** The land of other lands than ${named.join(', ')}, drawn and dead: a bit a point, eight to a byte. */
  dead:
${(deadBits.match(/.{1,76}/g) ?? []).map((l) => `  '${l}'`).join(' +\n')},`
      : ''
  }
}
`,
)
process.stdout.write(`${name}: ${lons.length} by ${lats.length}\n`)
