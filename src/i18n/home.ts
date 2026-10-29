// The words of the home: the title, the lord, the public game, the
// solo game's settings, the private rooms, the journal.

export const homeEn = {
  name: 'Blason',
  menu: 'Menu',
  lord: 'Lord',
  close: 'Close',
  levels: { easy: 'Easy', normal: 'Fair', hard: 'Hard' },
  public: {
    title: 'Public game',
    live: 'The lords are planting their standards',
    waiting: 'A lord is waiting for you',
    land: 'The land of the game being planted',
    lost: 'Online play is out of reach for now.',
    play: 'Play',
    entering: 'Entering the game…',
    closesIn: 'Starts in',
  },
  create: 'Create a game',
  joinPrivate: 'Join with a code',
  journal: 'Journal',
  journalAll: 'The whole journal',
  room: {
    unavailable: 'Online play is not available here.',
    joining: 'Taking a seat…',
    seated: 'Players',
    lost: 'The line to the room is lost.',
    retry: 'Try again',
    errors: {
      full: 'That room is full.',
      unknown: 'No room by that code.',
      started: 'That game has already begun.',
      gone: 'The host has left: the game will not begin.',
    },
  },
  privateRoom: {
    title: 'Private game',
    code: 'The room’s code',
    note: 'Five characters, given by the host.',
    yours: 'Give this code to your friends.',
    joined: 'You are in the room.',
    char: (i: number) => `Character ${i} of the code`,
    start: 'Start',
    waitHost: 'The host will start the game.',
  },
}

export type HomeMessages = typeof homeEn

export const homeFr: HomeMessages = {
  name: 'Blason',
  menu: 'Menu',
  lord: 'Seigneur',
  close: 'Fermer',
  levels: { easy: 'Faciles', normal: 'Moyens', hard: 'Difficiles' },
  public: {
    title: 'Partie publique',
    live: 'Les seigneurs plantent leurs étendards',
    waiting: 'Un seigneur t’attend',
    land: 'La terre de la partie en cours de pose',
    lost: 'Le jeu en ligne est hors d’atteinte pour l’instant.',
    play: 'Jouer',
    entering: 'On entre dans la partie…',
    closesIn: 'Commence dans',
  },
  create: 'Créer une partie',
  joinPrivate: 'Rejoindre avec un code',
  journal: 'Le Journal',
  journalAll: 'Tout le journal',
  room: {
    unavailable: 'Le jeu en ligne n’est pas disponible ici.',
    joining: 'On prend place…',
    seated: 'Joueurs',
    lost: 'La liaison avec la salle est perdue.',
    retry: 'Réessayer',
    errors: {
      full: 'Cette salle est pleine.',
      unknown: 'Aucune salle à ce code.',
      started: 'Cette partie a déjà commencé.',
      gone: 'L’hôte est parti : la partie ne commencera pas.',
    },
  },
  privateRoom: {
    title: 'Partie privée',
    code: 'Le code de la salle',
    note: 'Cinq signes, donnés par l’hôte.',
    yours: 'Donne ce code à tes amis.',
    joined: 'Tu es dans la salle.',
    char: (i: number) => `Signe ${i} du code`,
    start: 'Lancer',
    waitHost: 'L’hôte lancera la partie.',
  },
}
