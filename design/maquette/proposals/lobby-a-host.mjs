import {
  BAR,
  CSS,
  PANEL,
  SEATED,
  SEATS,
  act,
  rule,
  seats,
  sheet,
} from './lobby.js'

// The host's lobby, in the game: before the launch the bar is the lobby's,
// the people seated and the seats the bots will fill, the invitation's code
// and its link to copy, « Configurer » and « Lancer ».

const bar = `<div class="w-max px-2">${sheet(
  `<div class="mq-bar"><div class="mq-group"><span class="hud-note">${SEATED.length} joueurs, ${SEATS - SEATED.length} bots aux sièges vides</span>${seats()}</div>${rule}<div class="mq-group"><span class="hud-note">L’invitation</span><div class="mq-code"><span class="hud-figure text-hud-l">K7Q2M</span>${act('Copier le lien', 'plain')}</div></div>${rule}<div class="mq-code">${act('Configurer', 'plain')}${act('Lancer')}</div></div>`,
)}</div>`

const panel = sheet(
  '<div class="mq-panel"><span class="hud-word text-hud-l">Ta partie</span><span class="hud-note">en attente : lance-la quand tu veux</span></div>',
)

export default {
  title: 'Le salon de l’hôte, dans le jeu',
  line: 'Avant le lancement, la barre devient le salon : les joueurs assis et les sièges que prendront les bots, le code et le lien à copier, « Configurer » et « Lancer ». La carte de la partie est déjà là.',
  moments: ['opening'],
  replace: { [BAR]: bar, [PANEL]: panel },
  css: CSS,
}
