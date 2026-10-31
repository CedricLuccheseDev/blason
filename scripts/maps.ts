import { writeFileSync } from 'node:fs'
import {
  RULES,
  botsSetup,
  createGame,
  generateWorld,
  makeGrid,
} from '../engine'
import type { Generator, MapSize, Point, World } from '../engine'

// The maps' board: for each family of lands, the first generator's land and
// the relief generator's from the same seed, at the standard size, then
// larger lands of the second; drawn as the planches are, parchment and ink,
// the high mountains hatched apart from the sea, the rivers, the passes in
// gilt; under each, its tiles, its land and its passes. One HTML page, its
// maps in SVG, to judge a generator by eye before it replaces another.
// npm run maps -- <board.html>

/** For each family, the seed the first board drew it with. */
const FAMILIES: ReadonlyArray<{ seed: string; name: string; line: string }> = [
  {
    seed: 'carte-3',
    name: 'Le continent',
    line: 'Une terre que la mer entoure.',
  },
  { seed: 'carte-0', name: 'La côte', line: "La mer d'un seul côté." },
  {
    seed: 'carte-2',
    name: 'La mer intérieure',
    line: 'Une mer au milieu, la terre tout autour.',
  },
  {
    seed: 'carte-1',
    name: 'Deux terres et un isthme',
    line: 'Deux terres reliées par un passage étroit.',
  },
  {
    seed: 'carte-4',
    name: 'La bande',
    line: 'Une terre en long entre deux mers.',
  },
  {
    seed: 'carte-22',
    name: 'Les fjords',
    line: 'Une terre découpée de longs bras de mer.',
  },
]

const LARGER: ReadonlyArray<{ seed: string; size: MapSize }> = [
  { seed: 'carte-13', size: 'large' },
  { seed: 'carte-5', size: 'huge' },
]

const TONE: Record<string, string> = {
  plain: '#efe3c4',
  forest: '#dfdcb4',
  hills: '#e6d3a8',
  mountains: '#d9c08f',
}

const n = (v: number) => Math.round(v)

/** A line through points, in whole map units and relative steps, to keep the page light. */
function path(points: ReadonlyArray<Point>, close: boolean): string {
  let [x, y] = [n(points[0][0]), n(points[0][1])]
  let d = `M${x} ${y}`
  for (const p of points.slice(1)) {
    const [px, py] = [n(p[0]), n(p[1])]
    if (px === x && py === y) continue
    d += `l${px - x} ${py - y}`
    ;[x, y] = [px, py]
  }
  return close ? `${d}z` : d
}

/** A map's figures: its tiles, its land, how much the game keeps, its high mountains and its passes. */
function figures(world: World) {
  const grid = makeGrid(
    world.map,
    world.width,
    world.height,
    RULES.tileSize,
    world.rivers,
  )
  const game = createGame(grid, botsSetup(world))
  // The mountains' tiles: the land there would be, were they land.
  const open = makeGrid(
    {
      land: [
        ...world.map.land,
        ...world.map.peaks.map((p) => ({ ...p, neighbors: [], shore: [] })),
      ],
      sea: world.map.sea,
      peaks: [],
      dead: world.map.dead,
    },
    world.width,
    world.height,
    RULES.tileSize,
    world.rivers,
  )
  return {
    tiles: grid.width * grid.height,
    land: game.grid.area,
    kept: game.grid.area / grid.area,
    peaks: open.area - grid.area,
    passes: world.passes.length,
  }
}

const thousands = (v: number) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

function caption(world: World, generator: Generator): string {
  const f = figures(world)
  const kept =
    f.kept === 1
      ? "d'un seul tenant"
      : `${(f.kept * 100).toFixed(1).replace('.', ',')} % d'un tenant`
  const mountains =
    generator === 'classic'
      ? 'montagnes dessinées seulement'
      : `${thousands(f.peaks)} tuiles de montagne, ${f.passes} cols`
  return `${thousands(f.tiles)} tuiles, ${thousands(f.land)} de terre jouable ${kept}, ${mountains}`
}

