import { Link } from '@tanstack/react-router'
import { Figure } from '~/components/hud/Figure'
import { Panel, Stack } from '~/components/hud/Layout'
import { Fine, Title, Word } from '~/components/hud/Text'
import { useMessages } from '~/i18n'

// The journal, beside the public game and its buttons, as OpenFront's news:
// a sheet with its name, leading to the whole journal, then its last posts,
// each its date, its title and its first line, leading to it, at full ink:
// they are read, not glanced at (« le journal est ignoble à lire »).

export type Entry = {
  slug: string
  title: string
  date: string
  excerpt: string
}

/** The posts offered: the last ones; beside the card, those that fit whole. */
const SHOWN = 3

export function Journal({ entries }: Readonly<{ entries: Array<Entry> }>) {
  const t = useMessages().home
  // Beside the card, the sheet takes the height of the card and its buttons,
  // never more: its top and its foot on theirs. A post that does not fit
  // whole wraps into a second column, out of sight.
  return (
    <div className="relative min-w-0">
      <Panel page className="min-w-0 lg:absolute lg:inset-0">
        <h2>
          <Link
            to="/blog"
            className="hud-press inline-flex min-h-11 items-center hover:text-gilt-deep"
          >
            <Title className="text-current">{t.journal}</Title>
          </Link>
        </h2>
        <ul className="flex min-h-0 flex-1 flex-col flex-wrap content-start divide-y divide-quill/20 overflow-hidden">
          {entries.slice(0, SHOWN).map((entry) => (
            <li key={entry.slug} className="w-full">
              <Link
                to="/blog/$slug"
                params={{ slug: entry.slug }}
                className="hud-press group block"
              >
                <Stack gap="hair" className="hud-row">
                  <time dateTime={entry.date}>
                    <Figure size="s">{entry.date}</Figure>
                  </time>
                  <Word className="leading-snug font-semibold group-hover:text-gilt-deep">
                    {entry.title}
                  </Word>
                  <Fine className="line-clamp-2 leading-snug">
                    {entry.excerpt}
                  </Fine>
                </Stack>
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
      </Panel>
    </div>
  )
}
