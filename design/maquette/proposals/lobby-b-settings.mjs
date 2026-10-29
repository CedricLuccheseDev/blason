import { shield } from './lords.js'
import { BAR, CSS, PANEL, SEATED, act, sheet } from './lobby.js'
import hostLobby from './lobby-a-host.mjs'

// « Configurer » opened: a sheet over the game, the land (its kind, its
// size, another one drawn by lot, its preview), the bots, the opening's
// length, the people and the invitation; « Lancer ».

const chips = (words, held) =>
  `<div class="mq-chips">${words.map((w) => `<span class="mq-chip${w === held ? ' mq-held' : ''} hud-word text-hud-s">${w}</span>`).join('')}</div>`

const people = SEATED.map(
  ([name, color, who]) =>
    `<div class="mq-person">${shield(color, 16)}<span class="hud-word text-hud-s">${name}</span><span class="hud-note">${who}</span>${who.startsWith('toi') ? '' : '<span class="mq-out hud-note">retirer</span>'}</div>`,
).join('')

const modal = `<div class="mq-veil"></div><div class="mq-modal">${sheet(
  `<div class="mq-settings"><div class="mq-title"><span class="hud-word text-hud-xl">Ta partie</span><span class="hud-note">Ce que tu choisis ici vaut pour tous les joueurs.</span></div><div class="mq-cols"><div class="mq-col"><span class="hud-note">La terre</span><img class="mq-preview" src="captures/opening-1920x1080.webp" alt="">${chips(['Continent', 'Côte', 'Mer intérieure', 'Isthme', 'Bande', 'Fjords'], 'Côte')}${chips(['Standard', 'Grande', 'Immense'], 'Standard')}${act('Une autre terre', 'plain')}</div><div class="mq-col"><span class="hud-note">Les bots</span>${chips(['Facile', 'Moyen', 'Difficile'], 'Moyen')}<span class="hud-note">La pose des étendards</span>${chips(['10 s', '30 s', '60 s'], '30 s')}<span class="hud-note">Les joueurs</span>${people}<div class="mq-code"><span class="hud-figure text-hud-l">K7Q2M</span>${act('Copier le lien', 'plain')}</div></div></div><div class="mq-actions">${act('Fermer', 'plain')}${act('Lancer')}</div></div>`,
)}</div>`

export default {
  title: 'La configuration de la partie',
  line: '« Configurer » ouvre cette feuille sur le jeu : la terre (sa famille, sa taille, une autre au sort, son aperçu), les bots, la durée de la pose, les joueurs et l’invitation ; « Lancer ».',
  moments: ['opening'],
  // The sheet and its veil lie over the whole screen, beside the count's panel.
  replace: {
    [BAR]: hostLobby.replace[BAR],
    [PANEL]: hostLobby.replace[PANEL] + modal,
  },
  css: `${CSS}
.mq-veil { position: absolute; inset: 0; background: rgb(43 30 18 / 0.35); }
.mq-modal { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(calc(760px * var(--hud)), calc(100vw - 24px)); }
.mq-settings { display: flex; flex-direction: column; gap: calc(14px * var(--hud)); padding: calc(18px * var(--hud)) calc(22px * var(--hud)); }
.mq-title { display: flex; flex-direction: column; gap: 2px; }
.mq-cols { display: grid; grid-template-columns: 1fr 1fr; gap: calc(22px * var(--hud)); }
.mq-col { display: flex; flex-direction: column; gap: calc(8px * var(--hud)); align-items: flex-start; }
.mq-preview { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border: 1px solid var(--color-quill); }
.mq-chips { display: flex; flex-wrap: wrap; gap: calc(6px * var(--hud)); }
.mq-chip { padding: calc(2px * var(--hud)) calc(10px * var(--hud)); border: 1px solid var(--color-quill); border-radius: 999px; background: var(--color-vellum); }
.mq-chip.mq-held { background: var(--color-gilt); }
.mq-person { display: flex; align-items: center; gap: calc(8px * var(--hud)); width: 100%; }
.mq-out { margin-left: auto; color: var(--color-gules); }
.mq-actions { display: flex; justify-content: flex-end; gap: calc(10px * var(--hud)); }
@media (max-width: 640px) { .mq-cols { grid-template-columns: 1fr; } .mq-modal { top: 8px; transform: translateX(-50%); } }
`,
}
