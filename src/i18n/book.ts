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
  seated: (bots: number, guests = 0) => {
    const friends = guests === 1 ? '1 friend' : `${guests} friends`
    const machines = bots === 1 ? '1 bot' : `${bots} bots`
    const company = [guests > 0 ? friends : '', bots > 0 ? machines : '']
      .filter(Boolean)
      .join(' and ')
    return company ? `you, ${company}` : 'you alone'
  },
  guest: 'a friend',
  invite: 'Invite',
  copy: 'Copy',
  copied: 'Copied',
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
  seated: (bots: number, guests = 0) => {
    const friends = guests === 1 ? '1 ami' : `${guests} amis`
    const machines = bots === 1 ? '1 bot' : `${bots} bots`
    const company = [guests > 0 ? friends : '', bots > 0 ? machines : '']
      .filter(Boolean)
      .join(' et ')
    return company ? `toi, ${company}` : 'toi seul'
  },
  guest: 'un ami',
  invite: 'Inviter',
  copy: 'Copier',
  copied: 'Copié',
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
