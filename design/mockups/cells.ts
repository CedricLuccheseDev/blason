// The mockups' map for the fluid land (engine/): a land of fine tiles, four
// map units a side, taken as in OpenFront. A game played by
// twenty bots on a fixed seed (seat 0, Azur, stands for the player), drawn
// as a map on a manuscript: each lord's land a soft wash of his colour on
// the parchment, darker along its edge as a wash dries, its border inked
// along the wash; the free land plain parchment (src/render/regions.ts); the
// lords' works drawn at the land's scale, the land a castle holds tinted
// with stone; the border between two allies in green. The page, the sea and its shore lines, the frame and
// the compass rose are the game's (src/render/layers/page.ts, lands.ts). What
// moves or answers the pointer (the fights, the pills, the lords' names and
// peasants with their badges, the caravans on their roads, the HUD) is
// written to data.json in screen pixels of a 1440 x 900 board, for boards.py
// to draw over the frame. The HUD is read with the game's own summary
// (src/render/summary.ts).
// npx tsx design/mockups/cells.ts design/mockups/cells [seed]
import { mkdirSync, writeFileSync } from 'node:fs'
import {
  apart,
  around,
  botsSetup,
  canBuild,
  capOf,
  costOf,
  createBot,
  createGame,
  entryFor,
  generateWorld,
  isAllied,
  isFelon,
  makeGrid,
  menFor,
  NEUTRAL,
  nextDrop,
  priceOf,
  RULES,
  step,
  UNIT,
  victoryShare,
  worksOf,
} from '../../engine/index.ts'
import type {
  Army,
  GameState,
  Host,
  Order,
  Point,
  Work,
} from '../../engine/index.ts'
import { GLYPHS } from '../../src/render/art/glyphs.ts'
import { mixColor } from '../../src/render/ease.ts'
import { PLAYERS, TONE, playerColor } from '../../src/render/palette.ts'
import { penned } from '../../src/render/pen.ts'
import { summarize } from '../../src/render/summary.ts'

const OUT = process.argv[2] ?? 'design/mockups/cells'
const SEED = process.argv[3] ?? 'cells-3'
const ME = 0
/** Whose eyes the frames are drawn for: the player (his wash deeper, his name in gold, his allies' green border and links, his caravans' road), or none, as the home's spectator camera (-1). */
let viewer = ME
const SECOND = 10
/** The moments, in ticks: my host raised on the lord beside me (T0, while the free land still covers much of it), the middle of the game (MID, as it bites), and later on (LATE, the free land all taken). */
const T0 = Number(process.env.T0 ?? 1080)
const MID = T0 + 30
const LATE = Number(process.env.LATE ?? 2700)

