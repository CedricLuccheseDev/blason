import { BAR, CSS, MAP, PANEL, book, bookButton, over } from './lobby.js'

// The host's lobby: the book open by itself over the map of his game, all
// of it there (the land, the seats, the invitation, the settings, the
// launch); « Voir la carte » closes it, the book's button opens it again.

export default {
  title: 'Le salon de l’hôte : le livre de la partie',
  line: 'Avant le lancement, le livre s’ouvre de lui-même sur la carte : la terre, les sièges, le code à donner, les réglages et « Lancer la partie », tout en un seul endroit. « Voir la carte » le referme ; le bouton du livre, au-dessus de la caméra, le rouvre. Plus de barre de salon.',
  moments: ['opening'],
  replace: {
    [BAR]: '',
    [PANEL]: '',
    [MAP]: over(
      book('host', 'captures/opening-1920x1080.webp') + bookButton(true),
    ),
  },
  css: CSS,
}
