import { createFileRoute } from '@tanstack/react-router'
import { BlogCard } from '~/components/blog/BlogCard'
import { Leaf } from '~/components/home/Leaf'
import { Stack } from '~/components/hud/Layout'
import { Note } from '~/components/hud/Text'
import { fetchBlogIndex } from '~/content/posts.runtime'
import { dictionaries, useMessages } from '~/i18n'
import { SITE_URL } from '~/lib/site'

// The journal: one column of entries, newest first, what was written and
// what shipped, on a leaf of the game's book (Leaf.tsx).
export const Route = createFileRoute('/blog/')({
  loader: async () => await fetchBlogIndex(),
  head: ({ loaderData }) => {
    const m = dictionaries[loaderData?.locale === 'fr' ? 'fr' : 'en'].blog
    return {
      meta: [
        { title: m.metaTitle },
        { name: 'description', content: m.metaDescription },
        { property: 'og:title', content: m.metaTitle },
        { property: 'og:description', content: m.metaDescription },
        { property: 'og:type', content: 'website' },
      ],
      links: [{ rel: 'canonical', href: `${SITE_URL}/blog` }],
    }
  },
  component: BlogIndex,
})

function BlogIndex() {
  const m = useMessages()
  const { cards } = Route.useLoaderData()

  return (
    <Leaf title={m.home.journal} line={m.blog.intro}>
      {cards.length === 0 ? (
        <Note>{m.blog.empty}</Note>
      ) : (
        <ol>
          <Stack gap="piece">
            {cards.map((card) => (
              <li key={card.kind === 'post' ? card.slug : card.version}>
                <BlogCard card={card} />
              </li>
            ))}
          </Stack>
        </ol>
      )}
    </Leaf>
  )
}
