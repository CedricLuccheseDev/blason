import { shield } from './lords.js'

// What the proposals of the lobby share (« dans les 2 cas on est en game »,
// then « y'a double, la modal et la barre du bas c'est bête »): one object
// and one button. The book of the game, open on two pages over the map,
// holds the lobby before the launch (the land, the seats, the invitation,
// the settings, « Lancer la partie ») and the game's menu after it; one
// round button over the camera's opens it at any time. The bar of the game
// is hidden while there is no game yet.

export const BAR =
  'div.w-max:has(button[aria-label="Chevauchée"], button[aria-label="Petite troupe"])'
export const PANEL = 'div.hud-enter:has(> div > span.hud-word.text-hud-l)'
/** The map's place: what is laid over the whole screen goes beside it, the map's image still put inside. */
export const MAP = 'main > [role="img"]'
const MAP_BACK =
  '<div class="absolute inset-0" role="img" aria-label="La terre de la partie, vue d’en haut"></div>'
export const over = (markup) => MAP_BACK + markup

const PLATE =
  'pointer-events-auto inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border-[1.5px] border-quill px-4 font-words text-hud-m shadow-lift hud-press'
export const act = (word, tone = 'gilt') =>
  `<button type="button" class="${PLATE} ${{ gilt: 'bg-gilt text-quill', plain: 'bg-vellum text-quill', gules: 'bg-gules text-wax' }[tone]}">${word}</button>`

const arrows = (value, live) =>
  live
    ? `<span class="mq-turn"><span class="mq-tip">‹</span><span class="hud-word">${value}</span><span class="mq-tip">›</span></span>`
    : `<span class="mq-turn"><span class="hud-word">${value}</span></span>`
const choice = (name, value, live) =>
  `<div class="mq-choice"><span class="mq-label">${name}</span>${arrows(value, live)}</div>`

const pennon = (numeral) =>
  `<svg viewBox="0 0 30 22" aria-hidden="true" style="width: calc(30px * var(--hud)); height: calc(22px * var(--hud));"><path d="M2 1 V21" stroke="var(--color-quill)" stroke-width="1.6"/><path d="M3 2 H28 L22 8 L28 14 H3 Z" fill="var(--color-gilt)" stroke="var(--color-quill)" stroke-width="1.4" stroke-linejoin="round"/><text x="12" y="11.5" text-anchor="middle" font-family="'Vollkorn SC', Georgia, serif" font-size="9" fill="var(--color-quill)">${numeral}</text></svg>`
const seat = (name, color, bot = false) =>
  `<div class="mq-seat${bot ? ' mq-bot' : ''}">${shield(color, 28)}<span>${name}</span></div>`
const team = (numeral, seats) =>
  `<div class="mq-team"><div class="mq-pennon">${pennon(numeral)}</div><div class="mq-row">${seats.join('')}</div></div>`
const BOT = 'var(--color-shade)'
const teams = (me) =>
  `<div class="mq-teams">${team('I', [seat(me === 'host' ? 'Toi' : 'Azur', '#2f6db5'), seat(me === 'guest' ? 'Toi' : 'Léa', '#3e8e41'), seat('bot', BOT, true), seat('bot', BOT, true)])}${team('II', [seat('Maxime', '#c0392b'), seat('bot', BOT, true), seat('bot', BOT, true), seat('bot', BOT, true)])}</div>`

/** An open book: the button that opens it, drawn small. */
export const BOOK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" style="width: calc(22px * var(--hud)); height: calc(22px * var(--hud));"><path d="M12 6.5 Q8 4 3 4.5 V18.5 Q8 18 12 20.5 Q16 18 21 18.5 V4.5 Q16 4 12 6.5 Z M12 6.5 V20.5" fill="var(--color-vellum)" stroke="var(--color-quill)" stroke-width="1.6" stroke-linejoin="round"/><path d="M5.5 8 Q8 7.6 10 8.6 M5.5 11 Q8 10.6 10 11.6 M14 8.6 Q16 7.6 18.5 8 M14 11.6 Q16 10.6 18.5 11" fill="none" stroke="var(--color-gilt)" stroke-width="1.2" stroke-linecap="round"/></svg>`
/** The book's button, over the camera's three: the same before and during the game. */
export const bookButton = (lit = false) =>
  `<button type="button" aria-label="Le livre de la partie" class="mq-book-button ${PLATE} ${lit ? 'bg-gilt' : 'bg-vellum'} text-quill">${BOOK_ICON}</button>`

