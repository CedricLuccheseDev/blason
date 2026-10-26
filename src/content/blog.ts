import type { Post } from './posts'
import type { Release } from './changelog'
import type { Locale } from '~/i18n/locale'

// One column, two kinds of card. A post carries a written body, so its card is
// a teaser opening `/blog/<slug>`. A release carries three or four lines and
// nothing more, so its card shows them where they are: opening a page to
// re-read what the card already said would be a wasted click.
export type BlogCard =
  | {
      kind: 'post'
      date: string
      slug: string
      title: string
      excerpt: string
    }
  | {
      kind: 'release'
      date: string
      version: string
      lines: Array<string>
    }

export function mergeCards(
  posts: Array<Post>,
  history: Array<Release>,
  locale: Locale,
): Array<BlogCard> {
  const cards: Array<BlogCard> = [
    ...posts.map((post): BlogCard => ({
      kind: 'post',
      date: post.date,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
    })),
    ...history.map((release): BlogCard => ({
      kind: 'release',
      date: release.date,
      version: release.version,
      lines: release[locale],
    })),
  ]

  // Newest first, and a post outranks the release it ships with: the reader
  // came for what was written, not for the version number that carried it.
  return cards.sort((a, b) => b.date.localeCompare(a.date) || rank(a) - rank(b))
}

function rank(card: BlogCard): number {
  return card.kind === 'post' ? 0 : 1
}
