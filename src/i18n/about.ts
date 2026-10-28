// The "How it works" page: for Cédric first, and for whoever wants to know
// how a game of Blason is made. Plain words, but the technique is said. It
// describes the machine the code runs: a change to how the game works moves
// this page in the same cycle.

type AboutSection = {
  heading: string
  body: Array<string>
  diagram?: 'seed' | 'step' | 'screen'
}

export type About = {
  title: string
  lead: string
  sections: Array<AboutSection>
  /** The diagrams' words. */
  t: Record<
    | 'seed'
    | 'cells'
    | 'coast'
    | 'tiles'
    | 'domains'
    | 'orders'
    | 'player'
    | 'bots'
    | 'valid'
    | 'rules'
    | 'state'
    | 'tick'
    | 'summary'
    | 'hud'
    | 'scene'
    | 'map'
    | 'second'
    | 'frame',
    string
  >
}

export const aboutEn: About = {
  title: 'How it works',
  lead: 'Blason is a game of twenty lords on a land drawn anew each game. Everything runs in your browser: the land, the bots and every move are computed on your machine, the same way on every machine.',
  sections: [
    {
      heading: 'A land grown from a seed',
      diagram: 'seed',
      body: [
        'Each game starts from a seed, a short word drawn at random. From it the generator scatters some two thousand points, cuts the frame into cells around them, raises a land in the middle of the sea, draws its coast, a few lakes and rivers. The same seed always draws the same land, on every machine: to share a land, one only has to share its seed.',
        'The land is then cut into a fine grid of tiles, four map units a side, and shared into free domains, one around each village, so that no land is empty. During the first ten seconds each lord plants his standard on the domain he wants, and may move it; when the count ends, that domain is his, whole.',
      ],
    },
    {
      heading: 'The step of a game',
      diagram: 'step',
      body: [
        'A game is a state (who holds each tile, the peasants and the gold of each lord, the armies on the march, the alliances, the caravans) and a step that moves it on, ten times a second. Everything a player can do is an order: attack, build, launch a coup, offer or break an alliance. The bots send the same orders as you, through the same checks: the rules cannot tell a bot from a person.',
        'Each step applies the valid orders, then the rules of a tick, always in the same order: the peasants grow (and those the villages cannot feed fall sick), the armies advance tile by tile, the coups on their way fall, the markets send their caravans along the trade network, the caravans move, alliances run out, and the game is judged. Every figure is a whole number and every draw of chance comes from the seed: given the same orders, every machine computes the same game, tick for tick. That is what will let several players share a game with a server that only passes the orders along.',
      ],
    },
    {
      heading: 'From the state to the screen',
      diagram: 'screen',
      body: [
        'The map is drawn sixty times a second from the state, as a map inked on a manuscript: each land traced around its tiles, washed in its lord’s colour and outlined with a trembling pen; the works drawn small in ink; the armies as two ranks of soldiers on the border they fight over. The figures you read (your peasants, your gold, the race to the share that wins) are read once a second, so that they step rather than run.',
        'A click is turned into an order where the pointer stands: the army in hand enters by the border nearest the click and spreads from there. The screen decides nothing: it shows the state and passes your orders on.',
      ],
    },
    {
      heading: 'What is not there yet',
      body: [
        'Blason is played against nineteen bots, easy, fair or hard as you choose at the home, or online with up to eight players, the empty seats going to bots: in the public room, which starts half a minute after its first player sits, or in a private room joined by its code. Each browser runs its own copy of the game, and a small server, the relay, gathers everyone’s orders every tenth of a second and sends them to all. There are no accounts yet, so no profiles nor rankings, no advertising and no audience measurement.',
        'The code is free software under the AGPL-3.0 licence: it can be read, studied and improved, and whoever runs a modified version on a server must publish it.',
      ],
    },
  ],
  t: {
    seed: 'seed',
    cells: 'cells',
    coast: 'coast, lakes, rivers',
    tiles: 'tiles',
    domains: 'free domains',
    orders: 'orders',
    player: 'you',
    bots: 'bots',
    valid: 'checked',
    rules: 'the rules of a tick',
    state: 'state',
    tick: '10 times a second',
    summary: 'figures',
    hud: 'HUD',
    scene: 'layers',
    map: 'map',
    second: 'once a second',
    frame: 'every frame',
  },
}

