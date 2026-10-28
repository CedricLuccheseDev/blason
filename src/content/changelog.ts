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
