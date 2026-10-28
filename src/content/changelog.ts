// Release history, written by /dev-release and editable by hand afterwards.
// Newest first. One entry per release, both languages, no commit noise: only
// what changed for the visitor.
export type Release = {
  version: string
  /** ISO date, YYYY-MM-DD. */
  date: string
  en: Array<string>
  fr: Array<string>
}

export const releases: Array<Release> = [
  {
    version: '0.4.0',
    date: '2026-10-28',
    en: [
      'Bots to your measure: easy, fair or hard, chosen at the home, and they strike back when their land is bitten.',
      'Three coups (keys 7 to 9): the troublemaker raises a land, archers thin an army, Greek fire burns the works.',
      'Villages levy the armies, each at its own pace (the raid quick, the levy slow), battles are seen, and sickness strikes the peasants beyond the cap.',
      'A trade network by range: caravans go from market to market toward a destination drawn by lot, and can be taken on the way.',
      'A map that grows richer as you come closer, green borders between allies and red ones at war, a larger and clearer HUD.',
    ],
    fr: [
      'Des bots à ta mesure : faciles, moyens ou difficiles, choisis à l’accueil, et qui ripostent quand on mord leur terre.',
      'Trois coups d’éclat (touches 7 à 9) : le causeur de troubles soulève une terre, les archers déciment une armée, le feu grégeois brûle les constructions.',
      'Les villages lèvent les armées, chacune à son allure (la chevauchée rapide, l’arrière-ban lent), les batailles se voient, et la maladie frappe les paysans en trop.',
      'Un réseau de marchés à portée : les caravanes vont de marché en marché, vers une destination tirée au sort, et se prennent en route.',
      'Une carte qui s’enrichit quand on s’approche, des frontières vertes entre alliés et rouges à la guerre, un HUD plus grand et plus lisible.',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-10-28',
    en: [
      'Blason plays in the browser: twenty lords on a land drawn anew each game, taken tile by tile, against nineteen bots.',
      'Peasants who hold the land, gold that pays the men raised in three armies, and villages, castles and markets placed freely.',
      'Five-minute alliances, traitors marked for all to see, and merchants’ caravans between markets.',
      'A title screen with a game of bots filmed behind the menu: one click on Play and the game begins.',
      'A “How it works” page and the legal notice.',
    ],
    fr: [
      'Blason se joue dans le navigateur : vingt seigneurs sur une terre redessinée à chaque partie, prise tuile par tuile, contre dix-neuf bots.',
      'Des paysans qui tiennent la terre, l’or qui paie les hommes qu’on lève en trois armées, et des villages, châteaux et marchés posés librement.',
      'Des alliances de cinq minutes, les félons marqués aux yeux de tous, et les caravanes des marchands entre les marchés.',
      'Un écran titre avec une partie de bots filmée derrière le menu : un clic sur Jouer et la partie commence.',
      'Une page « Comment ça marche » et les mentions légales.',
    ],
  },
]
