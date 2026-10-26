import { blogEn } from './blog'

export const en = {
  blog: blogEn,
  common: {
    author: 'Cédric Lucchese',
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
