import { blogEn } from './blog'
import { homeEn } from './home'
import { heraldsEn } from './heralds'

export const en = {
  blog: blogEn,
  heralds: heraldsEn,
  common: {
    author: 'Cédric Lucchese',
    about: 'How it works',
    legal: 'Legal notice',
  },
  home: homeEn,
  game: {
    map: 'The land of the game, seen from above',
    choose: 'Plant your standard',
    chooseHint:
      'Click anywhere on the land; you may move it until the count ends',
    planted: 'Your standard is planted',
    others: 'The lords are planting their standards',
    plantedHint:
      'Click elsewhere to move it; the land round it is yours when the count ends',
    tooNear: 'too near another standard',
    click: 'click: attack',
    noLevy: 'every village of yours has an army out',
    armies: {
      raid: 'Raid',
      host: 'Host',
      ban: 'Levy',
      mercenaries: 'Mercenaries',
    },
    works: {
      village: 'Village',
      market: 'Market',
      castle: 'Castle',
    },
    coups: {
      troublemaker: 'Troublemaker',
      archers: 'Archers',
      fire: 'Greek fire',
    },
    launch: 'click: launch',
    beyond: {
      troublemaker: 'only on another lord’s land',
      archers: 'too far from your border',
      fire: 'too far from your border',
    },
    noGold: 'not enough gold',
    percent: (n: number) => `${n}%`,
    victory: 'Victory',
    winner: 'wins the game',
    fallen: 'Your realm has fallen',
    playAgain: 'Play again',
    watchEnd: 'Watch the end',
    colors: {
      azure: 'Azure',
      gules: 'Gules',
      vert: 'Vert',
      purpure: 'Purpure',
      or: 'Or',
      sable: 'Sable',
      orange: 'Orange',
      sky: 'Sky',
      sanguine: 'Sanguine',
      apple: 'Apple',
      rose: 'Rose',
      brown: 'Brown',
      turquoise: 'Turquoise',
      lavender: 'Lavender',
      olive: 'Olive',
      coral: 'Coral',
      navy: 'Navy',
      peacock: 'Peacock',
      plum: 'Plum',
      slate: 'Slate',
    },
  },
  race: {
    toWin: (share: number) => `to win: ${share}%`,
    dropsIn: (left: string) => `to win, drops in ${left}`,
  },
  pacts: {
    ally: 'Alliance',
    asked: 'Offered',
    accept: 'Accept',
    break: 'Break',
  },
  lord: {
    allied: 'Your ally',
    atWar: 'At war with you',
    felon: 'Traitor',
    list: 'The lords',
    you: 'you',
  },
  camera: {
    zoomIn: 'Closer',
    zoomOut: 'Farther',
    home: 'Back to your land',
  },
  errors: {
    title: 'Something went wrong',
    tryReload: 'Try reloading the page.',
    reload: 'Reload',
    pageNotFound: 'This page does not exist.',
    backHome: 'Back home',
  },
}

export type Messages = typeof en