const NAMES: Record<string, string> = {
  azure: 'Azur',
  gules: 'Gueules',
  vert: 'Sinople',
  purpure: 'Pourpre',
  or: 'Or',
  sable: 'Sable',
  orange: 'Orangé',
  sky: 'Céleste',
  sanguine: 'Sanguine',
  apple: 'Pomme',
  rose: 'Rose',
  brown: 'Brun',
  turquoise: 'Turquoise',
  lavender: 'Lavande',
  olive: 'Olive',
  coral: 'Corail',
  navy: 'Marine',
  peacock: 'Canard',
  plum: 'Prune',
  slate: 'Ardoise',
}
const nameOf = (o: number) => NAMES[PLAYERS[o].key]
const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`
const colorOf = (o: number) => hex(playerColor(o))
const INK = hex(TONE.ink)
const PAGE = hex(TONE.page)
const LIGHT = '#fbf4e2'
const GOLD = '#c9962a'
const f1 = (n: number) => n.toFixed(1)

// The game.
const world = generateWorld(SEED)
const grid = makeGrid(world.map, world.width, world.height, RULES.tileSize)
const TILE = grid.size
const GW = grid.width
const GH = grid.height
const CASTLE_R = RULES.castleRadius * TILE
const GAP = RULES.workGap * TILE
const live = createGame(grid, botsSetup({ seed: SEED }))
const bots = live.players.map((_, id) => createBot(id, SEED))
/** Lords kept from giving orders for a while: the staging. */
const quiet = new Set<number>()
const botOrders = (s: GameState) =>
  s.players.flatMap((p, id) =>
    p.alive && !quiet.has(id) ? bots[id](s, id) : [],
  )
function run(s: GameState, until: number, orders: Array<Order> = []) {
  let first = true
  while (s.tick < until && s.winner < 0) {
    step(s, [...(first ? orders : []), ...botOrders(s)])
    first = false
  }
}

const tileX = (t: number) => ((t % GW) + 0.5) * TILE
const tileY = (t: number) => (Math.floor(t / GW) + 0.5) * TILE
const siteOf = (t: number) => ({ x: tileX(t), y: tileY(t) })
const tileAt = (x: number, y: number) =>
  Math.max(0, Math.min(GH - 1, Math.floor(y / TILE))) * GW +
  Math.max(0, Math.min(GW - 1, Math.floor(x / TILE)))
const four = (t: number) => around(grid, t)
const dist = (a: number, b: number) => Math.sqrt(apart(grid, a, b)) * TILE
/** For a tile at sea near the shore, the land tile nearest it: the washes run a little under the sea, and the drawn coast cuts them. */
const shoreOf = new Int32Array(GW * GH).fill(-1)
{
  let ring: Array<number> = []
  for (let t = 0; t < GW * GH; t++) if (grid.land[t]) shoreOf[t] = t
  for (let t = 0; t < GW * GH; t++)
    if (grid.land[t] && four(t).some((n) => !grid.land[n])) ring.push(t)
  for (let depth = 0; depth < 4; depth++) {
    const next: Array<number> = []
    for (const t of ring)
      for (const n of four(t))
        if (shoreOf[n] < 0) {
          shoreOf[n] = shoreOf[t]
          next.push(n)
        }
    ring = next
  }
}

/** The region of each tile, as src/render/regions.ts keys it, spread a little under the sea: a lord, or the free land (-3), -2 the open sea. */
type Grid = Int32Array
const SEA_KEY = -2
const keyOf = (s: GameState, t: number) =>
  s.owner[t] !== NEUTRAL ? s.owner[t] : -3
function gridOf(s: GameState): Grid {
  const g = new Int32Array(GW * GH)
  for (let t = 0; t < GW * GH; t++)
    g[t] = shoreOf[t] >= 0 ? keyOf(s, shoreOf[t]) : SEA_KEY
  return g
}

/** The outlines of the tiles where `is` holds, as loops of grid corners. */
function cornersOf(is: (t: number) => boolean): Array<Array<Point>> {
  const at = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < GW && y < GH && is(y * GW + x)
  const edges = new Map<number, Array<number>>()
  const V = GW + 1
  const add = (ax: number, ay: number, bx: number, by: number) => {
    const k = ay * V + ax
    const list = edges.get(k)
    if (list) list.push(by * V + bx)
    else edges.set(k, [by * V + bx])
  }
  for (let y = 0; y < GH; y++)
    for (let x = 0; x < GW; x++) {
      if (!at(x, y)) continue
      if (!at(x, y - 1)) add(x, y, x + 1, y)
      if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1)
      if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1)
      if (!at(x - 1, y)) add(x, y + 1, x, y)
    }
  const loops: Array<Array<Point>> = []
  for (const start of [...edges.keys()]) {
    while ((edges.get(start)?.length ?? 0) > 0) {
      const loop: Array<Point> = []
      let from = start
      let to = edges.get(start)!.shift()!
      for (let guard = 0; guard < 400000; guard++) {
        loop.push([from % V, Math.floor(from / V)])
        if (to === start) break
        const dx = (to % V) - (from % V)
        const dy = Math.floor(to / V) - Math.floor(from / V)
        const options = edges.get(to) ?? []
        // Where two tiles touch at a corner, turn right: each keeps its own outline.
        const prefer = [
          [-dy, dx],
          [dx, dy],
          [dy, -dx],
        ]
        let pick = -1
        for (const [ex, ey] of prefer) {
          pick = options.findIndex(
            (o) =>
              (o % V) - (to % V) === ex &&
              Math.floor(o / V) - Math.floor(to / V) === ey,
          )
          if (pick >= 0) break
        }
        if (pick < 0) break
        from = to
        to = options.splice(pick, 1)[0]
      }
      loops.push(loop)
    }
  }
  return loops
}
/** A loop of corners as the wash's soft edge: the middles of its steps, rounded twice, in map units. */
function smooth(loop: Array<Point>): Array<Point> {
  let pts: Array<Point> = loop.map((p, i) => {
    const q = loop[(i + 1) % loop.length]
    return [((p[0] + q[0]) / 2) * TILE, ((p[1] + q[1]) / 2) * TILE]
  })
  for (let round = 0; round < 2; round++)
    pts = pts.flatMap((p, i) => {
      const q = pts[(i + 1) % pts.length]
      return [
        [0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]] as Point,
        [0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]] as Point,
      ]
    })
  return pts
}
const path = (loops: Array<Array<Point>>, close = true) =>
  loops
    .filter((l) => l.length > 2)
    .map(
      (l) =>
        'M' +
        l.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') +
        (close ? 'Z' : ''),
    )
    .join('')
const regionsOf = (g: Grid) => {
  const owners = new Set<number>()
  for (let t = 0; t < GW * GH; t++) if (g[t] !== SEA_KEY) owners.add(g[t])
  return [...owners].map((v) => ({
    v,
    loops: cornersOf((t) => g[t] === v).map(smooth),
  }))
}

// Frames: a view of the land in map units, shown on a 1440 x 900 board.
type Frame = {
  name: string
  x: number
  y: number
  w: number
  h: number
  /** Map units per pixel. */
  k: number
  s: GameState
}
const frame = (
  name: string,
  cx: number,
  cy: number,
  w: number,
  s: GameState,
): Frame => {
  const h = (w * 900) / 1440
  return { name, x: cx - w / 2, y: cy - h / 2, w, h, k: w / 1440, s }
}
const px = (f: Frame, x: number, y: number) => ({
  x: +f1(((x - f.x) / f.w) * 1440),
  y: +f1(((y - f.y) / f.h) * 900),
})
const tpx = (f: Frame, t: number) => px(f, tileX(t), tileY(t))
const inView = (f: Frame, x: number, y: number, pad = 60) =>
  x > f.x - pad && x < f.x + f.w + pad && y > f.y - pad && y < f.y + f.h + pad

// The drawing, as src/render/layers/lands.ts and fronts.ts, on the fluid land.
const WASH = 0.5
const MY_WASH = 0.74
const FREE_WASH = 0.42
const FREE = 0xdccb9e
const SHORES = [17, 10, 4.5]
const RIM = 3
/** How much stone tints the land a castle holds; the border shared with an ally, in the heralds' vert. */
const STONE_TINT = hex(TONE.stoneDark)
const STONE_ALPHA = 0.22
const ALLY = '#2f7d3f'
const washOf = (o: number) =>
  hex(
    o < 0
      ? mixColor(TONE.page, FREE, FREE_WASH)
      : mixColor(TONE.page, playerColor(o), o === viewer ? MY_WASH : WASH),
  )
const ring = (r: ReadonlyArray<Point>, close = true) =>
  'M' + r.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') + (close ? 'Z' : '')
const LAND = world.land.map((wf) => ring(wf.outline)).join('')
const COAST = world.coast.map((r) => ring(r, false)).join('')

function sea() {
  const parts = [
    `<rect x="-2400" y="-2400" width="${world.width + 4800}" height="${world.height + 4800}" fill="${PAGE}"/>`,
    `<rect x="0" y="0" width="${world.width}" height="${world.height}" fill="${hex(TONE.seaWash)}"/>`,
  ]
  for (const w of SHORES)
    parts.push(
      `<use href="#coast" stroke="${hex(TONE.seaLine)}" stroke-width="${2 * w + 0.9}"/><use href="#coast" stroke="${hex(TONE.seaWash)}" stroke-width="${2 * w - 0.9}"/>`,
    )
  return parts.join('')
}

/** The tiles each lord's castles hold: within their reach, of his land (src/render/trace.ts). */
function castleLand(s: GameState, g: Grid) {
  const r = s.rules.castleRadius
  const byLord = new Map<number, Set<number>>()
  for (const w of s.works) {
    if (w.work !== 'castle') continue
    const cx = w.tile % GW
    const cy = Math.floor(w.tile / GW)
    const set = byLord.get(w.owner) ?? new Set<number>()
    for (let y = Math.max(0, cy - r); y <= Math.min(GH - 1, cy + r); y++)
      for (let x = Math.max(0, cx - r); x <= Math.min(GW - 1, cx + r); x++) {
        const t = y * GW + x
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r && g[t] === w.owner)
          set.add(t)
      }
    byLord.set(w.owner, set)
  }
  return [...byLord.values()]
}
/** The runs of my outline whose outside is an ally's, in green (src/render/regions.ts, befriend). */
function befriend(s: GameState, loops: Array<Array<Point>>) {
  const runs: Array<Array<Point>> = []
  const outside = (x: number, y: number) => s.owner[tileAt(x, y)]
  for (const loop of loops) {
    let run: Array<Point> = []
    loop.forEach((p, i) => {
      const a = loop[(i + loop.length - 1) % loop.length]
      const b = loop[(i + 1) % loop.length]
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
      const nx = ((b[1] - a[1]) / d) * 2.5
      const ny = (-(b[0] - a[0]) / d) * 2.5
      let other = outside(p[0] + nx, p[1] + ny)
      if (other === viewer) other = outside(p[0] - nx, p[1] - ny)
      if (other >= 0 && other !== viewer && isAllied(s, viewer, other))
        run.push(p)
      else {
        if (run.length > 1) runs.push(run)
        run = []
      }
    })
    if (run.length > 1) runs.push(run)
  }
  return runs.length
    ? `<path d="${path(runs, false)}" fill="none" stroke="${ALLY}" stroke-opacity="0.9" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`
    : ''
}

let clips = 0
function lands(f: Frame) {
  const g = gridOf(f.s)
  const regions = regionsOf(g)
  const parts: Array<string> = []
  const defs: Array<string> = []
  parts.push(`<path d="${LAND}" fill="${PAGE}"/>`)
  parts.push(`<g clip-path="url(#land)">`)
  for (const { v, loops } of regions) {
    const c = washOf(v)
    parts.push(
      `<path d="${path(loops)}" fill="${c}" fill-rule="evenodd" stroke="${c}" stroke-width="0.6"/>`,
    )
  }
  // The land each lord's castles hold, tinted with stone (src/render/trace.ts, castleLand).
  parts.push(
    `<path d="${path(castleLand(f.s, g).flatMap((set) => cornersOf((t) => set.has(t)).map(smooth)))}" fill="${STONE_TINT}" fill-opacity="${STONE_ALPHA}" fill-rule="evenodd"/>`,
  )
  // The watercolour's rim inside each lord's border, along the coast too.
  for (const { v, loops } of regions) {
    if (v < 0) continue
    const id = `r${clips++}`
    defs.push(
      `<clipPath id="${id}"><path d="${path(loops)}" clip-rule="evenodd"/></clipPath>`,
    )
    parts.push(
      `<g clip-path="url(#${id})" stroke="${colorOf(v)}" stroke-opacity="0.55" stroke-width="${2 * RIM}" fill="none" stroke-linejoin="round"><path d="${path(loops)}"/><use href="#coast"/></g>`,
    )
  }
  // The borders in ink, along the washes: a lord's firm, a free domain's pale.
  for (const [lords, alpha] of [
    [true, 0.8],
    [false, 0.4],
  ] as const)
    parts.push(
      `<path d="${path(regions.filter((r) => r.v >= 0 === lords).flatMap((r) => r.loops.map((l) => penned(l, 0.35, 3))))}" fill="none" stroke="${INK}" stroke-opacity="${alpha}" stroke-width="1.1" stroke-linejoin="round"/>`,
    )
  // Where my land meets an ally's, its border in green.
  const mine = regions.find((r) => r.v === viewer)
  if (mine) parts.push(befriend(f.s, mine.loops))
  parts.push(`</g>`)
  parts.push(
    `<use href="#coast" stroke="${INK}" stroke-opacity="0.9" stroke-width="1.5"/>`,
  )
  return { defs: defs.join(''), body: parts.join(''), grid: g }
}

/** The lords' works, where they stand. */
type Mark = { kind: Work; owner: number; x: number; y: number; tile: number }
const marksOf = (s: GameState): Array<Mark> =>
  s.works.map((w) => ({
    kind: w.work,
    owner: w.owner,
    tile: w.tile,
    ...siteOf(w.tile),
  }))

// The villages, a few houses and a church.
type Item = readonly [
  kind: 'h' | 'c',
  x: number,
  y: number,
  a?: number,
  b?: number,
]
const VILLAGES: ReadonlyArray<ReadonlyArray<Item>> = [
  [
    ['h', -4.6, -2.6, 3.4, 2.3],
    ['c', 1.8, -2.2],
    ['h', 5.6, -1.2, 3.2, 2.2],
    ['h', -6.2, 1, 3.8, 2.5],
    ['h', -1.6, 1.4, 3.9, 2.6],
    ['h', 3.4, 1.9, 3.5, 2.4],
  ],
  [
    ['h', -2.8, -3, 3.6, 2.4],
    ['h', 3.2, -2.6, 3.2, 2.3],
    ['c', -3, 0.6],
    ['h', 1.6, 0.9, 4, 2.6],
    ['h', 6, 1.3, 3.4, 2.3],
  ],
  [
    ['c', 0.4, -2.8],
    ['h', 5, -2, 3.6, 2.4],
    ['h', -5.6, -0.6, 3.4, 2.3],
    ['h', -2.4, 1.8, 3.8, 2.5],
    ['h', 2.8, 1.6, 3.6, 2.5],
  ],
]
const LINE = `stroke="${hex(TONE.outline)}" stroke-width="0.3"`
function house(x: number, y: number, w: number, h: number, n: number) {
  const roof = hex(TONE.roofs[n % TONE.roofs.length])
  const rh = h * 0.9
  return (
    `<rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" fill="${hex(TONE.wall)}" ${LINE}/>` +
    `<polygon points="${x - w / 2 - 0.4},${y - h} ${x - w / 2 + 0.8},${y - h - rh} ${x + w / 2 - 0.8},${y - h - rh} ${x + w / 2 + 0.4},${y - h}" fill="${roof}" ${LINE}/>` +
    `<rect x="${x - 0.4}" y="${y - 1.25}" width="0.8" height="1.25" fill="${hex(TONE.door)}"/>`
  )
}
function church(x: number, y: number, k: number) {
  return (
    house(x + 0.6 * k, y, 4.4 * k, 3 * k, 1) +
    `<rect x="${x - 3.4 * k}" y="${y - 6.4 * k}" width="${2.2 * k}" height="${6.4 * k}" fill="${hex(TONE.stone)}" ${LINE}/>` +
    `<polygon points="${x - 3.7 * k},${y - 6.4 * k} ${x - 2.3 * k},${y - 9.8 * k} ${x - 0.9 * k},${y - 6.4 * k}" fill="${hex(TONE.slate)}" ${LINE}/>`
  )
}
/** A village of houses and a church around (x, y), at its scale on the map. */
function houses(variant: number, x: number, y: number, scale = 0.7) {
  const items = [...VILLAGES[variant % VILLAGES.length]].sort(
    (p, q) => p[2] - q[2],
  )
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${scale})"><ellipse cx="0" cy="1" rx="9.5" ry="2.66" fill="${INK}" fill-opacity="0.16"/>${items
    .map(([kind, ix, iy, a, b], n) =>
      kind === 'h'
        ? house(ix, iy, a ?? 3.6, b ?? 2.4, n)
        : church(ix, iy, a ?? 1),
    )
    .join('')}</g>`
}
/**
 * The three buildings, at the land's scale, in ink and gold on the lord's
 * wash: a village (its houses in their ploughed strips), a castle (a round
 * curtain wall, its towers and its keep) and a market (stalls under striped
 * awnings by a heap of gold).
 */
function fields(x: number, y: number, seed: number) {
  const out: Array<string> = []
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + seed * 0.7
    const r = 10.5 + (i % 2) * 1.5
    const cx = x + Math.cos(a) * r
    const cy = y + Math.sin(a) * r * 0.75
    const rot = ((a * 180) / Math.PI + 90 + (i % 3) * 25).toFixed(0)
    const lines = [0, 1, 2, 3]
      .map(
        (j) => `<line x1="-3.4" y1="${-1.5 + j}" x2="3.4" y2="${-1.5 + j}"/>`,
      )
      .join('')
    out.push(
      `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${rot})">${lines}</g>`,
    )
  }
  return `<g stroke="${INK}" stroke-opacity="0.45" stroke-width="0.45" stroke-linecap="round">${out.join('')}</g>`
}
const STONE = '#d8ccae'
function castle(x: number, y: number) {
  const R = 5.6
  const towers = [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const a = (i / 6) * Math.PI * 2 + 0.3
      const tx = x + Math.cos(a) * R
      const ty = y + Math.sin(a) * R * 0.8
      return `<rect x="${f1(tx - 1.3)}" y="${f1(ty - 1.6)}" width="2.6" height="2.8" fill="${STONE}" stroke="${INK}" stroke-width="0.45"/>`
    })
    .join('')
  return (
    `<g><ellipse cx="${x}" cy="${y + 4.6}" rx="7.5" ry="2" fill="${INK}" fill-opacity="0.16"/>` +
    `<ellipse cx="${x}" cy="${y}" rx="${R}" ry="${R * 0.8}" fill="none" stroke="${INK}" stroke-width="2.4"/>` +
    `<ellipse cx="${x}" cy="${y}" rx="${R}" ry="${R * 0.8}" fill="none" stroke="${STONE}" stroke-width="1.5"/>` +
    towers +
    `<rect x="${x - 2}" y="${y - 4.4}" width="4" height="5" fill="${STONE}" stroke="${INK}" stroke-width="0.5"/>` +
    `<path d="M${x - 2.4} ${y - 4.4} L${x} ${y - 7} L${x + 2.4} ${y - 4.4} Z" fill="${hex(TONE.slate)}" stroke="${INK}" stroke-width="0.45"/>` +
    `<path d="M${x} ${y - 7} V${y - 10}" stroke="${INK}" stroke-width="0.4"/></g>`
  )
}
function market(x: number, y: number) {
  const stall = (sx: number, sy: number) =>
    `<rect x="${sx - 2.4}" y="${sy - 1.8}" width="4.8" height="2.2" fill="${hex(TONE.wall)}" stroke="${INK}" stroke-width="0.35"/>` +
    `<path d="M${sx - 3} ${sy - 1.8} L${sx - 2} ${sy - 3.8} H${sx + 2} L${sx + 3} ${sy - 1.8} Z" fill="#b3302a" stroke="${INK}" stroke-width="0.35"/>` +
    `<path d="M${sx - 1} ${sy - 3.8} L${sx - 1.4} ${sy - 1.8} M${sx + 1} ${sy - 3.8} L${sx + 1.4} ${sy - 1.8}" stroke="${LIGHT}" stroke-width="0.7"/>`
  const coins = [
    [-1.6, 3.2],
    [0.6, 3.6],
    [2.6, 3],
    [-0.4, 2.2],
    [1.6, 2],
  ]
    .map(
      ([dx, dy]) =>
        `<circle cx="${f1(x + dx)}" cy="${f1(y + dy)}" r="1.2" fill="#d9a41e" stroke="${INK}" stroke-width="0.3"/>`,
    )
    .join('')
  return (
    `<ellipse cx="${x}" cy="${y + 4.4}" rx="7" ry="1.8" fill="${INK}" fill-opacity="0.16"/>` +
    stall(x - 3.6, y - 0.6) +
    stall(x + 3.4, y - 1.4) +
    coins
  )
}
function building(b: Mark) {
  if (b.kind === 'village')
    return fields(b.x, b.y, b.x + b.y) + houses(b.x | 0, b.x, b.y, 0.95)
  if (b.kind === 'castle') return castle(b.x, b.y)
  return market(b.x, b.y)
}
function rose() {
  let best = { x: 0, y: 0, d: 0 }
  for (const c of world.map.sea) {
    let dd = Infinity
    for (const q of world.map.land)
      dd = Math.min(dd, Math.hypot(q.x - c.x, q.y - c.y))
    if (dd > best.d) best = { x: c.x, y: c.y, d: dd }
  }
  if (best.d < 60) return ''
  const r = Math.min(46, best.d * 0.55)
  const ray = (a: number, l: number, w: number, shaded: boolean) => {
    const [c, s] = [Math.cos(a), Math.sin(a)]
    const [n, m] = [Math.cos(a + Math.PI / 2), Math.sin(a + Math.PI / 2)]
    return `<path d="M${best.x} ${best.y} L${best.x + n * w} ${best.y + m * w} L${best.x + c * l} ${best.y + s * l} Z" fill="${shaded ? PAGE : INK}" stroke="${INK}" stroke-width="0.7"/><path d="M${best.x} ${best.y} L${best.x - n * w} ${best.y - m * w} L${best.x + c * l} ${best.y + s * l} Z" fill="${shaded ? INK : PAGE}" stroke="${INK}" stroke-width="0.7"/>`
  }
  const rays =
    [0, 1, 2, 3]
      .map((i) =>
        ray(((i * 90 + 45) * Math.PI) / 180, r * 0.62, r * 0.12, false),
      )
      .join('') +
    [0, 1, 2, 3]
      .map((i) => ray((i * Math.PI) / 2 - Math.PI / 2, r, r * 0.16, true))
      .join('')
  return `<g opacity="0.85"><circle cx="${best.x}" cy="${best.y}" r="${r * 0.72}" fill="none" stroke="${INK}" stroke-width="0.8"/><circle cx="${best.x}" cy="${best.y}" r="${r * 0.66}" fill="none" stroke="${INK}" stroke-width="0.5"/>${rays}</g>`
}

