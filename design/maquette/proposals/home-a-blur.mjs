import { capture } from './hud.js'

// The home's land behind it (« la carte de la partie publique nette dans sa
// section, et le reste de la terre flouté derrière », then « y'a qu'une map
// et la section montre la map au centre par rapport à sa position, pour
// faire une continuité »): one land under the whole page, blurred and washed
// into the parchment, and the public game's card a window on it, sharp, the
// very part of the land under it, so that the eye follows the land from the
// card out to the page's edges.

const html = capture('home-1920x1080')

/** The land as the card shows it, its picture. */
const land = html.match(
  /<img role="img" aria-label="La terre de la partie en cours de pose"[^>]*src="([^"]+)"/,
)[1]

/** The page's frame, kept, the land laid under it. */
const FRAME =
  'main > div[aria-hidden="true"].pointer-events-none.absolute:first-child'
const frame = html.match(
  /<main[^>]*>(<div aria-hidden="true" class="pointer-events-none absolute inset-2 sm:inset-3">[\s\S]*?<\/div>)/,
)[1]

const under = `<div aria-hidden="true" class="mq-land"></div>`
/** The card's land, the same land seen through it where it lies. */
const PLATE = 'img[aria-label="La terre de la partie en cours de pose"]'
const window_ = `<div role="img" aria-label="La terre de la partie en cours de pose" class="mq-window"></div>`

export default {
  title: 'L’accueil, une seule terre',
  line: 'Une seule terre sous toute la page, floutée et fondue dans le parchemin ; la carte de la partie publique est une fenêtre nette dessus, la part même de la terre qui est sous elle : l’œil suit la terre de la carte jusqu’aux bords de la page.',
  moments: ['home'],
  replace: { [FRAME]: `${under}${frame}`, [PLATE]: window_ },
  css: `
.mq-land, .mq-window { background-image: url("${land}"); background-size: cover; background-position: center; background-attachment: fixed; }
.mq-land { position: absolute; inset: 0; pointer-events: none; }
.mq-land::before { content: ''; position: absolute; inset: 0; backdrop-filter: blur(9px) saturate(0.85); background: color-mix(in srgb, var(--color-vellum) 45%, transparent); }
.mq-window { position: absolute; inset: 0; }
`,
}