/**
 * The book: `host` in the lobby (everything to choose, the invitation, the
 * launch), `guest` in the lobby (the host's choices, read; waiting), `game`
 * for the host once launched (the game going on, its settings for the next
 * land, « Recommencer », « Quitter »).
 */
export function book(mode, image) {
  const live = mode !== 'guest'
  const left =
    mode === 'game'
      ? `<header class="mq-head"><span class="mq-kicker">la partie en cours, depuis huit minutes</span><h2>La terre</h2><span class="mq-orn"><i></i><b></b><i></i></span></header>`
      : `<header class="mq-head"><span class="mq-kicker">${mode === 'host' ? 'Ta partie' : 'La partie d’Azur'}</span><h2>La terre</h2><span class="mq-orn"><i></i><b></b><i></i></span></header>`
  const invite =
    mode === 'host'
      ? `<div class="mq-invite"><span class="mq-label">Inviter</span><span class="hud-figure text-hud-l">K7Q2M</span>${act('Copier le lien', 'plain')}</div>`
      : ''
  const next =
    mode === 'game'
      ? '<p class="mq-note">Ces réglages vaudront pour la prochaine terre.</p>'
      : ''
  const kicker =
    mode === 'guest' ? 'tu es assis avec Azur' : 'trois joueurs, cinq bots'
  const foot = {
    host: `<span class="mq-quiet">Voir la carte</span>${act('Lancer la partie')}`,
    guest: `<span class="mq-wait"><span class="hud-word text-hud-m">En attente de l’hôte</span><span class="hud-note">Azur lancera la partie</span></span>${act('Quitter', 'plain')}`,
    game: `${act('Quitter la partie', 'plain')}${act('Recommencer')}`,
  }[mode]
  return `<div class="mq-veil"></div><div class="mq-book"><span aria-hidden="true" class="mq-gilt"></span>${mode === 'game' ? '<span class="mq-close">Fermer</span>' : ''}<div class="mq-pages"><section class="mq-page">${left}<div class="mq-plate"><img src="${image}" alt=""></div><p class="mq-name">La côte<span>, une terre de taille ordinaire</span></p><div class="mq-choices">${choice('Sa forme', 'La côte', live)}${choice('Sa taille', 'Standard', live)}</div>${live ? `<div class="mq-again"><span class="hud-note">ou</span> ${act('Une autre terre', 'plain')}</div>` : ''}</section><div class="mq-fold" aria-hidden="true"></div><section class="mq-page"><header class="mq-head"><span class="mq-kicker">${kicker}</span><h2>Les seigneurs</h2><span class="mq-orn"><i></i><b></b><i></i></span></header>${teams(mode === 'guest' ? 'guest' : 'host')}${invite}<div class="mq-choices">${choice('Les bots', 'Cinq', live)}${choice('Leur niveau', 'Moyens', live)}${choice('Les équipes', 'Deux', live)}${choice('La pose', 'Trente secondes', live)}</div>${next}</section></div><div class="mq-foot">${foot}</div></div>`
}

