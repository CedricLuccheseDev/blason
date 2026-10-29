// The boards of the maquette, as a studio's: each board of boards.mjs laid
// out as a page of 1920 by 1080 in the game's own matter (board.css), its
// screens the game itself as captured (frame.js), its notes drawn to the
// pieces they name (board.js), then exported to PNG in a headless Chrome,
// into the vault by default:
//   node design/maquette/planches.mjs [--out <dir>] [board ...]
// The boards are served to the browser from here, under a name of their own,
// so that each screen's frame is a document of the board's origin, whose
// pieces the notes can find. A note whose piece is not found is said, and
// the board drawn without it.

import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { launch } from './browser.mjs'
import { BOARDS } from './boards.mjs'

const HERE = new URL('./', import.meta.url)
const ORIGIN = 'https://planches.blason'
const VAULT = '/mnt/gdrive/1 - Projects/Blason/Maquette'

const read = (path) => readFileSync(new URL(path, HERE), 'utf8')

function options(args) {
  const at = args.indexOf('--out')
  const out = at < 0 ? VAULT : args[at + 1]
  const names = args.filter((a, i) => a !== '--out' && i !== at + 1)
  return { out, names }
}

/** A board's number, two figures. */
const numberOf = (index) => String(index + 1).padStart(2, '0')

/** A board's file: its number and its name. */
const fileOf = (board, index) => `${numberOf(index)}-${board.name}.png`

/** A capture as a frame: its HUD's markup, its map's image, its size. */
function frameOf(moment, [width, height]) {
  const base = `captures/${moment}-${width}x${height}`
  return { hud: read(`${base}.html`), map: `${base}.webp`, width, height }
}

/** What the board's page is drawn from: the board, its screens' frames, the game's CSS and page. */
function boardData(board, index) {
  const shown = {
    ...board,
    number: numberOf(index),
    art: board.art && `captures/${board.art}-1920x1080.webp`,
    screens: (board.screens ?? []).map((s) => ({
      ...s,
      frame: frameOf(s.moment, s.size),
    })),
    pieces: board.pieces && {
      markup: read('captures/pieces.html'),
      from: frameOf(board.pieces.from.moment, board.pieces.from.size).hud,
      slots: board.pieces.slots,
    },
  }
  const when = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(
    new Date(),
  )
  return {
    board: shown,
    page: JSON.parse(read('captures/page.json')),
    css: read('captures/game.css'),
    when: `Tirée du jeu le ${when}`,
  }
}

const FONTS =
  'https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@700;800&family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&display=swap'

function boardPage(data) {
  // The data rides in the page as JSON: nothing in it may close its script.
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${data.board.number} ${data.board.title}</title>
<link rel="stylesheet" href="${FONTS}">
<style>
${read('board.css')}
</style>
</head>
<body>
<script type="application/json" id="data">${json}</script>
<script>
${read('frame.js')}
${read('board.js')}
</script>
</body>
</html>
`
}

const TYPES = { webp: 'image/webp', png: 'image/png', html: 'text/html' }

/** The boards' pages and the captures, served under the boards' origin. */
async function serve(page, pages) {
  await page.route(`${ORIGIN}/**`, (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname)
    const name = path.slice(1)
    if (pages.has(name))
      return route.fulfill({ contentType: TYPES.html, body: pages.get(name) })
    try {
      const body = readFileSync(new URL(name, HERE))
      const type = TYPES[name.split('.').pop()] ?? 'application/octet-stream'
      return route.fulfill({ contentType: type, body })
    } catch {
      return route.fulfill({ status: 404, body: '' })
    }
  })
}

const { out, names } = options(process.argv.slice(2))
const chosen = BOARDS.flatMap((board, index) =>
  names.length === 0 || names.includes(board.name) ? [{ board, index }] : [],
)
mkdirSync(out, { recursive: true })
const pages = new Map(
  chosen.map(({ board, index }) => [
    `${numberOf(index)}.html`,
    boardPage(boardData(board, index)),
  ]),
)
const browser = await launch()
try {
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  await serve(page, pages)
  for (const { board, index } of chosen) {
    await page.goto(`${ORIGIN}/${numberOf(index)}.html`)
    await page.waitForSelector('body[data-ready]', { timeout: 120_000 })
    const missing = await page.evaluate(() => window.missing)
    const file = join(out, fileOf(board, index))
    await page.screenshot({ path: file })
    console.log(`${fileOf(board, index)}`)
    for (const what of missing) console.error(`  missing ${what}`)
  }
} finally {
  await browser.close()
}
