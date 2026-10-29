import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Leaf } from '~/components/home/Leaf'
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
    <Leaf
      title={post.title}
      line={post.date}
      above={
        <Link to="/blog" className="hud-note hover:text-gilt-deep">
          {m.blog.back}
        </Link>
      }
    >
      {/* Author-written Markdown, compiled into the bundle at build time.
          No visitor input ever reaches this string. */}
      <div
        className="hud-prose"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </Leaf>
  )
}
