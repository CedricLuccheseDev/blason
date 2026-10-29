// The hints: what each piece of the HUD does, said under the pointer
// (« ajoute des helpers »), a title and a short line or two, its figures
// first (« trop de texte, c'est un jeu, ça doit être rapide à lire »). The
// rules they tell are those of docs/RULES.md.

export const hintsEn = {
  home: { title: 'My land', line: 'Click: the camera back on it' },
  peasants: {
    title: 'Peasants',
    fed: (land: string, villages: number, fed: string) =>
      `Land ${land}, ${villages} ${villages === 1 ? 'village' : 'villages'} ${fed}`,
    born: (born: string, cap: string) => `+${born}/s up to ${cap}`,
    full: 'Full: take land or build a village',
    sick: (dying: string) => `−${dying}/s: too many`,
  },
  gold: {
    title: 'Gold',
    line: 'From caravans and land taken',
    earned: (gold: string) => `Earned: ${gold}`,
  },
  armies: {
    raid: '10 % of your peasants, fast',
    host: '25 % of your peasants',
    ban: '50 % of your peasants, slow',
    mercenaries: 'Paid in gold, 2 a man',
    men: (men: string) => `${men} men`,
  },
  works: {
    village: '+60 peasants, levies armies',
    market: 'A caravan every 10 s, paid on arrival; hires mercenaries',
    castle: 'Holds its land, shoots',
  },
  coups: {
    troublemaker: 'Raises an enemy land',
    archers: 'A volley: −30 % of an army',
    trebuchet: 'Its flaming stone burns the works where it falls',
  },
  race: {
    title: 'The race',
    line: (needed: number) => `Hold ${needed} % of the land`,
    drops: '−5 points a minute from the 10th',
  },
}

export type HintsMessages = typeof hintsEn

export const hintsFr: HintsMessages = {
  home: { title: 'Ma terre', line: 'Clic : la caméra y revient' },
  peasants: {
    title: 'Paysans',
    fed: (land: string, villages: number, fed: string) =>
      `Terre ${land}, ${villages} ${villages === 1 ? 'village' : 'villages'} ${fed}`,
    born: (born: string, cap: string) => `+${born}/s jusqu’à ${cap}`,
    full: 'Plein : prends de la terre ou bâtis un village',
    sick: (dying: string) => `−${dying}/s : trop de monde`,
  },
  gold: {
    title: 'Or',
    line: 'Les caravanes et la terre prise',
    earned: (gold: string) => `Gagné : ${gold}`,
  },
  armies: {
    raid: '10 % de tes paysans, rapide',
    host: '25 % de tes paysans',
    ban: '50 % de tes paysans, lent',
    mercenaries: 'Payés en or, 2 l’homme',
    men: (men: string) => `${men} hommes`,
  },
  works: {
    village: '+60 paysans, lève les armées',
    market:
      'Une caravane toutes les 10 s, payée à l’arrivée ; engage les mercenaires',
    castle: 'Tient sa terre, tire des flèches',
  },
  coups: {
    troublemaker: 'Soulève une terre ennemie',
    archers: 'Une volée : −30 % d’une armée',
    trebuchet: 'Son boulet enflammé brûle les constructions',
  },
  race: {
    title: 'La course',
    line: (needed: number) => `Tenir ${needed} % de la terre`,
    drops: '−5 points par minute dès la 10ᵉ',
  },
}
