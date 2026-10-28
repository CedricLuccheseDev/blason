import { createServerFn } from '@tanstack/react-start'
import { bundledPosts, overlayPosts, parsePosts } from './posts'
import { mergeCards } from './blog'
import { releases } from './changelog'
import type { Post } from './posts'
import type { BlogCard } from './blog'
import type { Locale } from '~/i18n/locale'
import { getLocale } from '~/i18n/locale'

// Where Dokploy bind-mounts the per-project drop directory
// (`/var/lib/blog/<projet>` on the host, read-only in the container).
// Publishing a post is writing two Markdown files there: no build, no deploy,
// no version bump. Absent in local dev, where the bundled posts alone serve.
const DROP_DIR = '/blog-posts'

async function readDropped(): Promise<Record<string, string>> {
  const fs = await import('node:fs/promises')
  try {
    const names = await fs.readdir(DROP_DIR)
    const entries = await Promise.all(
      names
        .filter((name) => name.endsWith('.md'))
        .map(
          async (name) =>
            [name, await fs.readFile(`${DROP_DIR}/${name}`, 'utf-8')] as const,
        ),
    )
    return Object.fromEntries(entries)
  } catch {
    // No mount: local dev, or an environment that never received a post.
    return {}
  }
}

export async function loadPosts(locale: Locale): Promise<Array<Post>> {
  return overlayPosts(bundledPosts(), parsePosts(await readDropped()))[locale]
}

// The routes go through these server functions rather than importing the
// posts module: a client-side navigation must ask the server, because only
// the server sees the drop directory. This is also what keeps every post out
// of the client bundle.
export const fetchBlogIndex = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ locale: Locale; cards: Array<BlogCard> }> => {
    const locale = await getLocale()
    return {
      locale,
      cards: mergeCards(await loadPosts(locale), releases, locale),
    }
  },
)

export const fetchBlogPost = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  .handler(
    async ({ data: slug }): Promise<{ locale: Locale; post: Post | null }> => {
      const locale = await getLocale()
      const posts = await loadPosts(locale)
      return { locale, post: posts.find((post) => post.slug === slug) ?? null }
    },
  )
