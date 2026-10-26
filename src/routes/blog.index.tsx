import { createFileRoute } from '@tanstack/react-router'
import { BlogCard } from '~/components/blog/BlogCard'
import { fetchBlogIndex } from '~/content/posts.runtime'
import { dictionaries, useMessages } from '~/i18n'
import { SITE_URL } from '~/lib/site'

// One column of cards, newest first: what was written, and what shipped.
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
    <main className="mx-auto w-full max-w-2xl px-5 py-20">
      <h1 className="rise-in font-display text-3xl font-bold tracking-tight">
        {m.blog.title}
      </h1>
      <p className="rise-in stagger-1 mt-3 text-dim">{m.blog.intro}</p>

      {cards.length === 0 ? (
        <p className="rise-in stagger-2 mt-14 text-dim">{m.blog.empty}</p>
      ) : (
        <ol className="rise-in stagger-2 mt-14 flex flex-col gap-5">
          {cards.map((card) => (
            <li key={card.kind === 'post' ? card.slug : card.version}>
              <BlogCard card={card} />
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
