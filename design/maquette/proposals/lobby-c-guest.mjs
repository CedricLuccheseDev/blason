import { BAR, CSS, PANEL, act, rule, seats, sheet } from './lobby.js'

// The guest's lobby, in the game: the land to study while the host
// configures, the seats, a word that the host will launch, « Quitter ».

const bar = `<div class="w-max px-2">${sheet(
  `<div class="mq-bar"><div class="mq-group"><span class="hud-note">Tu es assis ; 5 bots prendront les sièges vides</span>${seats()}</div>${rule}<div class="mq-group"><span class="hud-word text-hud-m">En attente de l’hôte</span><span class="hud-note">Azur lancera la partie</span></div>${rule}${act('Quitter', 'plain')}</div>`,
)}</div>`

const panel = sheet(
  '<div class="mq-panel"><span class="hud-word text-hud-l">La partie d’Azur</span><span class="hud-note">regarde la terre en attendant : tu planteras ton étendard au lancement</span></div>',
)

export default {
  title: 'Le salon de l’invité, dans le jeu',
  line: 'Invité ou venu par le code, on arrive sur la carte de la partie : on l’étudie en attendant que l’hôte la lance, ses sièges en bas, « Quitter » à côté.',
  moments: ['opening'],
  replace: { [BAR]: bar, [PANEL]: panel },
  css: CSS,
}
