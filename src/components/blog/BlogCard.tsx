import { Link } from '@tanstack/react-router'
import type { BlogCard as Card } from '~/content/blog'
import { useMessages } from '~/i18n'

// Dates stay ISO and mono: they are data, and a locale-formatted date risks
// drifting between the server render and the browser one.
const cardClass = 'block border border-hairline bg-card p-6 transition-colors'
const metaClass = 'flex items-baseline gap-4 font-mono text-xs text-dim'

export function BlogCard({ card }: { card: Card }) {
  return card.kind === 'post' ? (
    <PostCard card={card} />
  ) : (
    <ReleaseCard card={card} />
  )
}

function PostCard({
  card,
}: Readonly<{ card: Extract<Card, { kind: 'post' }> }>) {
  const m = useMessages()

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: card.slug }}
      className={`${cardClass} hover:border-ink`}
    >
      <div className={metaClass}>
        <span className="type-label">{m.blog.post}</span>
        <time dateTime={card.date}>{card.date}</time>
      </div>
      <h2 className="mt-3 font-display text-xl font-bold tracking-tight">
        {card.title}
      </h2>
      {card.excerpt ? (
        <p className="mt-2 text-sm leading-relaxed text-dim">{card.excerpt}</p>
      ) : null}
      <span className="mt-4 inline-block text-sm font-semibold text-accent">
        {m.blog.read}
      </span>
    </Link>
  )
}

// No link and no page of its own: a release is its lines, and they fit here.
function ReleaseCard({
  card,
}: Readonly<{ card: Extract<Card, { kind: 'release' }> }>) {
  const m = useMessages()

  return (
    <article className={cardClass}>
      <div className={metaClass}>
        <span className="type-label">{m.blog.release}</span>
        <time dateTime={card.date}>{card.date}</time>
      </div>
      <h2 className="mt-3 font-display text-xl font-bold tracking-tight">
        v{card.version}
      </h2>
      <ul className="mt-3 space-y-2">
        {card.lines.map((line) => (
          <li key={line} className="text-sm leading-relaxed">
            {line}
          </li>
        ))}
      </ul>
    </article>
  )
}
