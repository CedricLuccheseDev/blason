// The book of the game: the host's lobby before the launch (« créer une
// partie doit envoyer directement dans le lobby »), his menu after it.

export const bookEn = {
  open: 'The book of the game',
  home: 'Back to the home',
  yours: 'Your game',
  going: (minutes: number) =>
    `the game going on, for ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`,
  land: 'The land',
  size: 'Its size',
  sizes: { standard: 'Standard', large: 'Large', huge: 'Huge' },
  another: 'Another land',
  or: 'or',
  lords: 'The lords',
  seated: (bots: number) => {
    if (bots === 0) return 'you alone'
    return `you and ${bots} ${bots === 1 ? 'bot' : 'bots'}`
  },
  you: 'You',
  bot: 'bot',
  bots: 'The bots',
  level: 'Their level',
  levels: { easy: 'Easy', normal: 'Fair', hard: 'Hard' },
  teams: 'The teams',
  none: 'None',
  opening: 'The planting',
  seconds: (s: number) => `${s} seconds`,
  next: 'These settings will hold for the next land.',
  see: 'See the map',
  launch: 'Launch the game',
  close: 'Close',
  restart: 'Start again',
  quit: 'Leave the game',
  less: 'Fewer',
  more: 'More',
}

export type BookMessages = typeof bookEn

export const bookFr: BookMessages = {
  open: 'Le livre de la partie',
  home: 'Revenir à l’accueil',
  yours: 'Ta partie',
  going: (minutes: number) =>
    `la partie en cours, depuis ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`,
  land: 'La terre',
  size: 'Sa taille',
  sizes: { standard: 'Standard', large: 'Grande', huge: 'Immense' },
  another: 'Une autre terre',
  or: 'ou',
  lords: 'Les seigneurs',
  seated: (bots: number) => {
    if (bots === 0) return 'toi seul'
    return `toi et ${bots} ${bots === 1 ? 'bot' : 'bots'}`
  },
  you: 'Toi',
  bot: 'bot',
  bots: 'Les bots',
  level: 'Leur niveau',
  levels: { easy: 'Faciles', normal: 'Moyens', hard: 'Difficiles' },
  teams: 'Les équipes',
  none: 'Aucune',
  opening: 'La pose',
  seconds: (s: number) => `${s} secondes`,
  next: 'Ces réglages vaudront pour la prochaine terre.',
  see: 'Voir la carte',
  launch: 'Lancer la partie',
  close: 'Fermer',
  restart: 'Recommencer',
  quit: 'Quitter la partie',
  less: 'Moins',
  more: 'Plus',
}
