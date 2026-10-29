import { shield } from './lords.js'
import { BAR, CSS, PANEL, SEATED, SEATS, act, sheet } from './lobby.js'
import hostLobby from './lobby-a-host.mjs'

// « Configurer » opened, drawn again plainer (« je la trouve fouillis »):
// one column; the land's preview large, the kind under it in a cartouche,
// another one drawn by lot from its corner; then four lines, each its name
// on the left and one segmented choice on the right; the seats on a line;
// one button to launch. The invitation stays in the bar, said once.

const segmented = (words, held) =>
  `<div class="mq-seg">${words.map((w) => `<span class="${w === held ? 'mq-on ' : ''}hud-word text-hud-s">${w}</span>`).join('')}</div>`

const line = (name, control) =>
  `<div class="mq-line"><span class="hud-word text-hud-m">${name}</span>${control}</div>`

const stepper = (word) =>
  `<div class="mq-step"><span class="mq-arrow hud-word text-hud-m">‹</span><span class="hud-word text-hud-m">${word}</span><span class="mq-arrow hud-word text-hud-m">›</span></div>`

const people = SEATED.map(
  ([name, color]) => `<span title="${name}">${shield(color, 18)}</span>`,
).join('')
const empty = Array.from(
  { length: SEATS - SEATED.length },
  () => `<span class="mq-empty">${shield('var(--color-vellum)', 18)}</span>`,
).join('')

const modal = `<div class="mq-veil"></div><div class="mq-modal">${sheet(
  `<div class="mq-settings"><div class="mq-top"><span class="hud-word text-hud-xl">Ta partie</span><span class="mq-close hud-word text-hud-m">Fermer</span></div><div class="mq-land"><img src="captures/opening-1920x1080.webp" alt=""><span class="mq-again hud-word text-hud-s">Une autre terre</span></div>${line('La terre', stepper('La côte'))}${line('La taille', segmented(['Standard', 'Grande', 'Immense'], 'Standard'))}${line('Les bots', segmented(['Faciles', 'Moyens', 'Difficiles'], 'Moyens'))}${line('La pose', segmented(['10 s', '30 s', '60 s'], '30 s'))}${line('Les joueurs', `<div class="mq-who"><div class="mq-seats">${people}${empty}</div><span class="hud-note">3 sur 8, des bots aux autres sièges</span></div>`)}<div class="mq-go">${act('Lancer la partie')}</div></div>`,
)}</div>`

export default {
  title: 'La configuration de la partie',
  line: '« Configurer » ouvre une seule colonne : l’aperçu de la terre en grand, puis la terre, la taille, les bots et la pose, chacun d’un seul choix, les sièges, et « Lancer la partie ». L’invitation reste dans la barre.',
  moments: ['opening'],
  // The sheet and its veil lie over the whole screen, beside the count's panel.
  replace: {
    [BAR]: hostLobby.replace[BAR],
    [PANEL]: hostLobby.replace[PANEL] + modal,
  },
  css: `${CSS}
.mq-veil { position: absolute; inset: 0; background: rgb(43 30 18 / 0.4); }
.mq-modal { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(calc(520px * var(--hud)), calc(100vw - 24px)); }
.mq-settings { display: flex; flex-direction: column; gap: calc(12px * var(--hud)); padding: calc(18px * var(--hud)) calc(22px * var(--hud)) calc(20px * var(--hud)); }
.mq-top { display: flex; align-items: baseline; justify-content: space-between; }
.mq-close { opacity: 0.7; }
.mq-land { position: relative; }
.mq-land img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border: 1.5px solid var(--color-quill); border-radius: 4px; }
.mq-again { position: absolute; right: calc(8px * var(--hud)); top: calc(8px * var(--hud)); padding: calc(2px * var(--hud)) calc(10px * var(--hud)); background: var(--color-vellum); border: 1.5px solid var(--color-quill); border-radius: 6px; box-shadow: var(--shadow-lift); }
.mq-line { display: grid; grid-template-columns: calc(110px * var(--hud)) 1fr; align-items: center; gap: calc(12px * var(--hud)); padding-top: calc(10px * var(--hud)); border-top: 1px solid color-mix(in srgb, var(--color-gilt) 45%, transparent); }
.mq-seg { display: flex; border: 1.5px solid var(--color-quill); border-radius: 6px; overflow: hidden; }
.mq-seg > span { flex: 1; text-align: center; padding: calc(4px * var(--hud)) 0; }
.mq-seg > span + span { border-left: 1px solid var(--color-quill); }
.mq-seg > .mq-on { background: var(--color-gilt); }
.mq-step { display: flex; align-items: center; justify-content: space-between; border: 1.5px solid var(--color-quill); border-radius: 6px; padding: calc(3px * var(--hud)) calc(10px * var(--hud)); }
.mq-arrow { opacity: 0.6; padding: 0 calc(6px * var(--hud)); }
.mq-who { display: flex; flex-direction: column; gap: 2px; }
.mq-go { display: grid; padding-top: calc(4px * var(--hud)); }
@media (max-width: 640px) { .mq-modal { top: 8px; transform: translateX(-50%); } .mq-line { grid-template-columns: 1fr; gap: 4px; } }
`,
}
