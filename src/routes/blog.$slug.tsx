import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { fetchBlogPost } from '~/content/posts.runtime'
import { useMessages } from '~/i18n'
import { SITE_URL } from '~/lib/site'

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const { locale, post } = await fetchBlogPost({ data: params.slug })
    if (!post) throw notFound()
    return { locale, post }
  },
  head: ({ loaderData, params }) => {
    const post = loaderData?.post
    if (!post) return {}
    return {
      meta: [
        { title: post.title },
        { name: 'description', content: post.excerpt },
        { property: 'og:title', content: post.title },
        { property: 'og:description', content: post.excerpt },
        { property: 'og:type', content: 'article' },
        { property: 'article:published_time', content: post.date },
      ],
      links: [{ rel: 'canonical', href: `${SITE_URL}/blog/${params.slug}` }],
    }
  },
  component: PostPage,
})

function PostPage() {
  const m = useMessages()
  const { post } = Route.useLoaderData()

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-20">
      <Link
        to="/blog"
        className="rise-in type-label inline-block hover:text-ink"
      >
        {m.blog.back}
      </Link>
      <h1 className="rise-in stagger-1 mt-8 font-display text-3xl font-bold tracking-tight">
        {post.title}
      </h1>
      <time
        dateTime={post.date}
        className="rise-in stagger-1 mt-3 block font-mono text-xs text-dim"
      >
        {post.date}
      </time>
      {/* Author-written Markdown, compiled into the bundle at build time.
          No visitor input ever reaches this string. */}
      <div
        className="rise-in stagger-2 prose-ink mt-12"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </main>
  )
}
