import { shield } from './lords.js'
import { BAR, CSS, PANEL, SEATED, act, sheet } from './lobby.js'
import hostLobby from './lobby-a-host.mjs'

// « Configurer » opened, one plain column (« je la trouve fouillis »), and
// everything up to the host (« peut-être qu'on veut jouer qu'à 2, il faut
// pouvoir tout faire »): the land's preview large, another drawn by lot from
// its corner; then a line each, its name on the left and one choice on the
// right: the land's kind, its size, how many bots (none at all, to play
// alone with friends), their level, the teams, the opening; the seats ranged
// by team, the people where they sat and the bots asked for; one button to
// launch. The invitation stays in the bar, said once.

const segmented = (words, held, dim = false) =>
  `<div class="mq-seg${dim ? ' mq-dim' : ''}">${words
    .map(
      (w) =>
        `<span class="${w === held ? 'mq-on ' : ''}hud-word text-hud-s">${w}</span>`,
    )
    .join('')}</div>`

const stepper = (word) =>
  `<div class="mq-step"><span class="mq-arrow hud-word text-hud-m">‹</span><span class="hud-word text-hud-m">${word}</span><span class="mq-arrow hud-word text-hud-m">›</span></div>`

const line = (name, control) =>
  `<div class="mq-line"><span class="hud-word text-hud-m">${name}</span>${control}</div>`

/** A seat: a person's shield where he sat, a bot's as a pale shield marked with its gear. */
const person = ([name, color]) =>
  `<span class="mq-seat" title="${name}">${shield(color, 18)}</span>`
const bot = `<span class="mq-seat mq-bot" title="Un bot">${shield('var(--color-shade)', 18)}</span>`
const team = (name, seats) =>
  `<div class="mq-team"><span class="hud-note">${name}</span><div class="mq-seats">${seats.join('')}</div></div>`

// Three people and five bots, two teams of four.
const teams = `<div class="mq-teams">${team('Première équipe', [person(SEATED[0]), person(SEATED[2]), bot, bot])}${team('Seconde équipe', [person(SEATED[1]), bot, bot, bot])}</div>`

const modal = `<div class="mq-veil"></div><div class="mq-modal">${sheet(
  `<div class="mq-settings"><div class="mq-top"><span class="hud-word text-hud-xl">Ta partie</span><span class="mq-close hud-word text-hud-m">Fermer</span></div><div class="mq-land"><img src="captures/opening-1920x1080.webp" alt=""><span class="mq-again hud-word text-hud-s">Une autre terre</span></div>${line('La terre', stepper('La côte'))}${line('La taille', segmented(['Standard', 'Grande', 'Immense'], 'Standard'))}${line('Les bots', stepper('5 bots'))}${line('Leur niveau', segmented(['Faciles', 'Moyens', 'Difficiles'], 'Moyens'))}${line('Les équipes', segmented(['Chacun pour soi', '2', '3', '4'], '2'))}${line('La pose', segmented(['10 s', '30 s', '60 s'], '30 s'))}${line('Les sièges', teams)}<div class="mq-go">${act('Lancer la partie')}</div></div>`,
)}</div>`

export default {
  title: 'La configuration de la partie',
  line: '« Configurer » ouvre une seule colonne : l’aperçu de la terre, puis la terre, la taille, le nombre de bots (de zéro à dix-neuf), leur niveau, les équipes et la pose, chacun d’un seul choix ; les sièges rangés par équipe ; « Lancer la partie ». L’invitation reste dans la barre.',
  moments: ['opening'],
  // The sheet and its veil lie over the whole screen, beside the count's panel.
  replace: {
    [BAR]: hostLobby.replace[BAR],
    [PANEL]: hostLobby.replace[PANEL] + modal,
  },
  css: `${CSS}
.mq-veil { position: absolute; inset: 0; background: rgb(43 30 18 / 0.4); }
.mq-modal { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(calc(560px * var(--hud)), calc(100vw - 24px)); }
.mq-settings { display: flex; flex-direction: column; gap: calc(10px * var(--hud)); padding: calc(16px * var(--hud)) calc(22px * var(--hud)) calc(18px * var(--hud)); }
.mq-top { display: flex; align-items: baseline; justify-content: space-between; }
.mq-close { opacity: 0.7; }
.mq-land { position: relative; }
.mq-land img { display: block; width: 100%; aspect-ratio: 21 / 9; object-fit: cover; border: 1.5px solid var(--color-quill); border-radius: 4px; }
.mq-again { position: absolute; right: calc(8px * var(--hud)); top: calc(8px * var(--hud)); padding: calc(2px * var(--hud)) calc(10px * var(--hud)); background: var(--color-vellum); border: 1.5px solid var(--color-quill); border-radius: 6px; box-shadow: var(--shadow-lift); }
.mq-line { display: grid; grid-template-columns: calc(110px * var(--hud)) 1fr; align-items: center; gap: calc(12px * var(--hud)); padding-top: calc(8px * var(--hud)); border-top: 1px solid color-mix(in srgb, var(--color-gilt) 45%, transparent); }
.mq-seg { display: flex; border: 1.5px solid var(--color-quill); border-radius: 6px; overflow: hidden; }
.mq-seg > span { flex: 1; text-align: center; padding: calc(4px * var(--hud)) calc(6px * var(--hud)); white-space: nowrap; }
.mq-seg > span + span { border-left: 1px solid var(--color-quill); }
.mq-seg > .mq-on { background: var(--color-gilt); }
.mq-step { display: flex; align-items: center; justify-content: space-between; border: 1.5px solid var(--color-quill); border-radius: 6px; padding: calc(3px * var(--hud)) calc(10px * var(--hud)); }
.mq-arrow { opacity: 0.6; padding: 0 calc(6px * var(--hud)); }
.mq-teams { display: flex; gap: calc(20px * var(--hud)); }
.mq-team { display: flex; flex-direction: column; gap: 2px; }
.mq-seats { display: flex; gap: calc(4px * var(--hud)); }
.mq-bot { opacity: 0.55; }
.mq-go { display: grid; padding-top: calc(4px * var(--hud)); }
@media (max-width: 640px) { .mq-modal { top: 8px; transform: translateX(-50%); } .mq-line { grid-template-columns: 1fr; gap: 4px; } }
`,
}