function neatline() {
  const W = world.width
  const H = world.height
  const b = 9
  const seg = 40
  const parts = [
    `<rect x="${-b}" y="${-b}" width="${W + 2 * b}" height="${H + 2 * b}" fill="none" stroke="${INK}" stroke-width="${b}"/>`,
  ]
  const bars: Array<string> = []
  for (let x = 0; x < W; x += seg * 2)
    bars.push(
      `<rect x="${x}" y="${-b * 0.78}" width="${Math.min(seg, W - x)}" height="${b * 0.56}"/><rect x="${x + seg}" y="${H + b * 0.22}" width="${Math.max(0, Math.min(seg, W - x - seg))}" height="${b * 0.56}"/>`,
    )
  for (let y = 0; y < H; y += seg * 2)
    bars.push(
      `<rect x="${-b * 0.78}" y="${y + seg}" width="${b * 0.56}" height="${Math.max(0, Math.min(seg, H - y - seg))}"/><rect x="${W + b * 0.22}" y="${y}" width="${b * 0.56}" height="${Math.min(seg, H - y)}"/>`,
    )
  parts.push(`<g fill="${PAGE}">${bars.join('')}</g>`)
  parts.push(
    `<rect x="${-b - 5}" y="${-b - 5}" width="${W + 2 * b + 10}" height="${H + 2 * b + 10}" fill="none" stroke="${INK}" stroke-width="1"/>`,
  )
  for (const [x, y] of [
    [-b, -b],
    [W + b, -b],
    [-b, H + b],
    [W + b, H + b],
  ])
    parts.push(
      `<rect x="${x - 9}" y="${y - 9}" width="18" height="18" fill="${PAGE}" stroke="${INK}" stroke-width="1.6"/><path d="M${x} ${y - 6} L${x + 6} ${y} L${x} ${y + 6} L${x - 6} ${y} Z" fill="${GOLD}" stroke="${INK}" stroke-width="1"/>`,
    )
  return parts.join('')
}

