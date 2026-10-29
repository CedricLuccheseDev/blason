// The boards of the maquette, in order (planches.mjs lays them out and
// exports them): each its name, its title and its line in French, as the
// boards are read, then what it shows. A cover shows a moment's map as key
// art (`art:`). A board of screens shows the moments it names (`screens:`,
// each a capture of design/maquette/captures at its size, as tall as each
// other in a row), and its notes: each a few words in French saying what a
// piece is for, from the player's side, and where it is, `at: [screen,
// target, anchor]`: the screen's index, the piece by its selector in the
// frame (or several, the first found), or a point in the frame's own pixels
// for what is drawn on the map; the anchor, the point of the piece's box
// the line ends on, [0, 0.5] its left middle by default. `pins:` lays the
// note's number on the same piece in other screens (the phone), at its
// top left corner by default. The board of the interface's system shows the
// pieces as the game's components draw them (pieces.tsx, captured), with
// the pieces only a game draws, filled from a capture (`pieces:`, the
// capture and each slot's selector in it).
//
// The selectors read the game's markup as captured; a piece that moves or
// changes its classes in the game is a note the build reports missing.

/** A desk's screen and a phone's, as captured. */
const DESK = [1920, 1080]
const PHONE = [390, 844]
const desk = (moment) => ({ moment, size: DESK, caption: '1920 × 1080' })
const phone = (moment) => ({ moment, size: PHONE, caption: '390 × 844' })

export const BOARDS = [
  {
    name: 'couverture',
    title: 'Blason',
    line: 'Vingt seigneurs, une terre redessinée à chaque partie',
    art: 'strategic',
    what: {
      title: 'La maquette',
      line: 'Onze planches tirées du jeu lui-même : chaque écran est une vraie partie, figée à un moment.',
    },
  },
  {
    name: 'accueil',
    title: 'L’accueil',
    line: 'La prochaine partie publique en premier et en grand, puis le solo et les parties privées ; derrière, une partie de bots.',
    screens: [desk('home'), phone('home')],
    notes: [
      {
        text: 'La prochaine partie publique, en premier : sa terre, déjà tirée, est celle qu’on jouera',
        at: [0, 'nav img[role="img"]', [0.12, 0.6]],
        pins: [[1, 'nav img[role="img"]', [0.06, 0.6]]],
      },
      {
        text: 'Le départ, compté à la seconde',
        at: [0, '.right-2.bottom-2', [0.1, 0.5]],
        pins: [[1, '.right-2.bottom-2', [0.06, 0.5]]],
      },
      {
        text: 'Les places prises, et un clic pour s’asseoir : la partie part d’elle-même',
        at: [0, 'nav button.bg-gilt'],
        pins: [[1, 'nav button.bg-gilt', [0.03, 0.5]]],
      },
      {
        text: 'Le solo, contre dix-neuf bots : la taille de la terre et leur niveau',
        at: [0, 'nav > .grid > button'],
        pins: [[1, 'nav > .grid > button', [0.03, 0.5]]],
      },
      {
        text: 'Une partie privée : on crée la salle, ou on la rejoint par son code',
        at: [0, 'nav .grid .grid'],
        pins: [[1, 'nav .grid .grid', [0.03, 0.12]]],
      },
      {
        text: 'Derrière le voile, une partie de bots ; un clic la regarde en grand',
        at: [0, 'aside > .grid > button', [0.04, 0.5]],
      },
    ],
  },
  {
    name: 'systeme-d-interface',
    title: 'Le système d’interface',
    line: 'Les pièces dont tout écran est fait, telles que le jeu les dessine : quatre tailles, quatre rôles, une matière, un bouton.',
    pieces: {
      from: desk('war'),
      slots: {
        lords: 'main > .grid > :first-child > *',
        bar: 'main .col-start-2 > *',
      },
    },
  },
]
