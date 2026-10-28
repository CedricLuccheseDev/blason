import { createFileRoute } from '@tanstack/react-router'
import tableCss from '~/components/home/table/table.css?url'
import wordsCss from '~/components/home/table/words.css?url'
import backsCss from '~/components/home/table/backs.css?url'
import roomsCss from '~/components/home/table/rooms.css?url'
import { Home } from '~/components/home/Home'
import { fetchBlogIndex } from '~/content/posts.runtime'

// The home: the game's table, the journal on it reading the blog's posts.
export const Route = createFileRoute('/')({
  staticData: { chrome: false },
  loader: async () => {
    const { cards } = await fetchBlogIndex()
    // Newest first; on the same day, the later post (release-v0-4-0 after release-v0-3-0).
    return cards
      .flatMap((c) =>
        c.kind === 'post'
          ? [{ slug: c.slug, title: c.title, date: c.date }]
          : [],
      )
      .sort(
        (a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug),
      )
  },
  head: () => ({
    links: [tableCss, wordsCss, backsCss, roomsCss].map((href) => ({
      rel: 'stylesheet',
      href,
    })),
  }),
  component: Index,
})

function Index() {
  return <Home entries={Route.useLoaderData()} />
}