const ROSE = rose()
/** Writes the frame's map; returns its grid of owners. */
function svg(f: Frame) {
  const land = lands(f)
  const marks = marksOf(f.s)
  const built = marks
    .filter((b) => inView(f, b.x, b.y))
    .sort((a, b) => a.y - b.y)
    .map(building)
    .join('')
  const defs = `<defs><clipPath id="land"><path d="${LAND}"/></clipPath><path id="coast" d="${COAST}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>${land.defs}</defs>`
  writeFileSync(
    `${OUT}/${f.name}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(f.x)} ${f1(f.y)} ${f1(f.w)} ${f1(f.h)}" width="1440" height="900">${defs}${sea()}${land.body}${ROSE}${built}${neatline()}</svg>`,
  )
  return land.grid
}

// What is laid over a frame, in its pixels.
/** Men in a rank for so many soldiers: two to nine, by orders of magnitude (src/render/layers/melee.ts). */
const rankOf = (count: number) =>
  Math.max(2, Math.min(9, 2 + Math.floor(Math.log2(1 + (count * 10) / 6))))
/** Places an army fights at, at most (src/render/armies.ts). */
const PLACES = 3

/**
 * An army as the fluid land draws it: the pocket it took, already washed
 * in its lord's colour on the frame; the band it took in the last second,
 * a light veil of gold where the wash is still wet; a few fights spread
 * along the bulge where it advances, its rank facing the land's; and its
 * men in a pill of its lord's colour over them.
 */
function attackOut(
  f: Frame,
  host: Host,
  since: Array<number>,
  recent: Array<number>,
) {
  const s = f.s
  const pocket: Array<number> = []
  const band: Array<number> = []
  for (let t = 0; t < s.owner.length; t++) {
    if (s.owner[t] !== host.owner) continue
    if (since[t] === host.target) pocket.push(t)
    if (recent[t] === host.target) band.push(t)
  }
  const taken = pocket.length ? pocket : [host.entry]
  const fronts: Array<{ x: number; y: number; ox: number; oy: number }> = []
  for (const t of taken)
    for (const n of four(t)) {
      if (s.owner[n] !== host.target) continue
      fronts.push({
        x: (tileX(t) + tileX(n)) / 2,
        y: (tileY(t) + tileY(n)) / 2,
        ox: (tileX(t) - tileX(n)) / TILE,
        oy: (tileY(t) - tileY(n)) / TILE,
      })
    }
  const aim = siteOf(host.aim)
  const count = Math.min(PLACES, Math.max(1, Math.round(taken.length / 60)))
  const chosen: typeof fronts = []
  if (fronts.length) {
    chosen.push(
      fronts.reduce((b, q) =>
        Math.hypot(q.x - aim.x, q.y - aim.y) <
        Math.hypot(b.x - aim.x, b.y - aim.y)
          ? q
          : b,
      ),
    )
    while (chosen.length < Math.min(count, fronts.length)) {
      const gapTo = (q: { x: number; y: number }) =>
        Math.min(...chosen.map((c) => Math.hypot(q.x - c.x, q.y - c.y)))
      chosen.push(fronts.reduce((b, q) => (gapTo(q) > gapTo(b) ? q : b)))
    }
  }
  const defender =
    host.target >= 0
      ? Math.floor(s.players[host.target].peasants / UNIT / 20)
      : 2
  const clashes = chosen.map((c, i) => {
    const near = fronts.filter((q) => Math.hypot(q.x - c.x, q.y - c.y) < 10)
    const ox = near.reduce((t, q) => t + q.ox, 0)
    const oy = near.reduce((t, q) => t + q.oy, 0)
    const dd = Math.hypot(ox, oy) || 1
    return {
      ...px(f, c.x, c.y),
      ox: +(ox / dd).toFixed(3),
      oy: +(oy / dd).toFixed(3),
      ca: colorOf(host.owner),
      cd: colorOf(host.target),
      ra: rankOf(host.men / UNIT / PLACES / 4),
      rd: rankOf(defender),
      seed: host.entry + i * 7,
    }
  })
  const mean = (xs: Array<number>) =>
    xs.reduce((t, x) => t + x, 0) / Math.max(1, xs.length)
  const where = chosen.length
    ? { x: mean(chosen.map((c) => c.x)), y: mean(chosen.map((c) => c.y)) }
    : siteOf(host.entry)
  const pill = px(f, where.x, where.y)
  const inBand = new Set(band)
  return {
    owner: host.owner,
    target: host.target,
    color: colorOf(host.owner),
    me: host.owner === viewer,
    men: Math.floor(host.men / UNIT),
    tiles: pocket.length,
    entry: tpx(f, host.entry),
    aim: tpx(f, host.aim),
    pill: { x: pill.x, y: +(pill.y - 22).toFixed(1) },
    clashes,
    band: band.length
      ? path(
          cornersOf((t) => inBand.has(t)).map((l) =>
            smooth(l).map(([x, y]) => {
              const q = px(f, x, y)
              return [q.x, q.y] as Point
            }),
          ),
        )
      : '',
  }
}

/** Where each lord is written: the tile deepest in the largest piece of his land, the nearest its middle among the deepest. */
function heartsOf(s: GameState): Map<number, number> {
  const piece = new Int32Array(s.owner.length).fill(-1)
  const best = new Map<number, Array<number>>()
  for (let t = 0; t < s.owner.length; t++) {
    const o = s.owner[t]
    if (o < 0 || piece[t] >= 0) continue
    const tiles = [t]
    piece[t] = t
    for (let i = 0; i < tiles.length; i++)
      for (const n of four(tiles[i]))
        if (piece[n] < 0 && s.owner[n] === o) {
          piece[n] = t
          tiles.push(n)
        }
    if (tiles.length > (best.get(o)?.length ?? 0)) best.set(o, tiles)
  }
  const hearts = new Map<number, number>()
  for (const [o, tiles] of best) {
    const depth = new Map<number, number>()
    const queue = tiles.filter(
      (t) => four(t).some((n) => s.owner[n] !== o) || four(t).length < 4,
    )
    for (const t of queue) depth.set(t, 0)
    for (let i = 0; i < queue.length; i++)
      for (const n of four(queue[i]))
        if (!depth.has(n) && s.owner[n] === o) {
          depth.set(n, (depth.get(queue[i]) ?? 0) + 1)
          queue.push(n)
        }
    const cx = tiles.reduce((a, t) => a + tileX(t), 0) / tiles.length
    const cy = tiles.reduce((a, t) => a + tileY(t), 0) / tiles.length
    const off = (t: number) => Math.hypot(tileX(t) - cx, tileY(t) - cy)
    hearts.set(
      o,
      tiles.reduce((a, b) => {
        const da = depth.get(a) ?? 0
        const db = depth.get(b) ?? 0
        if (db !== da) return db > da ? b : a
        return off(b) < off(a) ? b : a
      }),
    )
  }
  return hearts
}

