import { capture, sheet } from './hud.js'

// The settings (« la modale de réglages, avec les volumes »): a small round
// button beside the game's name, top left, a cogwheel in ink, the one sign
// every player knows; a click lays a sheet under it, its title and four
// lines of sound, each its word, a track of ink filled in gold as far as it
// sounds, a seal to drag and its figure; the mute with its key, M; the
// language. Shown open. The same button on the home page, beside the player.

const BUTTON = 'button[aria-label="Revenir à l’accueil"]'
/** The game's name as the capture draws it, kept beside the new button. */
const NAME = capture('minute-3-1920x1080').match(
  /<button type="button" aria-label="Revenir à l’accueil"[\s\S]*?<\/button>/,
)[0]

const cog = `<svg viewBox="0 0 24 24" aria-hidden="true" style="width: calc(22px * var(--hud)); height: calc(22px * var(--hud));"><circle cx="12" cy="12" r="8.6" fill="none" stroke="var(--color-quill)" stroke-width="4.2" stroke-dasharray="3.4 3.35"></circle><circle cx="12" cy="12" r="7" fill="var(--color-vellum)" stroke="var(--color-quill)" stroke-width="2"></circle><circle cx="12" cy="12" r="2.6" fill="none" stroke="var(--color-quill)" stroke-width="2"></circle></svg>`

const LINES = [
  { word: 'Tout', level: 80 },
  { word: 'Musique', level: 50 },
  { word: 'Ambiance', level: 70 },
  { word: 'Effets', level: 90 },
]

const line = ({ word, level }) =>
  `<div class="mq-row"><span class="hud-word text-hud-s mq-word">${word}</span><span class="mq-track"><span class="mq-fill" style="width: ${level}%"></span><span class="mq-seal" style="left: ${level}%"></span></span><span class="hud-figure text-hud-s mq-fig">${level}</span></div>`

const key = `<span class="relative grid size-6 place-items-center"><span class="absolute inset-[3px] rotate-45 border-[1.5px] border-quill bg-vellum"></span><span class="hud-figure relative text-hud-s">M</span></span>`

const body = `<div class="mq-sheet"><span class="hud-word text-hud-m">Réglages</span><span class="hud-note text-hud-s mq-head">Le son</span>${LINES.map(line).join('')}<div class="mq-row"><span class="hud-word text-hud-s">Couper le son</span><span class="mq-push"></span>${key}</div><span class="hud-note text-hud-s mq-head">La langue</span><div class="mq-row"><span class="hud-word text-hud-s mq-on">Français</span><span class="hud-word text-hud-s mq-off">English</span></div></div>`

const button = `<button type="button" aria-label="Réglages" class="pointer-events-auto inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-quill shadow-lift hud-press bg-vellum text-quill">${cog}</button>`

const piece = (original) =>
  `<span class="relative inline-flex items-center gap-2">${original}${button}<span class="mq-under">${sheet(body)}</span></span>`

export default {
  title: 'Les réglages',
  line: 'Un petit bouton rond à côté du nom du jeu, une roue dentée à l’encre, le signe que tout joueur connaît ; un clic pose dessous un feuillet : quatre lignes de son, chacune son mot, un trait d’encre rempli d’or aussi loin qu’il sonne et un sceau à tirer ; couper le son, sa touche M ; la langue. Montré ouvert. Le même bouton sur l’accueil, à côté du joueur.',
  moments: ['minute-3'],
  replace: { [BUTTON]: piece(NAME) },
  css: `
.mq-under { position: absolute; top: 100%; left: 0; margin-top: calc(8px * var(--hud)); width: max-content; }
.mq-sheet { display: flex; flex-direction: column; gap: calc(6px * var(--hud)); padding: calc(12px * var(--hud)) calc(16px * var(--hud)); min-width: calc(280px * var(--hud)); }
.mq-head { margin-top: calc(6px * var(--hud)); padding-bottom: calc(2px * var(--hud)); border-bottom: 1px solid color-mix(in srgb, var(--color-gilt) 60%, transparent); }
.mq-row { display: flex; align-items: center; gap: calc(12px * var(--hud)); min-height: calc(28px * var(--hud)); }
.mq-word { width: calc(80px * var(--hud)); }
.mq-track { position: relative; flex: 1; height: calc(4px * var(--hud)); background: color-mix(in srgb, var(--color-quill) 25%, transparent); border-radius: 2px; }
.mq-fill { position: absolute; inset: 0 auto 0 0; background: var(--color-gilt); border-radius: 2px; outline: 1px solid var(--color-quill); }
.mq-seal { position: absolute; top: 50%; width: calc(16px * var(--hud)); height: calc(16px * var(--hud)); transform: translate(-50%, -50%); border-radius: 50%; background: var(--color-gilt); border: 1.5px solid var(--color-quill); box-shadow: 0 1px 2px rgb(0 0 0 / 0.35); }
.mq-fig { width: calc(28px * var(--hud)); text-align: right; }
.mq-push { flex: 1; }
.mq-on { text-decoration: underline; text-decoration-color: var(--color-gilt); text-decoration-thickness: 2px; text-underline-offset: 4px; }
.mq-off { opacity: 0.55; }
`,
}
