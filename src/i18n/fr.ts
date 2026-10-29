import { blogFr } from './blog'
import { homeFr } from './home'
import { heraldsFr } from './heralds'
import type { Messages } from './en'

export const fr: Messages = {
  blog: blogFr,
  heralds: heraldsFr,
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
      'Clique un domaine libre ; tu peux changer jusqu’à la fin du compte',
    planted: 'Ton étendard est planté',
    others: 'Les seigneurs plantent leurs étendards',
    plantedHint:
      'Clique un autre domaine libre pour le déplacer ; il sera à toi à la fin du compte',
    click: 'clic : attaquer',
    noLevy: 'tous tes villages ont une armée dehors',
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
  pacts: {
    ally: 'Alliance',
    asked: 'Proposée',
    accept: 'Accepter',
    break: 'Rompre',
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