/** A badge by a lord's name, as src/render/places.ts draws it: an ally's links, a traitor's broken shield, on a white disc, 20 pixels across. */
const BADGE = 20
function badge(x: number, y: number, icon: 'links' | 'felon') {
  const k = BADGE / 35
  const parts = GLYPHS[icon]
    .map(
      (p: { d: string; open?: boolean }) =>
        `<path d="${p.d}" fill="${p.open ? 'none' : hex(TONE.parchment)}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`,
    )
    .join('')
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${k.toFixed(4)})"><circle r="17.3" fill="#ffffff" stroke="${INK}" stroke-width="1.9"/><g transform="translate(-12 -12)">${parts}</g></g>`
}
/** Each lord written at the heart of his land, as src/render/layers/labels.ts: his name, and under it his peasants beside a soldier; mine in gold; over his name, his badges. Pixels. */
const thousands = (n: number) => n.toLocaleString('fr-FR').replace(/\s/g, ' ')
const soldierMark = (x: number, y: number, k: number) =>
  `<g transform="translate(${f1(x)} ${f1(y)}) scale(${k.toFixed(3)})"><path d="M-1.3 -0.4 L-1.9 2.6 M1.2 -0.4 L1.8 2.6" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/><path d="M-1.2 1.5 L5.2 -11.5" stroke="${INK}" stroke-width="1.1" stroke-linecap="round"/><path d="M5.2 -11.5 L4.4 -9.6 L6.1 -10.4 Z" fill="${LIGHT}" stroke="${INK}" stroke-width="0.5"/><rect x="-2.3" y="-5.6" width="4.6" height="5.6" rx="1.3" fill="${LIGHT}" stroke="${INK}" stroke-width="0.9"/><circle cx="0" cy="-7.2" r="1.75" fill="${LIGHT}" stroke="${INK}" stroke-width="0.8"/><path d="M-2 -7.3 Q0 -10.3 2 -7.3 Z" fill="${INK}"/><path d="M1.6 -5.4 L4.6 -5.4 L4.6 -3 Q4.6 -1.1 3.1 -0.4 Q1.6 -1.1 1.6 -3 Z" fill="${LIGHT}" stroke="${INK}" stroke-width="0.8"/></g>`
function labelsIn(f: Frame) {
  const s = f.s
  const hearts = heartsOf(s)
  const out: Array<{
    lord: number
    x: number
    y: number
    box: Array<number>
    svg: string
  }> = []
  s.players.forEach((p, o) => {
    const heart = hearts.get(o)
    if (!p.alive || heart === undefined) return
    const h = siteOf(heart)
    const { x, y } = px(f, h.x, h.y)
    if (x < 0 || x > 1440 || y < 0 || y > 900) return
    const size = Math.min(46, 24 + 4 * Math.sqrt(p.tiles / 25))
    const big = size
    const small = Math.max(13, size * 0.56)
    const fill = o === viewer ? '#f4d277' : LIGHT
    const cut = (w: number) =>
      `stroke="${INK}" stroke-width="${f1(w)}" stroke-linejoin="round" paint-order="stroke"`
    const figure = thousands(Math.floor(p.peasants / UNIT))
    const width = figure.length * big * 0.5
    const mark = big * 0.62
    const left = x - (width + mark * 1.05) / 2
    const row = y + big * 0.48
    const nameW = nameOf(o).length * small * 0.62
    const icons: Array<'links' | 'felon'> = []
    if (viewer >= 0 && isAllied(s, viewer, o)) icons.push('links')
    if (isFelon(s, o)) icons.push('felon')
    const badges = icons
      .map((icon, k) =>
        badge(
          x + (k - (icons.length - 1) / 2) * (BADGE + 4),
          y - big * 1.25,
          icon,
        ),
      )
      .join('')
    out.push({
      lord: o,
      x,
      y,
      box: [
        +f1(Math.min(x - nameW / 2, left)),
        +f1(icons.length ? y - big * 1.25 - BADGE / 2 : y - small * 1.3),
        +f1(Math.max(x + nameW / 2, left + mark * 1.05 + width)),
        +f1(row + big * 0.55),
      ],
      svg: `<g><text x="${x}" y="${f1(y - small * 0.62 + small * 0.34)}" text-anchor="middle" font-family="'IM Fell English SC', serif" font-size="${f1(small)}" fill="${fill}" ${cut(small * 0.18)}>${nameOf(o)}</text>${soldierMark(left + mark * 0.35, row + big * 0.3, (mark * 1.25) / 14)}<text x="${f1(left + mark * 1.05)}" y="${f1(row + big * 0.36)}" font-family="'Alegreya Sans', sans-serif" font-weight="900" font-size="${f1(big)}" fill="${fill}" ${cut(big * 0.2)} style="font-variant-numeric: lining-nums">${figure}</text>${badges}</g>`,
    })
  })
  return out
}

/** What the HUD reads (src/render/summary.ts). */
const clock = (s: GameState) => {
  const t = Math.floor(s.tick / 10)
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}
const mmss = (t: number | null) =>
  t === null ? null : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
const named = (seat: { key: string; color: number }) => ({
  name: NAMES[seat.key],
  color: hex(seat.color),
})
/** What the HUD shows, from the game's own summary (src/render/summary.ts): the army in hand is the host. */
function summary(s: GameState, work: Work | null = null) {
  const h = summarize(s, ME, { army: 'host', work })
  const me = h.me!
  const ranked = s.players
    .map((p, o) => ({ n: p.tiles, o }))
    .filter((r) => r.o !== ME)
    .sort((a, b) => b.n - a.n)
  const rival = h.leader && h.leader.key !== me.key ? h.leader : null
  return {
    clock: mmss(h.seconds),
    opening: h.opening,
    peasants: me.peasants,
    cap: me.cap,
    growth: me.growth,
    gold: me.gold,
    share: me.share,
    leader: rival
      ? { ...named(rival), share: rival.share }
      : {
          name: nameOf(ranked[0].o),
          color: colorOf(ranked[0].o),
          share: Math.round((100 * s.players[ranked[0].o].tiles) / grid.area),
        },
    rival: rival !== null,
    needed: h.needed,
    dropIn: mmss(h.dropIn),
    armies: h.armies,
    work: h.work,
    works: h.works.map((w) => ({ ...w, held: worksOf(s, ME, w.work) })),
    allies: h.allies.map((a) => ({
      ...named(a),
      seat: a.seat,
      left: mmss(a.left),
      renewable: a.renewable,
    })),
    offers: h.offers.map((o) => ({ ...named(o), seat: o.seat, left: o.left })),
    asked: h.asked,
  }
}

/** The caravans in view, as src/render/trade.ts draws them: where each is on its road, its lord's colour, which way it goes; my road ahead dotted every three tiles. Pixels. */
function caravansIn(f: Frame) {
  const zoom = 1 / f.k
  return f.s.caravans.flatMap((c) => {
    const at = Math.min(c.road.length - 1, c.along / 1000)
    const i = Math.min(c.road.length - 2, Math.floor(at))
    const t = at - i
    const a = siteOf(c.road[i])
    const b = siteOf(c.road[i + 1])
    const x = a.x + (b.x - a.x) * t
    const y = a.y + (b.y - a.y) * t
    if (!inView(f, x, y, 20)) return []
    const dots: Array<{ x: number; y: number }> = []
    if (c.owner === viewer)
      for (let j = i + 1; j < c.road.length; j += 3)
        dots.push(tpx(f, c.road[j]))
    return [
      {
        ...px(f, x, y),
        owner: c.owner,
        to: c.to,
        me: c.owner === viewer,
        color: colorOf(c.owner),
        right: b.x >= a.x,
        gold: Math.floor(c.gold / UNIT),
        dots,
        dot: +(1.1 + 0.4 * zoom).toFixed(2),
      },
    ]
  })
}

/** All that a frame lays over itself. */
function layer(
  f: Frame,
  hosts: Array<{ host: Host; since: Array<number>; recent: Array<number> }>,
  work: Work | null = null,
) {
  const heart = heartsOf(f.s).get(viewer)
  return {
    k: +(1 / f.k).toFixed(4),
    attacks: hosts
      .filter(({ host }) => {
        const e = siteOf(host.entry)
        return inView(f, e.x, e.y, 40)
      })
      .map(({ host, since, recent }) => attackOut(f, host, since, recent)),
    labels: labelsIn(f),
    heart: heart === undefined ? null : tpx(f, heart),
    hud: summary(f.s, work),
    caravans: caravansIn(f),
    works: marksOf(f.s)
      .filter((b) => inView(f, b.x, b.y, 0))
      .map((b) => ({ kind: b.kind, owner: b.owner, ...px(f, b.x, b.y) })),
  }
}

