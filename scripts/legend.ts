import { writeFileSync } from 'node:fs'

// The lands of legend (« pour la légende je veux seigneur des anneaux, game
// of thrones »), drawn by our own hand in scripts/legends/, never traced
// from another's map: their coasts, lakes, ranges and rivers in units of a
// frame, x to the east and y to the south. Baked here into the atlas's own
// form (engine/map/atlas/), as a map of the Earth is from its heights: the
// ground rising from the coast, a little uneven, high along the ranges, so
// that the game reads it as any other map. Run once per land:
// npm run legend -- middle

type Line = ReadonlyArray<readonly [number, number]>

/** A land of legend: its frame, its land and lakes as rings, its ranges and rivers as lines, from source to sea. */
export type Legend = {
  width: number
  height: number
  /** Points across its frame: its height follows. */
  cols: number
  land: ReadonlyArray<Line>
  lakes: ReadonlyArray<Line>
  ranges: ReadonlyArray<Line>
  rivers: ReadonlyArray<Line>
}

const [name = 'middle'] = process.argv.slice(2)
const legend = ((await import(`./legends/${name}.ts`)) as { default: Legend })
  .default
const { width, height, cols } = legend
const rows = Math.round((cols * height) / width)
const step = width / (cols - 1)

/** Whether a point lies within a ring (even-odd). */
function within([x, y]: readonly [number, number], ring: Line) {
  let odd = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      odd = !odd
  }
  return odd
}

/** How far a point lies from a line, in units. */
function apart([x, y]: readonly [number, number], line: Line) {
  let near = Infinity
  for (let k = 0; k + 1 < line.length; k++) {
    const [a, b] = [line[k], line[k + 1]]
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
    const long = dx * dx + dy * dy || 1
    const t = Math.max(
      0,
      Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / long),
    )
    near = Math.min(near, Math.hypot(a[0] + t * dx - x, a[1] + t * dy - y))
  }
  return near
}

/** A value noise of the point, smooth over `scale` units, from 0 to 1. */
function noise(x: number, y: number, scale: number) {
  const hash = (i: number, j: number) => {
    const h = Math.sin(i * 127.1 + j * 311.7 + name.length * 74.7) * 43758.5453
    return h - Math.floor(h)
  }
  const [u, v] = [x / scale, y / scale]
  const [i, j] = [Math.floor(u), Math.floor(v)]
  const [fu, fv] = [u - i, v - j]
  const [su, sv] = [fu * fu * (3 - 2 * fu), fv * fv * (3 - 2 * fv)]
  const top = hash(i, j) * (1 - su) + hash(i + 1, j) * su
  const bottom = hash(i, j + 1) * (1 - su) + hash(i + 1, j + 1) * su
  return top * (1 - sv) + bottom * sv
}

const at = (c: number, r: number) => [c * step, r * step] as const
const dry = Array.from({ length: rows * cols }, (_, i) => {
  const p = at(i % cols, Math.floor(i / cols))
  return (
    legend.land.some((ring) => within(p, ring)) &&
    !legend.lakes.some((ring) => within(p, ring))
  )
})
// Each point's steps from the water, the ground rising inland.
const inland: Array<number> = dry.map((d) => (d ? -1 : 0))
const queue = inland.flatMap((d, i) => (d === 0 ? [i] : []))
for (let k = 0; k < queue.length; k++) {
  const i = queue[k]
  const [c, r] = [i % cols, Math.floor(i / cols)]
  for (const [cc, rr] of [
    [c - 1, r],
    [c + 1, r],
    [c, r - 1],
    [c, r + 1],
  ]) {
    if (cc < 0 || cc >= cols || rr < 0 || rr >= rows) continue
    const j = rr * cols + cc
    if (inland[j] !== -1) continue
    inland[j] = inland[i] + 1
    queue.push(j)
  }
}
/** How near a range a point stands to rise with it, in units. */
const RIDGE = 4 * step
const bytes = dry.map((d, i) => {
  if (!d) return 0
  const p = at(i % cols, Math.floor(i / cols))
  const rise = Math.min(1, inland[i] / 30) * 0.4
  const rough =
    noise(p[0], p[1], 9 * step) * 0.2 + noise(p[0], p[1], 3 * step) * 0.08
  const ridge = Math.max(
    0,
    ...legend.ranges.map((line) => 1 - apart(p, line) / RIDGE),
  )
  const h = Math.min(1, 0.06 + rise + rough + ridge * 0.9)
  return 1 + Math.min(253, Math.round(Math.sqrt(h) * 253))
})

// In the atlas's form: the frame as degrees, x the longitude, y down from
// the north the latitude's fall; the rivers in tenths of them.
const lat = (y: number) => height - y
const rivers = legend.rivers.map((line) =>
  line.flatMap(([x, y]) => [Math.round(x * 10), Math.round(lat(y) * 10)]),
)
const b64 = Buffer.from(bytes).toString('base64')
const lines = b64.match(/.{1,76}/g) ?? []
const Name = name.toUpperCase()
writeFileSync(
  `engine/map/atlas/${name}.ts`,
  `// ${name}'s ground: a land of legend drawn by our own hand
// (scripts/legends/${name}.ts), baked by scripts/legend.ts in the atlas's
// form: its frame as degrees, a byte a point, west to east, north to south,
// 0 the sea or a lake, else 1 + 253 times the square root of its height.
// Read by map/atlas.ts.

export const ${Name} = {
  west: 0,
  east: ${width},
  north: ${height},
  south: 0,
  cols: ${cols},
  rows: ${rows},
  /** Its frame, width over height, in hundredths. */
  aspect: ${Math.round((width * 100) / height)},
  /** Its rivers, each its points in tenths of a unit, x then the height less y, from its source down. */
  rivers: [
${rivers.map((r) => `    [${r.join(', ')}],`).join('\n')}
  ],
  data:
${lines.map((l) => `  '${l}'`).join(' +\n')},
}
`,
)
process.stdout.write(
  `${name}: ${cols} by ${rows}; its ranges for earth.ts, x then the height less y:\n${legend.ranges
    .map((line) => `  [${line.map(([x, y]) => `${x}, ${lat(y)}`).join(', ')}],`)
    .join('\n')}\n`,
)
