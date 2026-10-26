import { marked } from 'marked'
import { parseFrontmatter } from './frontmatter'
import type { Locale } from '~/i18n/locale'

// Blog posts, written as Markdown in `src/content/posts/<slug>.<locale>.md`
// with a `title`, `date` and `excerpt` in the frontmatter. The build inlines
// these as the baseline; the server overlays whatever was dropped in its
// mounted directory (posts.runtime.ts), so a post publishes without a deploy.
// A post published in one language only shows up in that language, which
// keeps a half-translated page from ever reaching a reader.
export type Post = {
  slug: string
  /** ISO date, YYYY-MM-DD. */
  date: string
  title: string
  excerpt: string
  html: string
}

const FILENAME = /^(.+)\.(en|fr)\.md$/

const sources: Record<string, string> = import.meta.glob('./posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Parse `<slug>.<locale>.md` sources into posts, newest first. Keys may carry
// a directory prefix; only the basename decides the slug and the locale.
export function parsePosts(
  input: Record<string, string>,
): Record<Locale, Array<Post>> {
  const byLocale: Record<Locale, Array<Post>> = { en: [], fr: [] }

  for (const [path, source] of Object.entries(input)) {
    const name = path.split('/').pop() ?? ''
    const parts = FILENAME.exec(name)
    if (!parts) continue

    const [, slug, locale] = parts
    const { data, body } = parseFrontmatter(source)
    if (!data.title || !data.date) continue

    byLocale[locale as Locale].push({
      slug,
      date: data.date,
      title: data.title,
      excerpt: data.excerpt ?? '',
      // Author-written Markdown, compiled into the bundle or read from the
      // server's own drop directory, never visitor input: the HTML it
      // produces is as trusted as the JSX around it.
      html: marked.parse(body, { async: false, gfm: true }),
    })
  }

  for (const posts of Object.values(byLocale)) {
    posts.sort((a, b) => b.date.localeCompare(a.date))
  }
  return byLocale
}

// The drop directory wins over what the build carried: a post placed on the
// server must be able to appear, or replace its bundled version, without a
// redeploy ever entering the picture.
export function overlayPosts(
  bundled: Record<Locale, Array<Post>>,
  extra: Record<Locale, Array<Post>>,
): Record<Locale, Array<Post>> {
  const merged: Record<Locale, Array<Post>> = { en: [], fr: [] }
  for (const locale of ['en', 'fr'] as const) {
    const bySlug = new Map(bundled[locale].map((post) => [post.slug, post]))
    for (const post of extra[locale]) bySlug.set(post.slug, post)
    merged[locale] = [...bySlug.values()].sort((a, b) =>
      b.date.localeCompare(a.date),
    )
  }
  return merged
}

const posts = parsePosts(sources)

export function bundledPosts(): Record<Locale, Array<Post>> {
  return posts
}