// The composition.
/** The lords bordering a lord's land, and the tiles of theirs that touch it. */
function bordersOf(s: GameState, lord: number) {
  const found = new Map<number, Set<number>>()
  s.owner.forEach((o, t) => {
    if (o !== lord) return
    for (const n of four(t)) {
      const other = s.owner[n]
      if (other === lord || other < NEUTRAL) continue
      const set = found.get(other) ?? new Set<number>()
      set.add(n)
      found.set(other, set)
    }
  })
  return new Map([...found].map(([o, set]) => [o, [...set]]))
}
const middleOf = (tiles: Array<number>) => ({
  x: tiles.reduce((a, t) => a + tileX(t), 0) / Math.max(1, tiles.length),
  y: tiles.reduce((a, t) => a + tileY(t), 0) / Math.max(1, tiles.length),
})
const landOf = (s: GameState, o: number) =>
  s.owner.flatMap((x, t) => (x === o ? [t] : []))
/** The lord, not an ally, whose border with this lord's land is the longest. */
function longest(s: GameState, lord: number, but: Array<number> = []) {
  const b = bordersOf(s, lord)
  const lords = [...b.keys()].filter(
    (o) => o >= 0 && !isAllied(s, lord, o) && !but.includes(o),
  )
  lords.sort((x, y) => b.get(y)!.length - b.get(x)!.length)
  return lords[0]
}
/** A tile some way into the defender's land, from the middle of the border towards the middle of his land (away from mine for the free land). */
function clickInto(
  s: GameState,
  attacker: number,
  defender: number,
  depth: number,
) {
  const border = bordersOf(s, attacker).get(defender) ?? []
  const m = middleOf(border)
  const toward =
    defender === NEUTRAL
      ? (() => {
          const c = middleOf(landOf(s, attacker))
          return { x: 2 * m.x - c.x, y: 2 * m.y - c.y }
        })()
      : middleOf(landOf(s, defender))
  const dd = Math.hypot(toward.x - m.x, toward.y - m.y) || 1
  const want = {
    x: m.x + ((toward.x - m.x) * depth) / dd,
    y: m.y + ((toward.y - m.y) * depth) / dd,
  }
  let best = border[0]
  s.owner.forEach((o, t) => {
    if (o !== defender) return
    if (
      Math.hypot(tileX(t) - want.x, tileY(t) - want.y) <
      Math.hypot(tileX(best) - want.x, tileY(best) - want.y)
    )
      best = t
  })
  return best
}
/** Tiles by their distance from a lord's land, in tiles, up to so far. */
function reach(s: GameState, lord: number, most: number) {
  const depth = new Int16Array(s.owner.length).fill(-1)
  let ring = landOf(s, lord)
  for (const t of ring) depth[t] = 0
  for (let d = 1; d <= most; d++) {
    const next: Array<number> = []
    for (const t of ring)
      for (const n of four(t))
        if (depth[n] < 0 && grid.land[n]) {
          depth[n] = d
          next.push(n)
        }
    ring = next
  }
  return depth
}
/** A tile of the defender's land so many tiles from mine, his all round it, the nearest a place. */
function pickInto(
  s: GameState,
  attacker: number,
  defender: number,
  from: number,
  to: number,
  near: { x: number; y: number },
) {
  const depth = reach(s, attacker, to)
  let best = -1
  let gap = Infinity
  for (let t = 0; t < s.owner.length; t++) {
    if (s.owner[t] !== defender || depth[t] < from || depth[t] > to) continue
    const x = t % GW
    const y = Math.floor(t / GW)
    let solid = true
    for (let dy = -3; dy <= 3 && solid; dy++)
      for (let dx = -3; dx <= 3 && solid; dx++) {
        const u = (y + dy) * GW + x + dx
        if (u < 0 || u >= s.owner.length || s.owner[u] !== defender)
          solid = false
      }
    if (!solid) continue
    const d = Math.hypot(tileX(t) - near.x, tileY(t) - near.y)
    if (d < gap) {
      gap = d
      best = t
    }
  }
  return best
}
const stage = (s: GameState, share = 85) => {
  const lord = s.players[ME]
  lord.peasants = Math.max(
    lord.peasants,
    Math.floor((capOf(s, ME) * share) / 100),
  )
  lord.gold = Math.max(lord.gold, Math.floor((lord.peasants * 3) / 5))
}

mkdirSync(OUT, { recursive: true })
const data: Record<string, unknown> = {}

// The game to T0; the owners a few seconds before, for the armies already out.
run(live, T0 - 40)
const before40 = [...live.owner]
run(live, T0)
const atAim: GameState = structuredClone(live)
const FOE = longest(live, ME)
const foeClick = clickInto(live, ME, FOE, 64)
// Another lord beside me, neither my foe nor my ally, offers me his alliance.
const OFFER = longest(live, ME, [FOE]) ?? FOE
// Of two lords allied, the one nearer my land breaks with the other: a traitor, marked thirty seconds.
const myMiddle = middleOf(landOf(live, ME))
const awayFromMe = (o: number) => {
  const m = middleOf(landOf(live, o))
  return Math.hypot(m.x - myMiddle.x, m.y - myMiddle.y)
}
const pact = live.alliances
  .filter(
    (x) =>
      ![ME, FOE, OFFER].some((o) => o === x.a || o === x.b) &&
      !isAllied(live, ME, x.a) &&
      !isAllied(live, ME, x.b),
  )
  .sort(
    (x, y) =>
      Math.min(awayFromMe(x.a), awayFromMe(x.b)) -
      Math.min(awayFromMe(y.a), awayFromMe(y.b)),
  )[0]
const TRAITOR = pact
  ? awayFromMe(pact.a) <= awayFromMe(pact.b)
    ? pact.a
    : pact.b
  : -1
const BETRAYED = pact ? (TRAITOR === pact.a ? pact.b : pact.a) : -1
// My market, on my land nearest another lord's market, built so that it sends its caravan before the middle of the game (src/render/caravans.ts).
const foreignMarkets = live.works.filter(
  (w) => w.work === 'market' && w.owner !== ME,
)
const marketTile = (() => {
  const sends = (t: number) => {
    for (let k = T0 + 2; k <= MID - 12; k++)
      if ((k + t * 7) % live.rules.caravanTicks === 0) return true
    return false
  }
  let best = -1
  let gap = Infinity
  for (const t of landOf(live, ME)) {
    if (!canBuild(live, ME, t) || !sends(t)) continue
    const d = Math.min(...foreignMarkets.map((w) => dist(w.tile, t)))
    if (d < gap) {
      gap = d
      best = t
    }
  }
  return best
})()
// Staging: my gauge well filled, the gold to pay, and my host the only war on that border for a while.
stage(live)
live.players[ME].gold += priceOf(live, ME, 'market') * UNIT
const launch = [...live.owner]
quiet.add(ME)
quiet.add(FOE)
const moments = new Map<number, GameState>()
const owners = new Map<number, Array<number>>([[T0, launch]])
const want = [T0 + 6, MID, T0 + 90]
const keep = [T0 + 22, T0 + 82, MID - 8]
run(live, T0 + 1, [
  { player: ME, type: 'attack', tile: foeClick, army: 'host' },
  ...(marketTile >= 0
    ? [{ player: ME, type: 'build', tile: marketTile, work: 'market' } as const]
    : []),
  { player: OFFER, type: 'ally', target: ME },
  ...(TRAITOR >= 0
    ? [{ player: TRAITOR, type: 'breakAlliance', target: BETRAYED } as const]
    : []),
])
while (live.tick < T0 + 90) {
  run(live, live.tick + 1)
  if (keep.includes(live.tick)) owners.set(live.tick, [...live.owner])
  if (want.includes(live.tick)) moments.set(live.tick, structuredClone(live))
}
quiet.clear()
const myHost = (s: GameState) =>
  s.hosts.find((h) => h.owner === ME && h.target === FOE)

// La terre: the whole page, from afar, in the middle of the game.
const mid = moments.get(MID)!
const pageW = Math.max(world.width + 150, (world.height + 130) * 1.6)
const main = frame('main', world.width / 2, world.height / 2, pageW, mid)
svg(main)
const midBorders = bordersOf(mid, ME)
const hoverLord = midBorders.has(OFFER)
  ? OFFER
  : ([...midBorders.keys()]
      .filter((o) => o >= 0 && o !== FOE && !isAllied(mid, ME, o))
      .sort(
        (a, b) => midBorders.get(b)!.length - midBorders.get(a)!.length,
      )[0] ?? FOE)
