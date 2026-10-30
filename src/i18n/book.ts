// The book of the game: the host's lobby before the launch (« créer une
// partie doit envoyer directement dans le lobby »), his menu after it.

export const bookEn = {
  open: 'The book of the game',
  home: 'Back to the home',
  yours: 'Your game',
  hostGame: 'The host’s game',
  waitHost: 'Waiting for the host to launch it',
  going: (minutes: number) =>
    `the game going on, for ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`,
  land: 'The land',
  size: 'The land',
  lands: { drawn: 'An invented land', europe: 'Europe' },
  landLine: (size: string, least: number, most: number) =>
    `${size}, for ${least} to ${most} lords`,
  suits: 'suits this game',
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
  /** As a guest reads it: the host, him, the other guests, the bots. */
  seatedGuest: (bots: number, guests: number) => {
    const others = guests - 1
    const friends = others === 1 ? '1 friend' : `${others} friends`
    const machines = bots === 1 ? '1 bot' : `${bots} bots`
    const company = [
      'the host',
      'you',
      others > 0 ? friends : '',
      bots > 0 ? machines : '',
    ].filter(Boolean)
    return `${company.slice(0, -1).join(', ')} and ${company.at(-1)}`
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
  hostGame: 'La partie de l’hôte',
  waitHost: 'En attente de l’hôte',
  going: (minutes: number) =>
    `la partie en cours, depuis ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`,
  land: 'La terre',
  size: 'La terre',
  lands: { drawn: 'Une terre inventée', europe: 'L’Europe' },
  landLine: (size: string, least: number, most: number) =>
    `${size}, pour ${least} à ${most} seigneurs`,
  suits: 'conseillée pour cette partie',
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
  seatedGuest: (bots: number, guests: number) => {
    const others = guests - 1
    const friends = others === 1 ? '1 ami' : `${others} amis`
    const machines = bots === 1 ? '1 bot' : `${bots} bots`
    const company = [
      'l’hôte',
      'toi',
      others > 0 ? friends : '',
      bots > 0 ? machines : '',
    ].filter(Boolean)
    return `${company.slice(0, -1).join(', ')} et ${company.at(-1)}`
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
