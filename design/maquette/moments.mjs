// The maquette's moments: each a save of a game of bots (public/saves,
// made by npm run maquette), how it is staged before it is captured, and
// its title and line in the page, in French, as the maquette is read. The
// seat and the camera are the save's own; the staging is what a player
// would do on screen: keys for what he holds in hand (`keys: ['5']`), the
// pointer at the middle of the screen, where the save puts a neighbour's
// land (`pointer: true`), a click on a piece of the HUD (`click:` its
// selector). Two moments may stage one save (`save:` its name, the
// moment's own if none): the herald's letter opened, say, with
// `save: 'offer', click: '[aria-label^="Le pli"]'`.

/** The sizes every moment is captured at: a desk's screen, a laptop's, a phone upright. */
export const SIZES = [
  [1920, 1080],
  [1366, 768],
  [390, 844],
]

export const MOMENTS = [
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
]