/** The HUD's pieces on a screen (boards.py lays them so): the purse and an ally, the race, a letter, the bar. */
const HUD_BOXES = [
  [16, 16, 336, 190],
  [497, 16, 943, 90],
  [1104, 16, 1424, 110],
  [291, 756, 1149, 888],
]
/** Where the pointer rests on a lord's land near mine: the cartouche beside it, away from the entry, over his land, clear of mine and of the HUD; near the middle of the screen. */
function restOn(f: Frame, lord: number) {
  const s = f.s
  const near = new Set<number>()
  let ring = landOf(s, ME)
  const seen = new Set(ring)
  for (let d = 0; d < 14; d++) {
    const next: Array<number> = []
    for (const t of ring)
      for (const n of four(t))
        if (!seen.has(n)) {
          seen.add(n)
          next.push(n)
          if (d >= 6 && s.owner[n] === lord) near.add(n)
        }
    ring = next
  }
  const score = (t: number) => {
    const p = tpx(f, t)
    const gate = entryFor(s, ME, t)
    if (gate < 0) return Infinity
    const e = tpx(f, gate)
    // The cartouche, 272 by 129, beside the pointer away from the entry (src/components/game/Cursor.tsx).
    const right = e.x <= p.x
    const below = e.y <= p.y
    const x0 = right ? p.x + 24 : p.x - 24 - 272
    const y0 = below ? p.y + 20 : p.y - 20 - 129
    const box = [x0, y0, x0 + 272, y0 + 129]
    if (box[0] < 16 || box[1] < 16 || box[2] > 1424 || box[3] > 884)
      return Infinity
    for (const h of HUD_BOXES)
      if (!(
        box[2] + 8 < h[0] ||
        box[0] - 8 > h[2] ||
        box[3] + 8 < h[1] ||
        box[1] - 8 > h[3]
      ))
        return Infinity
    let mine = 0
    for (let x = box[0]; x < box[2]; x += 8)
      for (let y = box[1]; y < box[3]; y += 8) {
        const wx = f.x + (x / 1440) * f.w
        const wy = f.y + (y / 900) * f.h
        if (s.owner[tileAt(wx, wy)] === ME) mine++
      }
    return mine * 10 + Math.abs(p.y - 380) / 40
  }
  let best = clickInto(s, ME, lord, 40)
  let bestScore = score(best)
  for (const t of near) {
    if (t % 3) continue
    const sc = score(t)
    if (sc < bestScore) {
      best = t
      bestScore = sc
    }
  }
  return best
}
const hoverTile = restOn(main, hoverLord)
const hoverOwner = mid.owner[hoverTile]
data.main = {
  ...layer(
    main,
    mid.hosts.map((host) => ({
      host,
      since: host.owner === ME ? launch : before40,
      recent: owners.get(MID - 8)!,
    })),
  ),
  hover: {
    lord: hoverOwner,
    name: nameOf(hoverOwner),
    color: colorOf(hoverOwner),
    ...tpx(main, hoverTile),
    entry: tpx(main, entryFor(mid, ME, hoverTile)),
  },
}

// Le front: my host at three moments: as it enters at one point, as its
// pocket grows towards the click, and further on.
const fronts = [
  { s: moments.get(T0 + 6)!, recent: launch },
  { s: mid, recent: owners.get(MID - 8)! },
  { s: moments.get(T0 + 90)!, recent: owners.get(T0 + 82)! },
]
const last = fronts[2].s
const pocketTiles = last.owner.flatMap((o, t) =>
  o === ME && launch[t] === FOE ? [t] : [],
)
const ax = pocketTiles.map(tileX).concat(tileX(foeClick))
const ay = pocketTiles.map(tileY).concat(tileY(foeClick))
/** Each moment is shown in a panel of 448 x 560 pixels around the pocket. */
const frontW =
  (Math.max(
    Math.max(...ax) - Math.min(...ax) + 110,
    ((Math.max(...ay) - Math.min(...ay) + 150) * 448) / 560,
  ) *
    1440) /
  448
const focus = {
  x: (Math.min(...ax) + Math.max(...ax)) / 2,
  y: (Math.min(...ay) + Math.max(...ay)) / 2 - 8,
}
data.front = fronts.map(({ s, recent }, i) => {
  const f = frame(`front${i + 1}`, focus.x, focus.y, frontW, s)
  svg(f)
  const host = myHost(s)
  return {
    ...layer(f, host ? [{ host, since: launch, recent }] : []),
    seconds: +((s.tick - T0) / SECOND).toFixed(1),
    entry: tpx(f, entryFor(atAim, ME, foeClick)),
    click: tpx(f, foeClick),
  }
})

// Viser: my border with that lord, and with the free land if any is left.
const atBorders = bordersOf(atAim, ME)
const aimFoe = (() => {
  const t = pickInto(atAim, ME, FOE, 9, 14, middleOf(atBorders.get(FOE) ?? []))
  return t >= 0 ? t : clickInto(atAim, ME, FOE, 40)
})()
const freeTile = (atBorders.get(NEUTRAL) ?? []).length
  ? pickInto(atAim, ME, NEUTRAL, 7, 12, siteOf(aimFoe))
  : -1
const aimCentre =
  freeTile >= 0
    ? {
        x: (tileX(aimFoe) + tileX(freeTile)) / 2,
        y: (tileY(aimFoe) + tileY(freeTile)) / 2,
      }
    : siteOf(aimFoe)
const aimView = frame(
  'aim',
  aimCentre.x,
  aimCentre.y,
  freeTile >= 0
    ? Math.max(
        520,
        Math.abs(tileX(aimFoe) - tileX(freeTile)) * 2.4,
        Math.abs(tileY(aimFoe) - tileY(freeTile)) * 2.4 * 1.6,
      )
    : 520,
  atAim,
)
svg(aimView)
const aimOf = (f: Frame, tile: number) => {
  const o = f.s.owner[tile]
  const entry = entryFor(f.s, ME, tile)
  return {
    lord: o >= 0 ? o : null,
    name: o >= 0 ? nameOf(o) : null,
    color: o >= 0 ? colorOf(o) : null,
    ...tpx(f, tile),
    entry: entry >= 0 ? tpx(f, entry) : null,
  }
}
data.aim = {
  ...layer(
    aimView,
    atAim.hosts.map((host) => ({
      host,
      since: before40,
      recent: before40,
    })),
  ),
  foe: aimOf(aimView, aimFoe),
  free: freeTile >= 0 ? aimOf(aimView, freeTile) : null,
}

// Alliances et marchands: my land closer, at the middle of the game: the
// green border with my ally, the traitor's badge, the lord who offers me his
// alliance, my caravan on its road. My alliance is set in its last thirty
// seconds, so the HUD offers to renew it.
const pactState: GameState = structuredClone(mid)
for (const x of pactState.alliances)
  if (x.a === ME || x.b === ME) x.expires = pactState.tick + 240
const myAllies = mid.players.flatMap((_, o) =>
  isAllied(mid, ME, o) ? [o] : [],
)
const pactTiles = [
  ...landOf(mid, ME),
  ...mid.caravans.filter((c) => c.owner === ME).flatMap((c) => c.road),
]
const midHearts = heartsOf(mid)
for (const o of [TRAITOR, ...myAllies]) {
  const h = midHearts.get(o)
  if (h !== undefined) pactTiles.push(h)
}
const pactBox = {
  x0: Math.min(...pactTiles.map(tileX)),
  x1: Math.max(...pactTiles.map(tileX)),
  y0: Math.min(...pactTiles.map(tileY)),
  y1: Math.max(...pactTiles.map(tileY)),
}
/** The focus between 110 and 620 pixels down the screen, clear of the race above and of the bar below, with room for the names under the hearts; 80 % of the width. */
const pactW = Math.min(
  pageW * 0.8,
  Math.max(
    (pactBox.x1 - pactBox.x0) / 0.8,
    ((pactBox.y1 - pactBox.y0) / (510 / 900)) * 1.6,
    420,
  ),
)
const pactView = frame(
  'pact',
  (pactBox.x0 + pactBox.x1) / 2,
  (pactBox.y0 + pactBox.y1) / 2 + ((450 - 365) / 900) * ((pactW * 900) / 1440),
  pactW,
  pactState,
)
svg(pactView)
const pactBorders = bordersOf(mid, ME)
const spotOn = (lord: number) =>
  (pactBorders.get(lord) ?? []).length ? restOn(pactView, lord) : -1
const plainLord = longest(mid, ME, [OFFER]) ?? FOE
data.pact = {
  ...layer(
    pactView,
    mid.hosts.map((host) => ({
      host,
      since: host.owner === ME ? launch : before40,
      recent: owners.get(MID - 8)!,
    })),
  ),
  offer: spotOn(OFFER) >= 0 ? aimOf(pactView, spotOn(OFFER)) : null,
  plain: spotOn(plainLord) >= 0 ? aimOf(pactView, spotOn(plainLord)) : null,
  ally:
    myAllies.length && spotOn(myAllies[0]) >= 0
      ? aimOf(pactView, spotOn(myAllies[0]))
      : null,
  traitor:
    TRAITOR >= 0
      ? {
          name: nameOf(TRAITOR),
          color: colorOf(TRAITOR),
          betrayed: nameOf(BETRAYED),
        }
      : null,
}

