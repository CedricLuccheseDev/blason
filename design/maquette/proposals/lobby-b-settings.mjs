import { shield } from './lords.js'
import { BAR, CSS, PANEL, act } from './lobby.js'
import hostLobby from './lobby-a-host.mjs'

// « Configurer » opened, drawn as the game's own object (« je la trouve
// moche »: the first ones read as a website's form): the book of the game,
// open on two pages over the map. On the left, the land: its preview framed
// as an illumination, its name written under it, its kind and size. On the
// right, the lords: the seats under their teams' pennons, each shield with
// its name, then the bots, their level, the teams and the opening. Each
// choice a value between two small arrows, as a page turned; one button to
// launch across the fold.

const arrows = (value) =>
  `<span class="mq-turn"><span class="mq-tip">‹</span><span class="hud-word">${value}</span><span class="mq-tip">›</span></span>`

const choice = (name, value) =>
  `<div class="mq-choice"><span class="mq-label">${name}</span>${arrows(value)}</div>`

const pennon = (numeral) =>
  `<svg viewBox="0 0 30 22" aria-hidden="true" style="width: calc(30px * var(--hud)); height: calc(22px * var(--hud));"><path d="M2 1 V21" stroke="var(--color-quill)" stroke-width="1.6"/><path d="M3 2 H28 L22 8 L28 14 H3 Z" fill="var(--color-gilt)" stroke="var(--color-quill)" stroke-width="1.4" stroke-linejoin="round"/><text x="12" y="11.5" text-anchor="middle" font-family="'IM Fell English SC', Georgia, serif" font-size="9" fill="var(--color-quill)">${numeral}</text></svg>`

const seat = (name, color, bot = false) =>
  `<div class="mq-seat${bot ? ' mq-bot' : ''}">${shield(color, 28)}<span>${name}</span></div>`

const team = (numeral, seats) =>
  `<div class="mq-team"><div class="mq-pennon">${pennon(numeral)}</div><div class="mq-row">${seats.join('')}</div></div>`

const BOT = 'var(--color-shade)'
const company = `<div class="mq-teams">${team('I', [seat('Toi', '#2f6db5'), seat('Léa', '#3e8e41'), seat('bot', BOT, true), seat('bot', BOT, true)])}${team('II', [seat('Maxime', '#c0392b'), seat('bot', BOT, true), seat('bot', BOT, true), seat('bot', BOT, true)])}</div>`

const book = `<div class="mq-veil"></div><div class="mq-book"><span aria-hidden="true" class="mq-gilt"></span><span class="mq-close">Fermer</span><div class="mq-pages"><section class="mq-page"><header class="mq-head"><span class="mq-kicker">Ta partie</span><h2>La terre</h2><span class="mq-orn"><i></i><b></b><i></i></span></header><div class="mq-plate"><img src="captures/opening-1920x1080.webp" alt=""></div><p class="mq-name">La côte<span>, une terre de taille ordinaire</span></p><div class="mq-choices">${choice('Sa forme', 'La côte')}${choice('Sa taille', 'Standard')}</div><div class="mq-again"><span class="hud-note">ou</span> ${act('Une autre terre', 'plain')}</div></section><div class="mq-fold" aria-hidden="true"></div><section class="mq-page"><header class="mq-head"><span class="mq-kicker">trois joueurs, cinq bots</span><h2>Les seigneurs</h2><span class="mq-orn"><i></i><b></b><i></i></span></header>${company}<div class="mq-choices">${choice('Les bots', 'Cinq')}${choice('Leur niveau', 'Moyens')}${choice('Les équipes', 'Deux')}${choice('La pose', 'Trente secondes')}</div></section></div><div class="mq-foot">${act('Lancer la partie')}</div></div>`

