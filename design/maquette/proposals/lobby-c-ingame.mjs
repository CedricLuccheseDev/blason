import { CSS, MAP, book, bookButton, over } from './lobby.js'

// In the game: the book's button over the camera's three, the same as in the
// lobby; for the host the book shows the game going on, its settings for
// the next land, « Recommencer » and « Quitter la partie ».

export default {
  title: 'En partie : le même bouton, le même livre',
  line: 'Pendant la partie, le bouton du livre reste au-dessus de la caméra (et la touche Échap l’ouvre) ; pour l’hôte, le livre montre la partie en cours, ses réglages pour la prochaine terre, « Recommencer » et « Quitter la partie » ; pour un invité, « Quitter » seulement.',
  moments: ['war'],
  replace: {
    [MAP]: over(
      book('game', 'captures/strategic-1920x1080.webp') + bookButton(true),
    ),
  },
  css: CSS,
}
