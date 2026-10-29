import { blogFr } from './blog'
import { homeFr } from './home'
import { heraldsFr } from './heralds'
import { hintsFr } from './hints'
import type { Messages } from './en'

export const fr: Messages = {
  blog: blogFr,
  heralds: heraldsFr,
  hints: hintsFr,
  common: {
    author: 'Cédric Lucchese',
    about: 'Comment ça marche',
    legal: 'Mentions légales',
  },
  home: homeFr,
  game: {
    map: 'La terre de la partie, vue d’en haut',
    choose: 'Plante ton étendard',
    chooseHint:
      'Clique où tu veux sur la terre ; tu peux le déplacer jusqu’à la fin du compte',
    planted: 'Ton étendard est planté',
    others: 'Les seigneurs plantent leurs étendards',
    plantedHint:
      'Clique ailleurs pour le déplacer ; la terre autour sera à toi à la fin du compte',
    tooNear: 'trop près d’un autre étendard',
    click: 'clic : attaquer',
    noLevy: {
      village: 'tous tes villages ont une armée dehors',
      market: 'aucun marché libre pour les engager',
    },
    noMen: {
      village: 'pas de paysans à lever',
      market: 'pas assez d’or',
    },
    armies: {
      raid: 'Chevauchée',
      host: 'Ost',
      ban: 'Arrière-ban',
      mercenaries: 'Mercenaires',
    },
    works: {
      village: 'Village',
      market: 'Marché',
      castle: 'Château',
    },
    coups: {
      troublemaker: 'Causeur de troubles',
      archers: 'Archers',
      fire: 'Feu grégeois',
    },
    launch: 'clic : lancer',
    beyond: {
      troublemaker: 'seulement sur la terre d’un autre',
      archers: 'trop loin de ta frontière',
      fire: 'trop loin de ta frontière',
    },
    noGold: 'pas assez d’or',
    percent: (n: number) => `${n}\u202f%`,
    victory: 'Victoire',
    winner: 'remporte la partie',
    fallen: 'Ton royaume est tombé',
    playAgain: 'Rejouer',
    watchEnd: 'Regarder la fin',
    colors: {
      azure: 'Azur',
      gules: 'Gueules',
      vert: 'Sinople',
      purpure: 'Pourpre',
      or: 'Or',
      sable: 'Sable',
      orange: 'Orangé',
      sky: 'Céleste',
      sanguine: 'Sanguine',
      apple: 'Pomme',
      rose: 'Rose',
      brown: 'Brun',
      turquoise: 'Turquoise',
      lavender: 'Lavande',
      olive: 'Olive',
      coral: 'Corail',
      navy: 'Marine',
      peacock: 'Canard',
      plum: 'Prune',
      slate: 'Ardoise',
    },
  },
  race: {
    toWin: (share: number) => `pour gagner : ${share}\u202f%`,
    dropsIn: (left: string) => `pour gagner, baisse dans ${left}`,
  },
  menu: {
    label: (lord: string) => `Que faire avec ${lord}`,
    attack: 'Attaquer',
    alliance: {
      offer: 'Alliance',
      accept: 'Valider l’alliance',
      renew: 'Renouveler l’alliance',
      break: 'Rompre l’alliance',
      asked: 'Alliance demandée',
    },
    offering: 'Offrande',
    hint: 'clic droit : alliance, offrande',
    hintTouch: 'appui long : alliance, offrande',
  },
  lord: {
    allied: 'Ton allié',
    atWar: 'En guerre avec toi',
    felon: 'Félon',
    list: 'Les seigneurs',
    you: 'toi',
  },
  camera: {
    zoomIn: 'Rapprocher',
    zoomOut: 'Éloigner',
    home: 'Revenir à ta terre',
  },
  errors: {
    title: 'Une erreur est survenue',
    tryReload: 'Essayez de recharger la page.',
    reload: 'Recharger',
    pageNotFound: "Cette page n'existe pas.",
    backHome: "Retour à l'accueil",
  },
}