function svg(world: World): string {
  const groups = new Map<string, Array<string>>()
  for (const cell of world.land) {
    const list = groups.get(cell.biome) ?? []
    list.push(path(cell.outline, true))
    groups.set(cell.biome, list)
  }
  const land = [...groups]
    .map(
      ([biome, d]) =>
        `<path fill="${TONE[biome]}" stroke="${TONE[biome]}" stroke-width="1.5" d="${d.join('')}"/>`,
    )
    .join('')
  const rock = world.peaks.map((c) => path(c.outline, true)).join('')
  const glyphs = world.map.peaks
    .map((p) => `M${p.x - 6} ${p.y + 4}l6 -10l6 10`)
    .join('')
  const coast = world.coast.map((r) => path(r, false)).join('')
  const rivers = world.rivers.map((r) => path(r, false)).join('')
  const passes = world.passes
    .map((p) => `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="10"/>`)
    .join('')
  const ink = Math.max(2.4, world.width / 600)
  return [
    `<svg viewBox="0 0 ${world.width} ${world.height}" xmlns="http://www.w3.org/2000/svg">`,
    `<rect width="${world.width}" height="${world.height}" fill="#cfd8c9"/>`,
    land,
    rock &&
      `<path fill="url(#rock)" stroke="#a48f6e" stroke-width="1.5" d="${rock}"/>`,
    glyphs &&
      `<path fill="none" stroke="#4a3a28" stroke-width="2.2" stroke-linejoin="round" d="${glyphs}"/>`,
    `<path fill="none" stroke="#3f6a8a" stroke-width="${(ink * 0.8).toFixed(1)}" stroke-linecap="round" d="${rivers}"/>`,
    `<path fill="none" stroke="#2b1e12" stroke-width="${ink.toFixed(1)}" stroke-linejoin="round" d="${coast}"/>`,
    passes &&
      `<g fill="#8a5f0f" stroke="#f6eedb" stroke-width="3">${passes}</g>`,
    '</svg>',
  ].join('')
}

function figure(world: World, generator: Generator, label: string): string {
  return `<figure><div class="map">${svg(world)}</div><figcaption><b>${label}</b> · ${caption(world, generator)}</figcaption></figure>`
}

const out = process.argv[2]
if (!out) throw new Error('npm run maps -- <board.html>')

const families = FAMILIES.map(({ seed, name, line }, i) => {
  const today = generateWorld(seed)
  const relief = generateWorld(seed, { generator: 'relief' })
  return `<section class="family"><div class="head"><span class="n">${i + 1}</span><div><h2>${name}</h2><p>${line} Graine « ${seed} ».</p></div></div><div class="pair">${figure(today, 'classic', "Aujourd'hui")}${figure(relief, 'relief', 'Le relief')}</div></section>`
})
const larger = LARGER.map(({ seed, size }) => {
  const world = generateWorld(seed, { size, generator: 'relief' })
  const label = size === 'large' ? 'Grande terre' : 'Très grande terre'
  return `<section class="family"><div class="head"><span class="n">${size === 'large' ? '×2' : '×4'}</span><div><h2>${label}</h2><p>Le relief, ${size === 'large' ? 'deux' : 'quatre'} fois la terre standard. Graine « ${seed} ».</p></div></div>${figure(world, 'relief', label)}</section>`
})

const page = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cartes du relief</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Alegreya+Sans:wght@500;700&display=swap">
<style>
:root { color-scheme: light; --vellum: #f6eedb; --quill: #2b1e12; --lead: #5e5749; --shade: #d9c49a; --gilt: #8a5f0f;
  --fell: 'IM Fell English', Georgia, serif; --figures: 'Alegreya Sans', 'Trebuchet MS', sans-serif; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--vellum); color: var(--quill); font-family: var(--fell); }
