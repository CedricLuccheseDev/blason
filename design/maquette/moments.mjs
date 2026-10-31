// The maquette's moments: each a save of a game of bots (public/saves,
// made by npm run maquette), how it is staged before it is captured, and
// its title and line in the page, in French, as the maquette is read. The
// seat and the camera are the save's own; the staging is what a player
// would do on screen: keys for what he holds in hand (`keys: ['5']`), the
// pointer at the middle of the screen, where the save puts a neighbour's
// land (`pointer: true`), a right click there (`menu: true`), a click on a
// piece of the HUD (`click:` its selector). Two moments may stage one save
// (`save:` its name, the moment's own if none): the herald's letter opened,
// say, with `save: 'offer', click: '[aria-label^="Le pli"]'`. A moment may
// be a page of the site rather than a save (`path:`), taken once what it
// waits for is there (`ready:` a selector), and without waiting for its
// map to hold still past so many ms (`longest:`), the home's game behind
// never holding still; with `map: false`, a page with no map behind, its
// HUD alone.

/** The sizes every moment is captured at: a desk's screen, a laptop's, a phone upright. */
export const SIZES = [
  [1920, 1080],
  [1366, 768],
  [390, 844],
]

export const MOMENTS = [
  {
    name: 'home',
    title: "L'accueil",
    line: 'La prochaine partie publique en premier et en grand, sa terre dessinée dedans ; puis créer une partie et rejoindre avec un code, le Journal à droite.',
    path: '/',
    ready: 'canvas[role="img"].opacity-100',
    map: false,
  },
  {
    name: 'opening',
    title: "L'ouverture",
    line: 'Les étendards se plantent pendant le compte : toute la terre, rien encore de pris.',
  },
  {
    name: 'minute-3',
    title: 'Trois minutes',
    line: "Ma terre et celle d'un voisin, le pointeur sur la sienne : l'armée en main, ses hommes et son or.",
    pointer: true,
  },
  {
    name: 'menu',
    title: 'Le clic droit',
    line: "Un clic droit sur la terre d'un voisin pose le cartouche : son seigneur et l'alliance à lui offrir.",
    save: 'minute-3',
    pointer: true,
    menu: true,
  },
  {
    name: 'offer',
    title: "Une offre d'alliance",
    line: "Le héraut attend sur ma terre, sa lettre scellée, au plus près du seigneur qui l'envoie.",
  },
  {
    name: 'renew',
    title: 'Une alliance à renouveler',
    line: "Ses dernières secondes : le sceau, à côté du nom de l'allié, attend un clic.",
  },
  {
    name: 'war',
    title: 'Une guerre, de près',
    line: 'La carte de près : les armées au front, la gestion et le spectacle.',
  },
  {
    name: 'strategic',
    title: 'La carte stratégique',
    line: 'Toute la terre à vingt minutes : de loin, seulement ce qui sert une décision.',
  },
  {
    name: 'end',
    title: 'La fin de partie, gagnée',
    line: 'Le pas où la partie est gagnée, vu par son vainqueur.',
  },
  {
    name: 'end-lost',
    title: 'La fin de partie, perdue',
    line: 'Le même pas, vu par le seigneur venu le plus près.',
  },
]