export const aboutFr: About = {
  title: 'Comment ça marche',
  lead: 'Blason est une partie de vingt seigneurs sur une terre redessinée à chaque fois. Tout tourne dans votre navigateur : la terre, les bots et chaque coup sont calculés sur votre machine, de la même façon sur toutes les machines.',
  sections: [
    {
      heading: 'Une terre tirée d’une graine',
      diagram: 'seed',
      body: [
        'Chaque partie part d’une graine, un mot court tiré au hasard. Le générateur en tire quelque deux mille points, découpe le cadre en cellules autour d’eux, élève une terre au milieu de la mer, trace sa côte, quelques lacs et rivières. La même graine dessine toujours la même terre, sur toutes les machines : pour partager une terre, il suffit de partager sa graine.',
        'La terre est ensuite découpée en un fin quadrillage de tuiles, de quatre unités de côté, et partagée en domaines libres, un autour de chaque village, si bien qu’aucune terre n’est vide. Pendant les dix premières secondes, chaque seigneur plante son étendard sur le domaine qu’il veut, et peut le déplacer ; à la fin du compte, ce domaine est à lui, entier.',
      ],
    },
    {
      heading: 'Le pas de la partie',
      diagram: 'step',
      body: [
        'Une partie, c’est un état (qui tient chaque tuile, les paysans et l’or de chaque seigneur, les armées en marche, les alliances, les caravanes) et un pas qui le fait avancer, dix fois par seconde. Tout ce qu’un joueur peut faire est un ordre : attaquer, bâtir, lancer un coup d’éclat, proposer ou rompre une alliance. Les bots envoient les mêmes ordres que vous, par les mêmes contrôles : les règles ne distinguent pas un bot d’une personne.',
        'Chaque pas applique les ordres valides, puis les règles d’un pas, toujours dans le même ordre : les paysans croissent (et ceux que les villages ne nourrissent pas tombent malades), les armées avancent tuile par tuile, les coups d’éclat en chemin tombent, les marchés envoient leurs caravanes sur le réseau des routes, les caravanes cheminent, les alliances expirent, et la partie est jugée. Chaque chiffre est un nombre entier et chaque tirage du hasard vient de la graine : avec les mêmes ordres, toutes les machines calculent la même partie, pas pour pas. C’est ce qui permettra à plusieurs joueurs de partager une partie avec un serveur qui ne fait que passer les ordres.',
      ],
    },
    {
      heading: 'De l’état à l’écran',
      diagram: 'screen',
      body: [
        'La carte est dessinée soixante fois par seconde depuis l’état, comme une carte à l’encre sur un manuscrit : chaque terre tracée autour de ses tuiles, lavée de la couleur de son seigneur et cernée d’une plume qui tremble ; les constructions dessinées petites, à l’encre ; les armées en deux rangs de soldats sur la frontière qu’elles se disputent. Les chiffres que vous lisez (vos paysans, votre or, la course à la part qui gagne) sont relus une fois par seconde, pour qu’ils avancent par pas au lieu de défiler.',
        'Un clic devient un ordre là où se trouve le pointeur : l’armée en main entre par la frontière la plus proche du clic et s’étend de là. L’écran ne décide rien : il montre l’état et transmet vos ordres.',
      ],
    },
    {
      heading: 'Ce qui n’y est pas encore',
      body: [
        'Blason se joue contre dix-neuf bots, faciles, moyens ou difficiles au choix de l’accueil, ou en ligne jusqu’à huit joueurs, les places vides allant aux bots : dans la salle publique, qui part une demi-minute après que son premier joueur s’y assoit, ou dans une salle privée qu’on rejoint par son code. Chaque navigateur fait tourner sa propre copie de la partie, et un petit serveur, le relais, réunit les ordres de tous chaque dixième de seconde pour les renvoyer à chacun. Il n’y a pas encore de compte, donc ni profil ni classement, ni publicité, ni mesure d’audience.',
        'Le code est un logiciel libre, sous licence AGPL-3.0 : on peut le lire, l’étudier et l’améliorer, et quiconque en fait tourner une version modifiée sur un serveur doit la publier.',
      ],
    },
  ],
  t: {
    seed: 'graine',
    cells: 'cellules',
    coast: 'côte, lacs, rivières',
    tiles: 'tuiles',
    domains: 'domaines libres',
    orders: 'ordres',
    player: 'vous',
    bots: 'bots',
    valid: 'contrôlés',
    rules: 'les règles d’un pas',
    state: 'état',
    tick: '10 fois par seconde',
    summary: 'chiffres',
    hud: 'HUD',
    scene: 'calques',
    map: 'carte',
    second: 'une fois par seconde',
    frame: 'à chaque image',
  },
}
