// The hints: what each piece of the HUD does, said under the pointer
// (« ajoute des helpers », hover bubbles chosen), a title and a line or two,
// with its figures. The rules they tell are those of docs/RULES.md.

export const hintsEn = {
  peasants: {
    title: 'Peasants',
    fed: (land: string, villages: number, fed: string) =>
      `Your land feeds ${land}, your ${villages} ${villages === 1 ? 'village' : 'villages'} ${fed} more.`,
    born: (born: string, cap: string) =>
      `${born} are born a second, up to ${cap}. They hold your land and are levied into armies.`,
    full: 'Your land and villages feed no more: take land or build a village.',
    sick: (dying: string) =>
      `Too many for your land and villages: ${dying} die of sickness a second.`,
  },
  gold: {
    title: 'Gold',
    line: 'Your markets’ caravans bring it, and free land taken. It pays the works, the coups and the mercenaries.',
    earned: (gold: string) => `Earned since the start: ${gold}.`,
  },
  armies: {
    raid: 'Levies 10 % of your peasants at your free village nearest the front; a quarter faster.',
    host: 'Levies 25 % of your peasants at your free village nearest the front.',
    ban: 'Levies 50 % of your peasants at your free village nearest the front; a quarter slower.',
    mercenaries:
      'Hired for gold at your free market nearest the front, 2 gold a man: your peasants stay home.',
    men: (men: string) => `${men} men would go now.`,
    oneEach: 'Each village sends one army at a time, each market one company.',
  },
  works: {
    village: 'Feeds 60 more peasants and levies your armies, one at a time.',
    market:
      'Sends caravans to the markets within 40 tiles; each arriving pays gold to both.',
    castle:
      'Its land within 12 tiles is held twice as well, and its archers shoot the armies biting it.',
    price: 'Each one costs double the one before.',
  },
  coups: {
    troublemaker:
      'Walks to another lord’s land and raises it: 6 tiles round turn free, held by rebels.',
    archers:
      'A volley near your border, 2 seconds later: every enemy army under it loses 30 % of its men.',
    fire: 'Falls anywhere 8 seconds later: the enemies’ works within 12 tiles burn, and no one builds there for a minute.',
    price: 'Each one launched costs double the one before.',
  },
  race: {
    title: 'The race',
    line: (needed: number) =>
      `Hold ${needed} % of the land to win. Your shield and the leader’s on the line; the flag at the share that wins.`,
    drops:
      'From the tenth minute the share needed drops by 5 points a minute, down to 50 %.',
  },
}

export type HintsMessages = typeof hintsEn

export const hintsFr: HintsMessages = {
  peasants: {
    title: 'Paysans',
    fed: (land: string, villages: number, fed: string) =>
      `Ta terre en nourrit ${land}, ${villages === 1 ? 'ton village' : 'tes ' + villages + ' villages'} ${fed} de plus.`,
    born: (born: string, cap: string) =>
      `Il en naît ${born} par seconde, jusqu’à ${cap}. Ils tiennent ta terre et se lèvent en armées.`,
    full: 'Ta terre et tes villages n’en nourrissent pas plus : prends de la terre ou bâtis un village.',
    sick: (dying: string) =>
      `Trop pour ta terre et tes villages : ${dying} meurent de maladie par seconde.`,
  },
  gold: {
    title: 'Or',
    line: 'Les caravanes de tes marchés le rapportent, et la terre libre prise. Il paie les constructions, les coups et les mercenaires.',
    earned: (gold: string) => `Gagné depuis le début : ${gold}.`,
  },
  armies: {
    raid: 'Lève 10 % de tes paysans à ton village libre le plus proche du front ; un quart plus rapide.',
    host: 'Lève 25 % de tes paysans à ton village libre le plus proche du front.',
    ban: 'Lève 50 % de tes paysans à ton village libre le plus proche du front ; un quart plus lent.',
    mercenaries:
      'Engagés pour de l’or à ton marché libre le plus proche du front, 2 pièces l’homme : tes paysans restent chez eux.',
    men: (men: string) => `${men} hommes partiraient maintenant.`,
    oneEach:
      'Chaque village envoie une armée à la fois, chaque marché une compagnie.',
  },
  works: {
    village: 'Nourrit 60 paysans de plus et lève tes armées, une à la fois.',
    market:
      'Envoie des caravanes vers les marchés à 40 tuiles ; chacune qui arrive paie de l’or aux deux.',
    castle:
      'Sa terre à 12 tuiles se tient deux fois mieux, et ses archers tirent sur les armées qui la mordent.',
    price: 'Chacun coûte le double du précédent.',
  },
  coups: {
    troublemaker:
      'Marche jusqu’à la terre d’un autre seigneur et la soulève : 6 tuiles autour redeviennent libres, tenues par des rebelles.',
    archers:
      'Une volée près de ta frontière, 2 secondes après : chaque armée ennemie dessous perd 30 % de ses hommes.',
    fire: 'Tombe n’importe où 8 secondes après : les constructions ennemies à 12 tuiles brûlent, et personne n’y bâtit pendant une minute.',
    price: 'Chacun lancé coûte le double du précédent.',
  },
  race: {
    title: 'La course',
    line: (needed: number) =>
      `Tiens ${needed} % de la terre pour gagner. Ton écu et celui du premier sur la ligne ; le fanion à la part qui gagne.`,
    drops:
      'Dès la dixième minute, la part exigée baisse de 5 points par minute, jusqu’à 50 %.',
  },
}
