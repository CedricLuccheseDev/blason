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
/** The game's pieces, as its markup has them. */
const LORDS = 'main > .grid > :first-child > *'
const RACE = 'main > .grid > div:nth-child(2) > :first-child'
const MOMENT = 'main > .grid > div:nth-child(2) > :nth-child(2)'
const CARTOUCHE = 'main > .absolute.w-max'
const HELD = '[aria-pressed="true"]'
const PURSE = 'main .col-start-2 .rounded-md > .flex.items-center.gap-2'
const HERALDS = 'main > .pointer-events-none.absolute.inset-0.overflow-hidden'
const ALLY = '[role="img"][aria-label="Ton allié"]'
const FOE = '[role="img"][aria-label="En guerre avec toi"]'
const FELON = '[role="img"][aria-label="Félon"]'

/** A desk's screen, whose lords' list the notes' lines keep clear of; a phone's. */
const desk = (moment) => ({
  moment,
  size: DESK,
  caption: '1920 × 1080',
  avoid: [LORDS],
})
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
        text: 'La prochaine partie publique : sa terre est celle qu’on jouera',
        at: [0, 'nav img[role="img"]', [0.12, 0.6]],
        pins: [[1, 'nav img[role="img"]', [0.06, 0.6]]],
      },
      {
        text: 'Le départ, compté à la seconde',
        at: [0, '.right-2.bottom-2', [0.1, 0.5]],
        pins: [[1, '.right-2.bottom-2', [0.06, 0.5]]],
      },
      {
        text: 'Les places prises ; un clic pour s’asseoir, et elle part seule',
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
        text: 'Derrière un voile de vélin, une partie de bots, à regarder en grand',
        at: [0, 'main > :nth-child(2)', [0.6, 0.82]],
      },
    ],
  },
  {
    name: 'ouverture',
    title: 'L’ouverture',
    line: 'Dix secondes pour planter son étendard : toute la terre, rien encore de pris.',
    screens: [desk('opening')],
    notes: [
      {
        text: 'Le compte : dix secondes pour planter son étendard, où l’on veut',
        at: [0, MOMENT],
      },
      {
        text: 'Mon étendard, cerclé d’or : la terre autour sera la mienne',
        at: [0, [1301, 340]],
      },
      {
        text: 'Pas à moins de vingt tuiles d’un autre : le premier planté tient la place',
        at: [0, [850, 432]],
      },
      {
        text: 'Les vingt seigneurs, tous à zéro : rien n’est encore pris',
        at: [0, LORDS, [0, 0.3]],
      },
      {
        text: 'Cinquante pièces d’or pour commencer',
        at: [0, PURSE],
      },
      {
        text: 'Le premier village et le premier marché ne coûtent rien',
        at: [0, '[aria-label="Village"]', [0.5, 0.1]],
      },
      {
        text: 'À demi-encre, ce que l’or ne paie pas encore',
        at: [0, '[aria-label="Château"]', [0.5, 0.1]],
      },
    ],
  },
  {
    name: 'trois-minutes',
    title: 'Trois minutes',
    line: 'Ma terre et celle d’un voisin, le pointeur sur la sienne : l’armée en main, ses hommes, sa route.',
    screens: [desk('minute-3'), phone('minute-3')],
    notes: [
      {
        text: 'La liste des seigneurs, en bandes : qui mène, et de combien',
        at: [0, LORDS, [0, 0.25]],
        pins: [[1, LORDS, [0.5, 0.5]]],
      },
      {
        text: 'La course : le temps, et quand baisse la part de terre qui gagne',
        at: [0, RACE],
        pins: [[1, RACE, [0.3, 1]]],
      },
      {
        text: 'Près de la souris, le cartouche : l’armée en main et ce que fera un clic',
        at: [0, CARTOUCHE, [0, 0.3]],
        pins: [[1, CARTOUCHE]],
      },
      {
        text: 'La route de l’armée, de son village à la terre visée',
        at: [0, [962, 450]],
      },
      {
        text: 'L’armée en main, à la couleur de son seigneur ; touches 1 à 3',
        at: [0, HELD, [0.45, -0.06]],
        pins: [[1, HELD, [0.2, 0.2]]],
      },
      {
        text: 'Les paysans qui tiennent la terre et leur plafond ; l’or dessous',
        at: [0, PURSE],
        pins: [[1, PURSE]],
      },
    ],
  },
  {
    name: 'clic-droit',
    title: 'Le clic droit',
    line: 'Un clic droit sur la terre d’un voisin pose le cartouche : son seigneur, et l’alliance à lui offrir.',
    screens: [
      {
        ...desk('menu'),
        crop: [0, 0, 1440, 810],
        caption: '1920 × 1080, en partie',
      },
      phone('menu'),
    ],
    notes: [
      {
        text: 'Le cartouche posé : le seigneur visé, et l’alliance à lui offrir en un clic',
        at: [0, CARTOUCHE, [0.55, 0.18]],
        pins: [[1, CARTOUCHE, [0.55, 0.1]]],
      },
      {
        text: 'À gauche, ce qu’enverrait un clic gauche : l’armée en main',
        at: [0, CARTOUCHE, [0, 0.3]],
        pins: [[1, CARTOUCHE]],
      },
      {
        text: 'Le seigneur visé, éclairé dans la liste',
        at: [0, `${LORDS} .outline-quill`],
      },
      {
        text: 'Sa terre, et la route jusqu’à elle',
        at: [0, [962, 450]],
      },
    ],
  },
  {
    name: 'offre-d-alliance',
    title: 'Une offre d’alliance',
    line: 'Le héraut attend sur ma terre, sa lettre scellée, au plus près du seigneur qui l’envoie.',
    screens: [desk('offer')],
    notes: [
      {
        text: 'Le pli du héraut, sur ma terre, au plus près de qui l’envoie',
        at: [0, '[aria-label^="Ouvrir la lettre"]', [0.1, 0.5]],
      },
      {
        text: 'Un clic brise le sceau : sceller ou refuser, en 20 secondes',
        at: [0, `${HERALDS} > *`, [0, 0.85]],
      },
      {
        text: 'Félon : ma terre tient moitié moins, 30 secondes',
        at: [0, [960, 487]],
      },
      {
        text: 'Un allié : ses maillons verts, sur la carte et dans la liste',
        at: [0, [1022, 900]],
      },
      {
        text: 'Notre frontière, liserée de vert',
        at: [0, [950, 781]],
      },
    ],
  },
  {
    name: 'alliance-a-renouveler',
    title: 'Une alliance à renouveler',
    line: 'Ses trente dernières secondes : le sceau, près du nom de l’allié, attend un clic.',
    screens: [desk('renew'), phone('renew')],
    notes: [
      {
        text: 'Le sceau de l’alliance, près du nom de l’allié : un clic la renouvelle',
        at: [0, '[aria-label^="Renouveler"]', [0.1, 0.5]],
        pins: [[1, '[aria-label^="Renouveler"]', [-0.3, 0.2]]],
      },
      {
        text: 'Le temps qui lui reste ; elle tient cinq minutes de plus si les deux le veulent',
        at: [0, `${HERALDS} > *`, [0.2, 0.92]],
        pins: [[1, `${HERALDS} > *`, [-0.35, 0.85]]],
      },
      {
        text: 'Notre frontière, liserée de vert : nos armées ne s’y frappent pas',
        at: [0, [636, 605]],
      },
      {
        text: 'Dans la liste, l’allié réglé de vert',
        at: [0, `${LORDS} .border-pact`],
      },
      {
        text: 'Un château et son cercle : la terre y tient mieux, ses archers tirent',
        at: [0, [918, 790]],
      },
    ],
  },
  {
    name: 'guerre-de-pres',
    title: 'Une guerre, de près',
    line: 'La carte de près : les armées au front, leur bataille, les villages et les marchands.',
    screens: [
      {
        ...desk('war'),
        crop: [412, 0, 1200, 675],
        caption: '1920 × 1080, en partie',
        avoid: [],
      },
    ],
    notes: [
      {
        text: 'Sur chaque terre, le nom du seigneur et ses hommes en grand',
        at: [0, [600, 125]],
      },
      {
        text: 'Sur chaque village, son armée : dehors, des épées rouges ; prête, endormie',
        at: [0, [795, 97]],
      },
      {
        text: 'L’armée d’Orangé, venue défendre sa terre',
        at: [0, [933, 268]],
      },
      {
        text: 'La bataille, sous un sceau rouge : elles s’arrêtent et se battent, vues de tous',
        at: [0, [972, 307]],
      },
      {
        text: 'Mon armée au front, son étendard à ma couleur, ses hommes dessus',
        at: [0, [1005, 330]],
      },
      {
        text: 'Un marchand sur la route : arrivé, il paie ses deux marchés',
        at: [0, [850, 437]],
      },
    ],
  },
  {
    name: 'carte-strategique',
    title: 'La carte stratégique',
    line: 'Toute la terre à vingt minutes : de loin, seulement ce qui sert une décision.',
    screens: [desk('strategic')],
    notes: [
      {
        text: 'À vingt minutes, la moitié de la terre suffit pour gagner',
        at: [0, RACE, [1, 0.5]],
      },
      {
        text: 'Onze seigneurs encore debout, les autres tombés',
        at: [0, LORDS, [0, 0.3]],
      },
      {
        text: 'Chaque terre au lavis de son seigneur, son nom et ses hommes en son cœur',
        at: [0, [1185, 500]],
      },
      {
        text: 'Le félon, marqué sur la carte comme dans la liste',
        at: [0, [825, 347]],
      },
      {
        text: 'De loin, des armées ne restent que les étendards',
        at: [0, [958, 388]],
      },
      {
        text: 'Le cercle d’un château : la terre y tient deux fois mieux',
        at: [0, [536, 560]],
      },
    ],
  },
  {
    name: 'fin-de-partie',
    title: 'La fin de partie',
    line: 'Le pas où la partie est gagnée, vu par son vainqueur et par le seigneur venu le plus près.',
    screens: [
      { ...desk('end'), caption: 'Le vainqueur', box: [482, 212, 540] },
      { ...desk('end-lost'), caption: 'Le second', box: [896, 420, 540] },
    ],
    notes: [
      {
        text: 'La victoire, dite en grand, et un clic pour rejouer',
        at: [0, MOMENT],
      },
      {
        text: 'La moitié de la terre : ce qui gagne dès quinze minutes de jeu',
        at: [0, `${LORDS} .outline-gilt`],
      },
      {
        text: 'Sa terre, d’un seul lavis sur la moitié du monde',
        at: [0, [1150, 250]],
      },
      {
        text: 'Plus de paysans que la terre n’en nourrit : ils tombent malades, le chiffre rougit',
        at: [0, PURSE, [0.5, 0.3]],
      },
      {
        text: 'Le même pas chez le second : qui l’emporte, et rejouer',
        at: [1, MOMENT],
      },
    ],
  },
  {
    name: 'systeme-d-interface',
    title: 'Le système d’interface',
    line: 'Les briques dont tout écran est fait, telles que le jeu les dessine : les mots par leur niveau, les espaces par ce qu’ils séparent, les feuillets, le bouton, les emblèmes, les couleurs.',
    pieces: {
      from: desk('war'),
      slots: { bar: 'main .col-span-3.row-start-3 > :nth-child(2) > *' },
    },
  },
]