export default {
  title: 'La configuration de la partie, en livre',
  line: '« Configurer » ouvre le livre de la partie sur deux pages : la terre à gauche (son aperçu en enluminure, sa forme, sa taille, une autre au sort), les seigneurs à droite (les sièges sous leurs bannières, les bots, leur niveau, les équipes, la pose) ; chaque choix une valeur entre deux flèches ; « Lancer la partie » en bas.',
  moments: ['opening'],
  // The book and its veil lie over the whole screen, beside the count's panel.
  replace: {
    [BAR]: hostLobby.replace[BAR],
    [PANEL]: hostLobby.replace[PANEL] + book,
  },
  css: `${CSS}
.mq-veil { position: absolute; inset: 0; background: rgb(43 30 18 / 0.45); }
.mq-book { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(calc(820px * var(--hud)), calc(100vw - 24px)); background: var(--color-vellum); border: 1.5px solid var(--color-quill); border-radius: 6px; box-shadow: 0 10px 30px rgb(43 30 18 / 0.45); padding: calc(26px * var(--hud)) calc(30px * var(--hud)) calc(22px * var(--hud)); display: flex; flex-direction: column; gap: calc(16px * var(--hud)); }
.mq-gilt { position: absolute; inset: 5px; border: 1px solid var(--color-gilt); border-radius: 3px; pointer-events: none; }
.mq-close { position: absolute; top: calc(14px * var(--hud)); right: calc(18px * var(--hud)); font-family: var(--font-fell, 'IM Fell English'), Georgia, serif; font-style: italic; font-size: var(--text-hud-s); color: var(--color-quill); opacity: 0.65; }
.mq-pages { display: grid; grid-template-columns: 1fr auto 1fr; gap: calc(26px * var(--hud)); }
.mq-page { display: flex; flex-direction: column; gap: calc(12px * var(--hud)); min-width: 0; }
.mq-fold { width: 1px; background: var(--color-quill); opacity: 0.35; box-shadow: 3px 0 0 color-mix(in srgb, var(--color-gilt) 40%, transparent); }
.mq-head { display: flex; flex-direction: column; align-items: center; gap: calc(2px * var(--hud)); text-align: center; }
.mq-kicker { font-family: 'IM Fell English', Georgia, serif; font-style: italic; font-size: var(--text-hud-s); opacity: 0.7; }
.mq-head h2 { margin: 0; font-family: 'IM Fell English SC', 'IM Fell English', Georgia, serif; font-weight: 400; font-size: var(--text-hud-xl); letter-spacing: 0.02em; color: var(--color-quill); }
.mq-orn { display: flex; align-items: center; gap: calc(6px * var(--hud)); width: 60%; }
.mq-orn i { flex: 1; height: 1px; background: var(--color-gilt); }
.mq-orn b { width: calc(7px * var(--hud)); height: calc(7px * var(--hud)); transform: rotate(45deg); background: var(--color-gilt); border: 1px solid var(--color-quill); }
.mq-plate { padding: calc(5px * var(--hud)); border: 1.5px solid var(--color-quill); outline: 1px solid var(--color-gilt); outline-offset: calc(-4px * var(--hud)); }
.mq-plate img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }
.mq-name { margin: 0; text-align: center; font-family: 'IM Fell English', Georgia, serif; font-size: var(--text-hud-l); color: var(--color-quill); }
.mq-name span { font-style: italic; font-size: var(--text-hud-s); opacity: 0.75; }
.mq-choices { display: flex; flex-direction: column; gap: calc(6px * var(--hud)); }
.mq-choice { display: flex; align-items: baseline; justify-content: space-between; gap: calc(10px * var(--hud)); padding-bottom: calc(5px * var(--hud)); border-bottom: 1px dotted color-mix(in srgb, var(--color-quill) 45%, transparent); }
.mq-label { font-family: 'IM Fell English', Georgia, serif; font-style: italic; font-size: var(--text-hud-m); color: var(--color-quill); opacity: 0.8; }
.mq-turn { display: inline-flex; align-items: baseline; gap: calc(10px * var(--hud)); font-size: var(--text-hud-m); }
.mq-tip { font-family: 'IM Fell English', Georgia, serif; color: var(--color-gilt-deep, var(--color-gilt)); font-size: var(--text-hud-l); line-height: 1; }
.mq-again { display: flex; align-items: center; justify-content: center; gap: calc(8px * var(--hud)); }
.mq-teams { display: flex; flex-direction: column; gap: calc(10px * var(--hud)); }
.mq-team { display: flex; align-items: flex-start; gap: calc(10px * var(--hud)); }
.mq-pennon { padding-top: calc(4px * var(--hud)); }
.mq-row { display: flex; gap: calc(10px * var(--hud)); }
.mq-seat { display: flex; flex-direction: column; align-items: center; gap: 2px; width: calc(44px * var(--hud)); font-family: 'IM Fell English', Georgia, serif; font-size: var(--text-hud-s); color: var(--color-quill); }
.mq-bot { opacity: 0.5; font-style: italic; }
.mq-foot { display: flex; justify-content: center; padding-top: calc(4px * var(--hud)); border-top: 1px solid color-mix(in srgb, var(--color-gilt) 50%, transparent); }
.mq-foot button { min-width: calc(280px * var(--hud)); }
@media (max-width: 640px) { .mq-book { top: 8px; transform: translateX(-50%); padding: 18px 16px; } .mq-pages { grid-template-columns: 1fr; } .mq-fold { display: none; } }
`,
}
