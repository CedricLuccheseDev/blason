import { createFileRoute } from '@tanstack/react-router'
import { Home } from '~/components/home/Home'
import { fetchBlogIndex } from '~/content/posts.runtime'

// The home: the menu, the next public game, the journal reading the blog's posts.
export const Route = createFileRoute('/')({
  loader: async () => {
    const { cards } = await fetchBlogIndex()
    // Newest first; on the same day, the later post (release-v0-4-0 after release-v0-3-0).
    return cards
      .flatMap((c) =>
        c.kind === 'post'
          ? [
              {
                slug: c.slug,
                title: c.title,
                date: c.date,
                excerpt: c.excerpt,
              },
            ]
          : [],
      )
      .sort(
        (a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug),
      )
  },
  component: Index,
})

function Index() {
  return <Home entries={Route.useLoaderData()} />
}