.page { max-width: 1240px; margin: 0 auto; padding: 40px max(16px, env(safe-area-inset-right, 0px)) 56px max(16px, env(safe-area-inset-left, 0px)); display: flex; flex-direction: column; gap: 32px; }
header h1 { margin: 0; font-size: 36px; font-weight: 400; text-wrap: balance; }
header p { margin: 8px 0 0; max-width: 72ch; color: var(--lead); font-size: 18px; font-style: italic; line-height: 1.4; }
.legend { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-top: 14px; font-family: var(--figures); font-size: 14px; color: var(--lead); }
.legend span { display: inline-flex; align-items: center; gap: 8px; }
.legend svg { width: 28px; height: 16px; border: 1px solid var(--quill); }
.family { display: flex; flex-direction: column; gap: 14px; padding-top: 24px; border-top: 1px solid var(--shade); }
.head { display: flex; gap: 14px; align-items: baseline; }
.n { font-family: var(--figures); font-weight: 700; font-size: 15px; color: var(--gilt); min-width: 1.6em; }
h2 { margin: 0; font-size: 26px; font-weight: 400; }
.head p { margin: 2px 0 0; color: var(--lead); font-size: 17px; font-style: italic; }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
figure { margin: 0; min-width: 0; }
.map { border: 1px solid var(--quill); box-shadow: 0 2px 4px rgb(43 30 18 / 0.25); background: #cfd8c9; }
.map svg { display: block; width: 100%; height: auto; }
figcaption { margin-top: 6px; font-family: var(--figures); font-size: 14px; color: var(--lead); line-height: 1.35; }
figcaption b { color: var(--quill); }
@media (max-width: 720px) { .page { padding-top: 24px; } .pair { grid-template-columns: 1fr; } }
</style></head><body>
<svg width="0" height="0" style="position:absolute"><defs><pattern id="rock" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="11" height="11" fill="#b8a585"/><line x1="0" y1="0" x2="0" y2="11" stroke="#6b5840" stroke-width="3"/></pattern></defs></svg>
<div class="page">
<header><h1>Le relief, à côté des cartes d'aujourd'hui</h1>
<p>À gauche, la terre du générateur actuel ; à droite, celle du nouveau, tirée de la même graine : une terre élevée comme une vraie, ses masses, ses chaînes, ses golfes et ses péninsules, l'eau qui creuse ses vallées jusqu'à la mer, et les hautes montagnes, qu'on ne prend ni ne traverse, coupées de cols. La terre reste d'un seul tenant par les cols.</p>
<div class="legend">
<span><svg viewBox="0 0 28 16"><rect width="28" height="16" fill="#efe3c4"/></svg>terre</span>
<span><svg viewBox="0 0 28 16"><rect width="28" height="16" fill="#cfd8c9"/></svg>mer et lacs</span>
<span><svg viewBox="0 0 28 16"><rect width="28" height="16" fill="url(#rock)"/><path d="M8 12l6 -9l6 9" fill="none" stroke="#4a3a28" stroke-width="1.6"/></svg>hautes montagnes, fermées comme la mer</span>
<span><svg viewBox="0 0 28 16"><rect width="28" height="16" fill="#efe3c4"/><circle cx="14" cy="8" r="5" fill="#8a5f0f" stroke="#f6eedb" stroke-width="1.5"/></svg>col</span>
<span><svg viewBox="0 0 28 16"><rect width="28" height="16" fill="#efe3c4"/><path d="M2 12q8 -10 24 -6" fill="none" stroke="#3f6a8a" stroke-width="2"/></svg>rivière</span>
<span><svg viewBox="0 0 28 16"><rect width="14" height="16" fill="#dfdcb4"/><rect x="14" width="14" height="16" fill="#e6d3a8"/></svg>bois, collines</span>
</div></header>
${families.join('\n')}
${larger.join('\n')}
</div></body></html>
`
writeFileSync(out, page)
process.stdout.write(`${out}: ${(page.length / 1e6).toFixed(1)} MB\n`)
