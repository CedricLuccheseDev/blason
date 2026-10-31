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
    plantedHint: 'Click elsewhere to move it',
    tooNear: 'too near another standard',
    click: 'click: attack',
    noLevy: {
      village: 'no army',
      market: 'no market free to hire them at',
    },
    noMen: {
      village: 'no peasants to raise',
      market: 'not enough gold',
    },
    armies: {
      raid: 'Small troop',
      host: 'Troop',
      ban: 'Large troop',
      mercenaries: 'Mercenaries',
    },
    works: {
      village: 'Village',
      market: 'Market',
      castle: 'Castle',
      port: 'Port',
    },
    coups: {
      troublemaker: 'Troublemaker',
      archers: 'Volley',
      trebuchet: 'Trebuchet',
    },
    warship: 'Warship',
    families: { armies: 'Armies', works: 'Buildings', coups: 'Strikes' },
    launch: 'click: launch',
    campaign: 'On campaign',
    seek: (army: string) => `See: ${army}`,
    beyond: {
      troublemaker: 'only on another lord’s land',
      archers: 'too far from your border',
      trebuchet: 'too far from your border',
    },
    noGold: 'not enough gold',
    percent: (n: number) => `${n}%`,
    victory: 'Victory',
    winner: 'wins the game',
    fallen: 'Your realm has fallen',
    playAgain: 'Play again',
    quit: 'Leave',
    watchEnd: 'Watch the end',
    deeds: {
      title: 'Your course',
      played: 'Time played',
      widest: 'Land at its widest',
      land: (share: number, tiles: string) =>
        `${share}\u202f% · ${tiles} tiles`,
      place: 'Your place',
      rank: (place: number, of: number) => {
        // 1st, 2nd, 3rd, then th, and 11th to 13th.
        const teen = place % 100 >= 11 && place % 100 <= 13
        const tail = teen
          ? 'th'
          : (['th', 'st', 'nd', 'rd'][place % 10] ?? 'th')
        return `${place}${tail} of ${of}`
      },
      peasants: 'Peasants at their most',
      gold: 'Gold gained',
    },
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
      amaranth: 'Amaranth',
      ochre: 'Ochre',
      indigo: 'Indigo',
      mint: 'Mint',
    },
  },
  race: {
    dropsIn: (left: string) => `to win, drops in ${left}`,
    win: 'to win:',
    goal: (share: number) => `to win: ${share}% of the land`,
  },
  // The right click's menu on another lord's land (LordMenu.tsx), and the
  // cartouche's word that a right click opens it.
  menu: {
    label: (lord: string) => `What to do with ${lord}`,
    build: 'Build here',
    sea: 'At sea',
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
  // The settings' sheet, beside the game's name and the player on the home (Settings.tsx).
  settings: {
    open: 'Settings',
    title: 'Settings',
    volumes: {
      all: 'Main volume',
      music: 'Music',
      beds: 'Ambience',
      effects: 'Effects',
    },
    mute: 'Sound',
    on: 'On',
    off: 'Cut',
    language: 'The language',
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
