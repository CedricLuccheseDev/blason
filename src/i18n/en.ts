import { blogEn } from './blog'
import { homeEn } from './home'
import { heraldsEn } from './heralds'
import { hintsEn } from './hints'
import { bookEn } from './book'

export const en = {
  blog: blogEn,
  heralds: heraldsEn,
  hints: hintsEn,
  book: bookEn,
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
    noLevy: {
      village: 'every village of yours has an army out',
      market: 'no market free to hire them at',
    },
    noMen: {
      village: 'no peasants to raise',
      market: 'not enough gold',
    },
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
    campaign: 'On campaign',
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
  // The right click's menu on another lord's land (LordMenu.tsx), and the
  // cartouche's word that a right click opens it.
  menu: {
    label: (lord: string) => `What to do with ${lord}`,
    attack: 'Attack',
    // The alliance's line says what it does now.
    alliance: {
      offer: 'Alliance',
      accept: 'Accept the alliance',
      renew: 'Renew the alliance',
      break: 'Break the alliance',
      asked: 'Alliance asked',
    },
    offering: 'Offering',
    hint: 'right click: alliance, offering',
    options: 'Alliance, offering',
    hintTouch: 'long press: alliance, offering',
  },
  lord: {
    allied: 'Your ally',
    atWar: 'At war with you',
    felon: 'Traitor',
    list: 'The lords',
    you: 'you',
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
