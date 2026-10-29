// The boards of the maquette, as a studio's, made again from the game as it
// now stands, in one command:
//   npm run planches -- [--no-take] [--out <dir>] [board ...]
// First what they show is taken again (take.mjs: the moments saved anew, the
// game and the relay served, the captures and the pieces), unless --no-take
// lays them out from the captures there are. Then each board of boards.mjs
// is laid out as a page of 1920 by 1080 in the game's own matter (board.css),
// its screens the game itself as captured (frame.js), its notes drawn to the
// pieces they name (board.js), and exported to PNG in a headless Chrome, into
// the vault by default (Maquette/NN-name.png); last, the vault's note that
// shows them (Maquette.md, beside the folder). Boards named are made alone.
// The pages are served to the browser from here, under a name of their own,
// so that each screen's frame is a document of the board's origin, whose
// pieces the notes can find; a note whose piece is not found is said, and
// its board drawn without it.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { launch } from './browser.mjs'
import { BOARDS } from './boards.mjs'
import { take } from './take.mjs'

const HERE = new URL('./', import.meta.url)
const ORIGIN = 'https://planches.blason'
const VAULT = '/mnt/gdrive/1 - Projects/Blason/Maquette'
/** The board's own size, and the cover's art, taken from a desk's screen. */
const SIZE = [1920, 1080]

const read = (path) => readFileSync(new URL(path, HERE), 'utf8')

function options(args) {
  const at = args.indexOf('--out')
  const out = at < 0 ? VAULT : args[at + 1]
  const names = args.filter(
    (a, i) => !a.startsWith('--') && (at < 0 || i !== at + 1),
  )
  return { out, names, taken: !args.includes('--no-take') }
}

/** A board's number, two figures. */
const numberOf = (index) => String(index + 1).padStart(2, '0')

/** A board's file: its number and its name. */
const fileOf = (board, index) => `${numberOf(index)}-${board.name}.png`

/** The captures a board shows: each moment and its sizes. */
function capturesOf(board) {
  const shown = [
    ...(board.screens ?? []),
    ...(board.art ? [{ moment: board.art, size: SIZE }] : []),
    ...(board.pieces ? [board.pieces.from] : []),
  ]
  return shown.map(({ moment, size }) => [moment, size.join('x')])
}

/** What the boards need taken: each moment at the sizes they show it. */
function needs(boards) {
  const all = {}
  for (const [moment, size] of boards.flatMap(capturesOf))
    all[moment] = [...new Set([...(all[moment] ?? []), size])]
  return all
}

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
    art: board.art && `captures/${board.art}-${SIZE.join('x')}.webp`,
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
  return {
    board: shown,
    page: JSON.parse(read('captures/page.json')),
    css: read('captures/game.css'),
    when: `Tirée du jeu le ${today()}`,
  }
}

const today = () =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date())

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

/** Each board laid out and exported to its PNG in `out`; what was missing, said. */
async function exportBoards(chosen, out) {
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
      viewport: { width: SIZE[0], height: SIZE[1] },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    await serve(page, pages)
    for (const { board, index } of chosen) {
      await page.goto(`${ORIGIN}/${numberOf(index)}.html`)
      await page.waitForSelector('body[data-ready]', { timeout: 120_000 })
      const missing = await page.evaluate(() => window.missing)
      await page.screenshot({ path: join(out, fileOf(board, index)) })
      console.log(fileOf(board, index))
      for (const what of missing) console.error(`  missing ${what}`)
    }
  } finally {
    await browser.close()
  }
}

/** The vault's note beside the boards' folder: a title, what they are, and each board with its line. */
function writeNote(out) {
  const folder = basename(out)
  const boards = BOARDS.map(
    (board, index) =>
      `![[${folder}/${fileOf(board, index)}]]\n${board.line.replace(/\.?$/, '.')}`,
  )
  const note = `# Maquette

Les planches de Blason, tirées du jeu lui-même : chaque écran est une vraie partie de bots figée à un moment, son interface rendue par le code du jeu, et une commande les refait après chaque changement (\`npm run planches\`, dernière fois le ${today()}).

${boards.join('\n\n')}
`
  writeFileSync(join(dirname(out), `${folder}.md`), note)
}

const { out, names, taken } = options(process.argv.slice(2))
const chosen = BOARDS.flatMap((board, index) =>
  names.length === 0 || names.includes(board.name) ? [{ board, index }] : [],
)
if (taken) await take(needs(chosen.map(({ board }) => board)))
await exportBoards(chosen, out)
writeNote(out)