export const CSS = `
/* The veil darkens the whole screen, the HUD's pieces with the map: only the book stands above it. */
.mq-veil { position: absolute; inset: 0; z-index: 50; background: rgb(43 30 18 / 0.5); }
.mq-book { position: absolute; z-index: 51; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(calc(820px * var(--hud)), calc(100vw - 24px)); background: var(--color-vellum); border: 1.5px solid var(--color-quill); border-radius: 6px; box-shadow: 0 10px 30px rgb(43 30 18 / 0.45); padding: calc(26px * var(--hud)) calc(30px * var(--hud)) calc(20px * var(--hud)); display: flex; flex-direction: column; gap: calc(16px * var(--hud)); }
.mq-gilt { position: absolute; inset: 5px; border: 1px solid var(--color-gilt); border-radius: 3px; pointer-events: none; }
.mq-close { position: absolute; top: calc(14px * var(--hud)); right: calc(18px * var(--hud)); font-family: var(--font-words); font-style: italic; font-size: var(--text-hud-s); opacity: 0.65; }
.mq-pages { display: grid; grid-template-columns: 1fr auto 1fr; gap: calc(26px * var(--hud)); }
.mq-page { display: flex; flex-direction: column; gap: calc(12px * var(--hud)); min-width: 0; }
.mq-fold { width: 1px; background: var(--color-quill); opacity: 0.35; box-shadow: 3px 0 0 color-mix(in srgb, var(--color-gilt) 40%, transparent); }
.mq-head { display: flex; flex-direction: column; align-items: center; gap: calc(2px * var(--hud)); text-align: center; }
.mq-kicker { font-family: var(--font-words); font-style: italic; font-size: var(--text-hud-s); opacity: 0.7; }
.mq-head h2 { margin: 0; font-family: var(--font-caps); font-weight: 400; font-size: var(--text-hud-xl); letter-spacing: 0.02em; color: var(--color-quill); }
.mq-orn { display: flex; align-items: center; gap: calc(6px * var(--hud)); width: 60%; }
.mq-orn i { flex: 1; height: 1px; background: var(--color-gilt); }
.mq-orn b { width: calc(7px * var(--hud)); height: calc(7px * var(--hud)); transform: rotate(45deg); background: var(--color-gilt); border: 1px solid var(--color-quill); }
.mq-plate { padding: calc(5px * var(--hud)); border: 1.5px solid var(--color-quill); outline: 1px solid var(--color-gilt); outline-offset: calc(-4px * var(--hud)); }
.mq-plate img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }
.mq-name { margin: 0; text-align: center; font-family: var(--font-words); font-size: var(--text-hud-l); }
.mq-name span { font-style: italic; font-size: var(--text-hud-s); opacity: 0.75; }
.mq-choices { display: flex; flex-direction: column; gap: calc(6px * var(--hud)); }
.mq-choice, .mq-invite { display: flex; align-items: baseline; justify-content: space-between; gap: calc(10px * var(--hud)); padding-bottom: calc(5px * var(--hud)); border-bottom: 1px dotted color-mix(in srgb, var(--color-quill) 45%, transparent); }
.mq-invite { align-items: center; }
.mq-label { font-family: var(--font-words); font-style: italic; font-size: var(--text-hud-m); opacity: 0.8; }
.mq-turn { display: inline-flex; align-items: baseline; gap: calc(10px * var(--hud)); font-size: var(--text-hud-m); }
.mq-tip { font-family: var(--font-words); color: var(--color-gilt); font-size: var(--text-hud-l); line-height: 1; }
.mq-again { display: flex; align-items: center; justify-content: center; gap: calc(8px * var(--hud)); }
.mq-teams { display: flex; flex-direction: column; gap: calc(10px * var(--hud)); }
.mq-team { display: flex; align-items: flex-start; gap: calc(10px * var(--hud)); }
.mq-pennon { padding-top: calc(4px * var(--hud)); }
.mq-row { display: flex; gap: calc(10px * var(--hud)); }
.mq-seat { display: flex; flex-direction: column; align-items: center; gap: 2px; width: calc(44px * var(--hud)); font-family: var(--font-words); font-size: var(--text-hud-s); }
.mq-bot { opacity: 0.5; font-style: italic; }
.mq-note { margin: 0; font-family: var(--font-words); font-style: italic; font-size: var(--text-hud-s); opacity: 0.75; text-align: center; }
.mq-foot { display: flex; align-items: center; justify-content: center; gap: calc(18px * var(--hud)); padding-top: calc(10px * var(--hud)); border-top: 1px solid color-mix(in srgb, var(--color-gilt) 50%, transparent); }
.mq-foot button:last-child { min-width: calc(260px * var(--hud)); }
.mq-quiet { font-family: var(--font-words); font-style: italic; font-size: var(--text-hud-m); text-decoration: underline; text-underline-offset: 3px; opacity: 0.8; }
.mq-wait { display: flex; flex-direction: column; align-items: flex-end; }
.mq-book-button { position: absolute; right: calc(16px * var(--hud)); bottom: calc(196px * var(--hud)); width: calc(52px * var(--hud)); min-height: calc(52px * var(--hud)); padding: 0; }
@media (max-width: 640px) { .mq-book { top: 8px; transform: translateX(-50%); padding: 18px 16px; } .mq-pages { grid-template-columns: 1fr; } .mq-fold { display: none; } .mq-book-button { bottom: 180px; } }
`
