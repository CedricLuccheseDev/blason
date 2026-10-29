import { Link } from '@tanstack/react-router'
import type { BlogCard as Card } from '~/content/blog'
import { Inline, Stack } from '~/components/hud/Layout'
import { Call, Fine, Word } from '~/components/hud/Text'
import { useMessages } from '~/i18n'

// An entry of the journal, in the HUD's levels: what it is and its date on
// a line, its title, and a few lines of it; ruled under, as a list's line.
// Dates stay ISO, in figures: they are data, and a locale-formatted date
// risks drifting between the server render and the browser one.

export function BlogCard({ card }: { card: Card }) {
  return card.kind === 'post' ? (
    <PostCard card={card} />
  ) : (
    <ReleaseCard card={card} />
  )
}

/** What an entry is and when, on one line. */
function Head({ kind, date }: Readonly<{ kind: string; date: string }>) {
  return (
    <Inline gap="part">
      <Word className="font-caps text-gilt-deep">{kind}</Word>
      <time dateTime={date} className="hud-figure text-hud-s opacity-70">
        {date}
      </time>
    </Inline>
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
      className="group block border-b border-quill/30"
    >
      <Stack gap="hair" className="pb-4">
        <Head kind={m.blog.post} date={card.date} />
        <h2>
          <Call className="group-hover:text-gilt-deep">{card.title}</Call>
        </h2>
        {card.excerpt ? <Fine>{card.excerpt}</Fine> : null}
        <Word className="italic text-gilt-deep">{m.blog.read}</Word>
      </Stack>
    </Link>
  )
}

// No link and no page of its own: a release is its lines, and they fit here.
function ReleaseCard({
  card,
}: Readonly<{ card: Extract<Card, { kind: 'release' }> }>) {
  const m = useMessages()

  return (
    <article className="border-b border-quill/30">
      <Stack gap="hair" className="pb-4">
        <Head kind={m.blog.release} date={card.date} />
        <h2>
          <Call>v{card.version}</Call>
        </h2>
        <div className="hud-prose">
          <ul>
            {card.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </Stack>
    </article>
  )
}
