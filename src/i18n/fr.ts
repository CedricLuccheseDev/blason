import { blogFr } from './blog'
import type { Messages } from './en'

export const fr: Messages = {
  blog: blogFr,
  common: {
    author: 'Cédric Lucchese',
  },
  errors: {
    title: 'Une erreur est survenue',
    tryReload: 'Essayez de recharger la page.',
    reload: 'Recharger',
    pageNotFound: "Cette page n'existe pas.",
    backHome: "Retour à l'accueil",
  },
}
