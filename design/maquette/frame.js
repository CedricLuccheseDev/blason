// A frame of the maquette as a document of its own, built in the browser
// from a capture (capture.mjs): the game's page round its HUD, the map's
// image in the map's place, the game's CSS and fonts, so that the HUD lays
// out as the game laid it at that size; a proposal's pieces, if one is
// given, in the place of the game's. The maquette's page (page.js) and the
// boards (board.js) both build their frames so.

/** The frames stand still: each motion of the HUD held where it reads, a pennant shown, a seal at its glow. */
const STILL = `
*, *::before, *::after { transition: none !important; }
.hud-enter, .rise-in, .fade-in { animation: none !important; }
.hud-life { animation-delay: -2s !important; animation-play-state: paused !important; }
.hud-glow { animation-delay: -0.7s !important; animation-play-state: paused !important; }
.hud-bob { animation-play-state: paused !important; }
`

const quote = (text) =>
  text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const attributes = (all) =>
  Object.entries(all)
    .map(([name, value]) => ` ${name}="${quote(value)}"`)
    .join('')

/** A frame's document: `frame` a capture ({ hud, map }), `page` the document round the HUD and `css` the game's, as captured; `extra` more of the head. */
function frameDocument(frame, { page, css, proposal, extra = '' }) {
  const doc = new DOMParser().parseFromString(frame.hud, 'text/html')
  for (const [selector, markup] of Object.entries(proposal?.replace ?? {}))
    for (const piece of doc.body.querySelectorAll(selector))
      piece.outerHTML = markup
  // The map's place, marked so by the capture (the game's map, or the game
  // playing behind the home); the first captures knew only the game's.
  const map =
    doc.body.querySelector('[data-map]') ??
    doc.body.querySelector('main > [role="img"]')
  if (map && frame.map) {
    const image = doc.createElement('img')
    image.setAttribute('src', frame.map)
    image.setAttribute('alt', '')
    image.setAttribute('style', 'display:block;width:100%;height:100%')
    map.replaceChildren(image)
  }
  const fonts = page.fonts
    .map((href) => `<link rel="stylesheet" href="${quote(href)}">`)
    .join('')
  const own = proposal?.css ? `<style>${proposal.css}</style>` : ''
  return `<!doctype html><html${attributes(page.html)}><head><meta charset="utf-8">${fonts}<style>${css}</style><style>${STILL}</style>${own}${extra}</head><body${attributes(page.body)}>${doc.body.innerHTML}</body></html>`
}
