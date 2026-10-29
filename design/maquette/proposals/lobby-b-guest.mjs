import { BAR, CSS, MAP, PANEL, book, bookButton, over } from './lobby.js'

// The guest's lobby: the same book, read: the host's choices, the seats,
// waiting for the host, « Quitter ».

export default {
  title: 'Le salon de l’invité : le même livre, à lire',
  line: 'Invité ou venu par le code, on trouve le même livre ouvert : les choix de l’hôte, sans flèches, les sièges, « En attente de l’hôte » et « Quitter ». On le referme pour étudier la terre en attendant.',
  moments: ['opening'],
  replace: {
    [BAR]: '',
    [PANEL]: '',
    [MAP]: over(
      book('guest', 'captures/opening-1920x1080.webp') + bookButton(),
    ),
  },
  css: CSS,
}
