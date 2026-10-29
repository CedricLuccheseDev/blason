import { Link } from '@tanstack/react-router'
import { Sheet } from '~/components/hud/Sheet'
import { useMessages } from '~/i18n'

// The journal, beside the public game and its buttons, as OpenFront's news:
// a sheet with its name, leading to the whole journal, then its last posts,
// each its date, its title and its first line, leading to it. They are read,
// not glanced at: written in Alegreya Sans, the game's plain hand, at full
// ink (« le journal est ignoble à lire », « la police est dur à lire »).

export type Entry = {
  slug: string
  title: string
  date: string
  excerpt: string
}

/** The posts shown: the last ones, as many as stand beside the card. */
const SHOWN = 3

export function Journal({ entries }: Readonly<{ entries: Array<Entry> }>) {
  const t = useMessages().home
  return (
    <Sheet className="flex h-full min-w-0 flex-col gap-2 p-4">
      <h2>
        <Link
          to="/blog"
          className="hud-press inline-flex min-h-11 items-center font-caps text-hud-l text-quill hover:text-gilt-deep"
        >
          {t.journal}
        </Link>
      </h2>
      <ul className="flex min-h-0 flex-1 flex-col divide-y divide-quill/20 overflow-hidden">
        {entries.slice(0, SHOWN).map((entry) => (
          <li key={entry.slug} className="py-2 first:pt-0">
            <Link
              to="/blog/$slug"
              params={{ slug: entry.slug }}
              className="hud-press group flex flex-col gap-1 font-figures text-quill"
            >
              <time dateTime={entry.date} className="text-hud-s">
                {entry.date}
              </time>
              <span className="text-hud-m leading-snug font-bold group-hover:text-gilt-deep">
                {entry.title}
              </span>
              <span className="line-clamp-2 text-hud-s leading-snug">
                {entry.excerpt}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        to="/blog"
        className="hud-note hud-press inline-flex min-h-11 items-center self-end hover:text-gilt-deep"
      >
        {t.journalAll}
      </Link>
    </Sheet>
  )
}
