import type { BookMessages } from './book'

// The book of the game's words in French (book.ts, the English).

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
  lands: {
    small: 'Une petite terre',
    standard: 'Une terre moyenne',
    large: 'Une grande terre',
    huge: 'Une terre immense',
    britain: 'Les îles Britanniques',
    france: 'La France',
    mediterranean: 'La Méditerranée',
    europe: 'L’Europe',
    world: 'Le monde',
    middle: 'La Terre du Milieu',
    westeros: 'Westeros et Essos',
  },
  landLine: (size: string, least: number, most: number) =>
    `${size}, pour ${least} à ${most} seigneurs`,
  suits: 'conseillée pour cette partie',
  suited: 'conseillée',
  sizes: {
    small: 'Petite',
    standard: 'Moyenne',
    large: 'Grande',
    huge: 'Immense',
  },
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
  randomLands: 'Aléatoires',
  earthLands: 'La Terre',
  legendLands: 'Légendes',
  random: {
    small: 'Petite',
    standard: 'Moyenne',
    large: 'Grande',
    huge: 'Immense',
  },
  reroll: 'Clic : une autre',
  cardLine: (size: string, least: number, most: number) =>
    `${size} · ${least} à ${most} seigneurs`,
  copyLink: 'Copier le lien',
  free: 'Libre',
  back: 'Retour',
  linkCopied: 'Lien copié',
  short: (s: number) => `${s} s`,
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
  opening: 'Temps pour planter son étendard',
  team: (n: string) => `Équipe ${n}`,
  level1: { easy: 'Facile', normal: 'Moyen', hard: 'Difficile' },
  moveTeam: 'Vers l’équipe suivante',
  nextLevel: 'Son niveau : clic pour le suivant',
  freeSeats: (n: number) => `${n} sièges libres`,
  botsCount: (n: number) => (n === 1 ? '1 bot' : `${n} bots`),
  of: (most: number) => `sur ${most}`,
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
