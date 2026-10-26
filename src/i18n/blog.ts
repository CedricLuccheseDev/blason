// Blog copy, kept out of the main dictionaries: it is the one section shared
// verbatim across projects, so it travels as a file rather than as a block to
// re-paste. Only metaTitle and metaDescription are rewritten per project.
export const blogEn = {
  title: 'Blog',
  intro: 'What gets written, and what ships.',
  empty: 'Nothing published yet.',
  post: 'Post',
  release: 'Version',
  read: 'Read',
  back: 'All posts',
  metaTitle: 'Blason blog',
  metaDescription:
    'How Blason is built, brick by brick, and its release notes.',
}

export const blogFr: typeof blogEn = {
  title: 'Blog',
  intro: 'Ce qui s’écrit, et ce qui sort.',
  empty: 'Rien de publié pour le moment.',
  post: 'Article',
  release: 'Version',
  read: 'Lire',
  back: 'Tous les articles',
  metaTitle: 'Blog Blason',
  metaDescription:
    'Comment Blason se construit, brique par brique, et ses notes de version.',
}