// L'accueil: behind the home's menu, the game as a spectator sees it, no
// one's eyes; the camera of src/render/director.ts on the fiercest fight,
// framing the tiles it took last with room round them, at most four times
// closer than the whole land, centred in the screen right of the menu.
const MENU = 400
const homeHost = mid.hosts.reduce((a, b) => (b.men > a.men ? b : a))
const homeShot = (() => {
  const free = 1440 - MENU
  const fit = Math.min(free / world.width, 900 / world.height) * 0.94
  const tiles = homeHost.edge.length
    ? homeHost.edge
    : [homeHost.entry, homeHost.aim]
  const xs = tiles.map(tileX)
  const ys = tiles.map(tileY)
  const [x0, x1, y0, y1] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ]
  const k = Math.max(
    fit,
    Math.min(4 * fit, free / (x1 - x0 + 150), 900 / (y1 - y0 + 150)),
  )
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, k }
})()
viewer = -1
const home = frame(
  'home',
  homeShot.x - (MENU + (1440 - MENU) / 2 - 720) / homeShot.k,
  homeShot.y,
  1440 / homeShot.k,
  mid,
)
svg(home)
data.home = {
  ...layer(
    home,
    mid.hosts.map((host) => ({
      host,
      since: host.owner === ME ? launch : before40,
      recent: owners.get(MID - 8)!,
    })),
  ),
  shot: homeShot,
  fight: [
    nameOf(homeHost.owner),
    homeHost.target >= 0 ? nameOf(homeHost.target) : 'libre',
    Math.floor(homeHost.men / UNIT),
  ],
}
viewer = ME

// Later on.
run(live, LATE)
const late: GameState = structuredClone(live)

// Les trois armées: the same click on the lord whose border with mine is the
// longest, with each army, once it is spent: how far each goes.
const RIVAL = (() => {
  const b = bordersOf(late, ME)
  const lords = [...b.keys()].filter(
    (o) => o >= 0 && b.get(o)!.length >= 30 && !isAllied(late, ME, o),
  )
  lords.sort((x, y) => late.players[y].tiles - late.players[x].tiles)
  return lords[0] ?? longest(late, ME)
})()
const rivalClick = (() => {
  const t = pickInto(
    late,
    ME,
    RIVAL,
    12,
    18,
    middleOf(bordersOf(late, ME).get(RIVAL) ?? []),
  )
  return t >= 0 ? t : clickInto(late, ME, RIVAL, 60)
})()
const ready: GameState = structuredClone(late)
ready.alliances = ready.alliances.filter(
  (x) => !((x.a === ME && x.b === RIVAL) || (x.a === RIVAL && x.b === ME)),
)
ready.hosts = ready.hosts.filter(
  (h) =>
    !(h.owner === RIVAL && h.target === ME) &&
    !(h.owner === ME && h.target === RIVAL),
)
stage(ready, 95)
const readyOwners = [...ready.owner]
const spent = (['raid', 'host', 'ban'] as const).map((army) => {
  const s: GameState = structuredClone(ready)
  step(s, [{ player: ME, type: 'attack', tile: rivalClick, army }])
  const sent = s.hosts.find((h) => h.owner === ME && h.target === RIVAL)
  const men = sent ? Math.floor(sent.men / UNIT) : 0
  let guard = 0
  while (
    s.hosts.some((h) => h.owner === ME && h.target === RIVAL) &&
    guard++ < 900
  )
    step(s, [])
  return { army, s, men, ticks: guard }
})
const banTiles = spent[2].s.owner.flatMap((o, t) =>
  o === ME && readyOwners[t] === RIVAL ? [t] : [],
)
const bx = banTiles.map(tileX).concat(tileX(rivalClick))
const by = banTiles.map(tileY).concat(tileY(rivalClick))
/** Each army is shown in a panel of 448 x 470 pixels around the largest pocket. */
const armyW =
  (Math.max(
    Math.max(...bx) - Math.min(...bx) + 120,
    ((Math.max(...by) - Math.min(...by) + 140) * 448) / 470,
  ) *
    1440) /
  448
data.armies = spent.map(({ army, s, men, ticks }) => {
  const f = frame(
    army,
    (Math.min(...bx) + Math.max(...bx)) / 2,
    (Math.min(...by) + Math.max(...by)) / 2,
    armyW,
    s,
  )
  svg(f)
  const pocket = s.owner.flatMap((o, t) =>
    o === ME && readyOwners[t] === RIVAL ? [t] : [],
  )
  const inPocket = new Set(pocket)
  return {
    army,
    ...layer(f, []),
    ready: summary(ready),
    men,
    seconds: +(ticks / SECOND).toFixed(1),
    tiles: pocket.length,
    entry: tpx(f, entryFor(ready, ME, rivalClick)),
    click: tpx(f, rivalClick),
    pocket: path(
      cornersOf((t) => inPocket.has(t)).map((l) =>
        smooth(l).map(([x, y]) => {
          const q = px(f, x, y)
          return [q.x, q.y] as Point
        }),
      ),
    ),
  }
})

// Bâtir: my land later on, its works, a castle in hand.
const lateMine = landOf(late, ME)
const lateMiddle = middleOf(lateMine)
const gold = Math.max(
  Math.floor(late.players[ME].gold / UNIT),
  priceOf(late, ME, 'castle') + 140,
)
const builder: GameState = structuredClone(late)
builder.players[ME].gold = gold * UNIT
const build = frame('build', lateMiddle.x, lateMiddle.y, 560, builder)
svg(build)
const myHeart = heartsOf(late).get(ME)
const ghostTile = (() => {
  const others = late.works.filter((w) => w.owner === ME)
  let best = lateMine[0]
  let score = -Infinity
  for (const t of lateMine) {
    if (!canBuild(late, ME, t)) continue
    if (myHeart !== undefined && dist(t, myHeart) < 90) continue
    const p = tpx(build, t)
    if (p.x < 440 || p.x > 980 || p.y < 330 || p.y > 600) continue
    if (!four(t).every((n) => late.owner[n] === ME)) continue
    const room = Math.min(...late.works.map((w) => dist(w.tile, t)))
    const sc =
      Math.min(room, GAP * 1.6) -
      Math.hypot(p.x - 700, p.y - 470) / 8 +
      (others.length ? 0 : 0)
    if (sc > score) {
      score = sc
      best = t
    }
  }
  return best
})()
data.build = {
  ...layer(build, [], 'castle'),
  ghost: tpx(build, ghostTile),
  gap: +(GAP / build.k).toFixed(1),
  castleR: +(CASTLE_R / build.k).toFixed(1),
  land: path(
    cornersOf((t) => late.owner[t] === ME).map((l) =>
      smooth(l).map(([x, y]) => {
        const q = px(build, x, y)
        return [q.x, q.y] as Point
      }),
    ),
  ),
}

data.facts = {
  seed: SEED,
  me: { name: nameOf(ME), color: colorOf(ME) },
  foe: { id: FOE, name: nameOf(FOE), color: colorOf(FOE) },
  hoverLord: {
    id: hoverLord,
    name: nameOf(hoverLord),
    color: colorOf(hoverLord),
  },
  rival: { id: RIVAL, name: nameOf(RIVAL), color: colorOf(RIVAL) },
  moments: { t0: clock(atAim), mid: clock(mid), late: clock(late) },
  rules: {
    castleR: CASTLE_R,
    gap: GAP,
    tile: TILE,
    pace: RULES.paceTiles,
    fill: RULES.fillSeconds,
  },
  hostsMid: mid.hosts.map((h) => [
    nameOf(h.owner),
    h.target >= 0 ? nameOf(h.target) : 'libre',
    Math.floor(h.men / UNIT),
  ]),
  front: fronts.map(({ s }) => {
    const h = myHost(s)
    return h
      ? [
          Math.floor(h.men / UNIT),
          s.owner.filter((o, t) => o === ME && launch[t] === FOE).length,
        ]
      : null
  }),
  armies: spent.map((a) => [a.army, a.men, a.ticks]),
  free: mid.owner.filter((o) => o === NEUTRAL).length,
  freeTile,
  offer: nameOf(OFFER),
  traitor: TRAITOR >= 0 ? [nameOf(TRAITOR), nameOf(BETRAYED)] : null,
  allies: myAllies.map(nameOf),
  market: marketTile,
  foreignMarkets: foreignMarkets.length,
  caravansMid: mid.caravans.map((c) => [
    nameOf(c.owner),
    nameOf(c.to),
    c.road.length,
    c.along,
  ]),
  pactView: [pactView.w, pactView.k],
}
writeFileSync(`${OUT}/data.json`, JSON.stringify(data))
console.log(JSON.stringify(data.facts))
