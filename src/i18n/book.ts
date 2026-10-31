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
  lands: {
    small: 'A small land',
    standard: 'A middling land',
    large: 'A great land',
    huge: 'A vast land',
    britain: 'The British Isles',
    france: 'France',
    mediterranean: 'The Mediterranean',
    europe: 'Europe',
    world: 'The World',
    middle: 'Middle-earth',
    westeros: 'Westeros and Essos',
  },
  landLine: (size: string, least: number, most: number) =>
    `${size}, for ${least} to ${most} lords`,
  suits: 'suits this game',
  suited: 'suits',
  sizes: {
    small: 'Small',
    standard: 'Middling',
    large: 'Large',
    huge: 'Huge',
  },
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
  randomLands: 'Random lands',
  earthLands: 'The Earth',
  legendLands: 'Legends',
  random: {
    small: 'Small',
    standard: 'Middling',
    large: 'Great',
    huge: 'Vast',
  },
  reroll: 'Click: another',
  cardLine: (size: string, least: number, most: number) =>
    `${size} · ${least} to ${most} lords`,
  copyLink: 'Copy the link',
  free: 'Free',
  back: 'Back',
  linkCopied: 'Link copied',
  short: (s: number) => `${s} s`,
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
  opening: 'Time to plant one’s standard',
  team: (n: string) => `Team ${n}`,
  level1: { easy: 'Easy', normal: 'Fair', hard: 'Hard' },
  moveTeam: 'To the next team',
  nextLevel: 'Its level: click for the next',
  freeSeats: (n: number) => `${n} seats free`,
  botsCount: (n: number) => (n === 1 ? '1 bot' : `${n} bots`),
  of: (most: number) => `of ${most}`,
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
