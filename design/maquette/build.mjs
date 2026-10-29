// The maquette: one page, maquette.html, where each moment of the game
// (moments.mjs) is shown at each size side by side, every frame the game
// itself as capture.mjs took it: in a frame of its real size, scaled down
// to fit, the map's image underneath and the HUD's markup on top, styled by
// the game's own CSS and fonts, so that it lays out as the game does at that
// size, pixel for pixel. The images stay beside the page, in captures/.
//   node design/maquette/build.mjs
//
// Proposals: a piece of the HUD drawn anew is shown beside the game's, on
// the same moments and sizes, from a module in proposals/ whose default
// export says what it replaces:
//   export default {
//     title: 'La barre, allégée',          // in French, as the page
//     line: 'Ce qui change, en une ligne.',
//     moments: ['war'],                     // all if none
//     replace: { 'main .col-start-2 > *': '<div class="…">…</div>' },
//     css: '…',                             // what the game's CSS lacks, if any
//   }
// Its markup is written in the game's own classes (the HUD's roles, the
// Tailwind utilities the game uses): once chosen, it is the piece's code.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { MOMENTS, SIZES } from './moments.mjs'

const HERE = new URL('./', import.meta.url)
const read = (path) => readFileSync(new URL(path, HERE), 'utf8')

/** The moments to build, all unless MOMENTS names some (MOMENTS=opening,war). */
const ONLY = process.env.MOMENTS?.split(',')

/** Each moment's frames, from the captures there are. */
function moments() {
  return MOMENTS.filter(({ name }) => !ONLY || ONLY.includes(name))
    .map(({ name, title, line }) => ({
      name,
      title,
      line,
      frames: SIZES.flatMap(([width, height]) => {
        const base = `captures/${name}-${width}x${height}`
        if (!existsSync(new URL(`${base}.html`, HERE))) return []
        return [
          { width, height, map: `${base}.webp`, hud: read(`${base}.html`) },
        ]
      }),
    }))
    .filter((moment) => moment.frames.length > 0)
}

async function proposals() {
  const folder = new URL('proposals/', HERE)
  if (!existsSync(folder)) return []
  const files = readdirSync(folder)
    .filter((f) => f.endsWith('.mjs'))
    .sort()
  return Promise.all(
    files.map(async (file) => ({
      name: file.replace(/\.mjs$/, ''),
      ...(await import(new URL(file, folder))).default,
    })),
  )
}

const data = {
  page: JSON.parse(read('captures/page.json')),
  css: read('captures/game.css'),
  moments: moments(),
  proposals: await proposals(),
}
// The data rides in the page as JSON: nothing in it may close its script.
const json = JSON.stringify(data).replace(/</g, '\\u003c')
const fonts =
  'https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@500;700;800&family=IM+Fell+English:ital@0;1&display=swap'

// Written as a page's content, as the artifacts it is published to wrap it
// in their own document (their head carries the charset and the viewport).
const html = `<title>Maquette de Blason</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>
${read('page.css')}
</style>
<header>
  <h1>Blason, la maquette</h1>
  <p>Chaque cadre est le jeu lui-même : la carte et le HUD d'une vraie partie, figée à un moment, à chaque taille d'écran. Un clic l'ouvre en grand.</p>
</header>
<main id="moments"></main>
<dialog id="large"><div class="large"></div><p class="large-name"></p></dialog>
<script type="application/json" id="data">${json}</script>
<script>
${read('page.js')}
</script>
`
writeFileSync(new URL('maquette.html', HERE), html)
const frames = data.moments.reduce((n, m) => n + m.frames.length, 0)
console.log(
  `maquette.html: ${data.moments.length} moments, ${frames} frames, ${data.proposals.length} proposals, ${(html.length / 1024).toFixed(0)} KB`,
)
